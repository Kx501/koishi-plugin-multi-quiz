import { capitalize, Context, Random, Session } from 'koishi'
import { Config, log } from './config'
import { formatQuestion } from './utils'
import { } from 'koishi-plugin-monetary'
import { } from 'koishi-plugin-davinci-003'
import { questionL } from './list';

export const inject = {
  required: ['http'],
  optional: ['database', 'monetary', 'dvc']
}

export const name = 'multi-quiz'

export * from './config'

export const usage = `接口使用：[天聚数行](https://www.tianapi.com/)\n
需要dvc服务用于验证脑筋急转弯答案`;
export function apply(ctx: Context, config: Config) {
  const MAX_CALLS = config.maxCall;
  const timeout = config.timeout;

  let callCounts = {};
  let apiKeys = {};
  let currentQuestion = {};
  let currentType = {};
  let currentAnswer = {};
  let gameStarted = {};
  let timer = {};
  let answering = {};

  config.keysDict.forEach((entry, index) => {
    entry.questionTypes.forEach(type => {
      if (!callCounts[type]) {
        callCounts[type] = [];
        apiKeys[type] = [];
      }
      callCounts[type][index] = 0;
      apiKeys[type][index] = entry.key;
    });
  });

  async function fetchQuestion(type: string) {
    const counts = callCounts[type];
    const keys = apiKeys[type];

    if (keys.length === 0) return null; // 跳过为空的列表

    let index = counts.findIndex((count: number) => count < MAX_CALLS);

    if (index === -1) return null; // 跳过所有 key 达到上限的类型

    let url: string;

    if (type === '诗趣') url = `https://apis.tianapi.com/scwd/index?key=${keys[index]}`;
    else if (type === '百科') url = `https://apis.tianapi.com/baiketiku/index?key=${keys[index]}`;
    else if (type === '竞答') url = `https://apis.tianapi.com/wenda/index?key=${keys[index]}`;
    else if (type === '判断') url = `https://apis.tianapi.com/decide/index?key=${keys[index]}`;
    else if (type === '填诗') url = `https://apis.tianapi.com/duishici/index?key=${keys[index]}`;
    else if (type === '成语') url = `https://apis.tianapi.com/caichengyu/index?key=${keys[index]}`;
    else if (type === '谜语') url = `https://apis.tianapi.com/riddle/index?key=${keys[index]}`;
    else if (type === '灯谜') url = `https://apis.tianapi.com/caizimi/index?key=${keys[index]}`;
    else if (type === '字谜') url = `https://apis.tianapi.com/zimi/index?key=${keys[index]}`;
    else if (type === '烧脑') url = `https://apis.tianapi.com/naowan/index?key=${keys[index]}`;
    else if (type === '广告') url = `https://apis.tianapi.com/slogan/index?key=${keys[index]}`;
    else throw new Error(`Unknown question type: ${type}`);

    const response = (await ctx.http('POST', url)).data;

    if (response.code === 200) {
      counts[index]++;
      return response.result;
    } else if (response.code === 150) counts[index] = MAX_CALLS;
    throw new Error(`API error: ${response.msg}`);
  }


  ctx.command('quiz', '随机答题')
    .alias('答题')
    .action(async ({ session }) => {
      const randomType = Random.pick(questionL);
      const question = await fetchQuestion(randomType);
      if (!question) return '暂时没有可用的题目，请稍后再试。';
      session.send(formatQuestion(randomType, question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, randomType, question, capitalize(userAnswer));
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('buzz', '多人抢答模式')
    .alias('抢答')
    .action(async ({ session }) => {
      const channelId = session.channelId;
      if (gameStarted[channelId]) return '抢答游戏已经在进行中，请等待当前游戏结束。';
      gameStarted[channelId] = true;
      startBuzzGame(session);
    });

  // 下一题
  function startBuzzGame(session: Session) {
    const channelId = session.channelId;
    gameStarted[channelId] = true; // 修复false
    const randomType = Random.pick(questionL);
    fetchQuestion(randomType).then(question => {
      if (!question) {
        gameStarted[channelId] = false;
        session.send('暂时没有可用的题目，请稍后再试。');
        return;
      }
      currentQuestion[channelId] = question;
      currentType[channelId] = randomType;
      session.send(formatQuestion(randomType, question));

      timer[channelId] = setTimeout(() => {
        session.send('时间到，没有人回答正确。');
        if (currentAnswer[channelId] !== null) {
          session.send(currentAnswer[channelId]);
          currentAnswer[channelId] = null; // 由于只在答题时才会刷新答案，所以需要清除超时前一次的答案
        }
        gameStarted[channelId] = false;
      }, timeout);
    });
  }

  ctx.command('quiz').subcommand('answer <answer>', '抢答答题')
    .alias('答')
    .action(async ({ session }, answer) => {
      const channelId = session.channelId;
      if (!gameStarted[channelId] || !currentQuestion[channelId]) return '当前没有进行中的抢答游戏。';
      if (answering[channelId]) return;

      answering[channelId] = true; // 尝试修复两次极短时间的回答
      const isCorrect = await verifyAnswer(session, currentType[channelId], currentQuestion[channelId], answer);
      answering[channelId] = false;

      if (isCorrect) {
        clearTimeout(timer[channelId]);  // 这里会修改状态为false，实际为true
        // 进入下一次循环
        startBuzzGame(session);
      }
    });

  ctx.command('quiz').subcommand('poetry', '诗词知识')
    .alias('诗趣')
    .action(async ({ session }) => {
      const question = await fetchQuestion('诗趣');
      if (!question) return '暂时没有可用的诗趣题目，请稍后再试。';
      session.send(formatQuestion('诗趣', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '诗趣', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('trivia', '趣味百科')
    .alias('百科')
    .action(async ({ session }) => {
      const question = await fetchQuestion('百科');
      if (!question) return '暂时没有可用的百科题目，请稍后再试。';
      session.send(formatQuestion('百科', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '百科', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('qa', '知识竞答')
    .alias('竞答')
    .action(async ({ session }) => {
      const question = await fetchQuestion('竞答');
      if (!question) return '暂时没有可用的竞答题目，请稍后再试。';
      session.send(formatQuestion('竞答', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '竞答', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('judgment', '判断题')
    .alias('判断')
    .action(async ({ session }) => {
      const question = await fetchQuestion('判断');
      if (!question) return '暂时没有可用的判断题目，请稍后再试。';
      session.send(formatQuestion('判断', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '判断', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('fillpoetry', '填对诗词')
    .alias('填诗')
    .action(async ({ session }) => {
      const question = await fetchQuestion('填诗');
      if (!question) return '暂时没有可用的填诗题目，请稍后再试。';
      session.send(formatQuestion('填诗', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '填诗', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('idiom', '猜成语')
    .alias('成语')
    .action(async ({ session }) => {
      const question = await fetchQuestion('成语');
      if (!question) return '暂时没有可用的成语题目，请稍后再试。';
      session.send(formatQuestion('成语', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '成语', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('riddle', '猜谜语')
    .alias('谜语')
    .action(async ({ session }) => {
      const question = await fetchQuestion('谜语');
      if (!question) return '暂时没有可用的谜语，请稍后再试。';
      session.send(formatQuestion('谜语', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '谜语', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('lanternriddle', '猜灯谜')
    .alias('灯谜')
    .action(async ({ session }) => {
      const question = await fetchQuestion('灯谜');
      if (!question) return '暂时没有可用的灯谜，请稍后再试。';
      session.send(formatQuestion('灯谜', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '灯谜', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('charpuzzle', '猜字谜')
    .alias('字谜')
    .action(async ({ session }) => {
      const question = await fetchQuestion('字谜');
      if (!question) return '暂时没有可用的字谜，请稍后再试。';
      session.send(formatQuestion('字谜', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '字谜', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('brainteaser', '脑筋急转弯')
    .alias('烧脑')
    .action(async ({ session }) => {
      const question = await fetchQuestion('烧脑');
      if (!question) return '暂时没有可用的脑筋急转弯题目，请稍后再试。';
      session.send(formatQuestion('烧脑', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '烧脑', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('advertise', '猜广告产品')
    .alias('广告')
    .action(async ({ session }) => {
      const question = await fetchQuestion('广告');
      if (!question) return '暂时没有可用的广告题目，请稍后再试。';
      session.send(formatQuestion('广告', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '广告', question, userAnswer);
      else return '会话超时';
    });


  async function verifyAnswer(session: Session, type: string, question: any, userAnswer: string) {
    let isCorrect = false;
    if (type === '百科' || type === '诗趣') userAnswer = capitalize(userAnswer);

    if (type === '判断') isCorrect = (userAnswer === '对' && question.answer === 1) || (userAnswer === '错' && question.answer === 0);
    else if (type === '烧脑') {
      if (ctx.dvc) {
        let dvcTXT = await ctx.dvc.chat_with_gpt([{
          role: 'system',
          content: `${config.dvcrole}`
        }, {
          role: 'user',
          content: `脑筋急转弯：${question.list[0].quest}\n参考答案：${question.list[0].result}\n用户回答：${userAnswer}`
        }])
        log.debug(`脑筋急转弯：${question.list[0].quest}\n参考答案：${question.list[0].result}\n用户回答：${userAnswer}\nGPT回答：${dvcTXT}`);
        if (dvcTXT === 'True') isCorrect = true;
      } else throw new Error('请先安装dvc服务');
    }
    else {
      const standardTypes = ['诗趣', '百科', '竞答', '填诗', '成语', '谜语', '灯谜', '字谜', '广告'];
      if (!standardTypes.includes(type)) throw new Error(`Unknown question type: ${type}`);
      isCorrect = userAnswer === (type === '竞答' ? question.result : question.answer);
    }

    if (isCorrect) {
      if (ctx.monetary && config.balance?.enable) {
        let userAid: number;
        userAid = (await ctx.database.get('binding', { pid: [session.userId] }, ['aid']))[0]?.aid;
        ctx.monetary.gain(userAid, config.balance.gain);
        session.send(`恭喜你，回答正确！积分 +${config.balance.gain}`);
      } else session.send('恭喜你，回答正确！');
    }
    else {
      let correctAnswer = question.answer;
      if (type === '诗趣') correctAnswer = `${question.answer}\n【解析】: ${question.analytic}`;
      else if (type === '竞答') correctAnswer = question.result;
      else if (type === '判断') correctAnswer = (question.answer === 1 ? '对' : '错') + `【解析】: ${question.analyse}`;
      else if (type === '填诗') correctAnswer = `${question.answer}\n【出处】: ${question.source}`;
      else if (type === '成语') correctAnswer = `${question.answer}（注音: ${question.pinyin}）\n【出处】: ${question.source}`;
      else if (type === '字谜') correctAnswer = `${question.answer}\n【解释】: ${question.reason}`;
      else if (type === '烧脑') correctAnswer = question.list[0].result;

      if (ctx.monetary && config.balance?.enable) {
        let userAid: number;
        userAid = (await ctx.database.get('binding', { pid: [session.userId] }, ['aid']))[0]?.aid;
        let balance = (await ctx.database.get('monetary', { uid: userAid }, ['value']))[0]?.value;
        if (balance === undefined) ctx.monetary.gain(userAid, 0);
        if (balance >= config.balance.cost) {
          ctx.monetary.cost(userAid, config.balance.cost);
          session.send(`回答错误，积分 -${config.balance.cost}`);
        } else session.send(`回答错误，你的积分不足。`);
      } else session.send(`很遗憾，回答错误。`);
      const channelId = session.channelId;
      if (gameStarted[channelId] !== null) currentAnswer[channelId] = `正确答案是：${correctAnswer}`;
      else session.send(`正确答案是：${correctAnswer}`);
    }

    return isCorrect;
  }
}