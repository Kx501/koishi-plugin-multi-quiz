import { Context, Session } from 'koishi'
import { Config, log } from './config'
import { } from 'koishi-plugin-monetary'

export const inject = {
  required: ['http'],
  optional: ['database', 'monetary']
}

export const name = 'multi-quiz'

export * from './config'

export const usage = `接口使用：[天聚数行](https://www.tianapi.com/)`;
export function apply(ctx: Context, config: Config) {
  const MAX_CALLS = config.maxCall;
  const timeout = config.timeout;

  let callCounts = {};
  let apiKeys = {};

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
      const types = Object.keys(callCounts);
      for (let i = 0; i < types.length; i++) {
        const randomType = types[Math.floor(Math.random() * types.length)];
        const question = await fetchQuestion(randomType);
        if (question) {
          session.send(formatQuestion(randomType, question));
          const userAnswer = await session.prompt(timeout);
          if (userAnswer) return await verifyAnswer(session, randomType, question, userAnswer);
          else return '会话超时';
        }
      }
      return '暂时没有可用的题目，请稍后再试。';
    });

  ctx.command('quiz').subcommand('poetry', '诗词知识竞答')
    .alias('诗趣')
    .action(async ({ session }) => {
      const question = await fetchQuestion('诗趣');
      if (!question) return '暂时没有可用的诗趣题目，请稍后再试。';
      session.send(formatQuestion('诗趣', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '诗趣', question, userAnswer.toUpperCase());
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('trivia', '百科')
    .alias('百科')
    .action(async ({ session }) => {
      const question = await fetchQuestion('百科');
      if (!question) return '暂时没有可用的百科题目，请稍后再试。';
      session.send(formatQuestion('百科', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '百科', question, userAnswer.toUpperCase());
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

  ctx.command('quiz').subcommand('judgment', '判断')
    .alias('判断')
    .action(async ({ session }) => {
      const question = await fetchQuestion('判断');
      if (!question) return '暂时没有可用的判断题目，请稍后再试。';
      session.send(formatQuestion('判断', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '判断', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('fillpoetry', '填诗')
    .alias('填诗')
    .action(async ({ session }) => {
      const question = await fetchQuestion('填诗');
      if (!question) return '暂时没有可用的填诗题目，请稍后再试。';
      session.send(formatQuestion('填诗', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '填诗', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('idiom', '成语')
    .alias('成语')
    .action(async ({ session }) => {
      const question = await fetchQuestion('成语');
      if (!question) return '暂时没有可用的成语题目，请稍后再试。';
      session.send(formatQuestion('成语', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '成语', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('riddle', '谜语')
    .alias('谜语')
    .action(async ({ session }) => {
      const question = await fetchQuestion('谜语');
      if (!question) return '暂时没有可用的谜语，请稍后再试。';
      session.send(formatQuestion('谜语', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '谜语', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('lanternriddle', '灯谜')
    .alias('灯谜')
    .action(async ({ session }) => {
      const question = await fetchQuestion('灯谜');
      if (!question) return '暂时没有可用的灯谜，请稍后再试。';
      session.send(formatQuestion('灯谜', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '灯谜', question, userAnswer);
      else return '会话超时';
    });

  ctx.command('quiz').subcommand('charpuzzle', '字谜')
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

  ctx.command('quiz').subcommand('advertisement', '猜产品')
    .alias('广告')
    .action(async ({ session }) => {
      const question = await fetchQuestion('广告');
      if (!question) return '暂时没有可用的广告题目，请稍后再试。';
      session.send(formatQuestion('广告', question));
      const userAnswer = await session.prompt(timeout);
      if (userAnswer) await verifyAnswer(session, '广告', question, userAnswer);
      else return '会话超时';
    });

  function formatQuestion(type: string, question: any) {
    if (type === '诗趣') return `【诗趣】: ${question.question}\nA: ${question.answer_a}\nB: ${question.answer_b}\nC: ${question.answer_c}`;
    else if (type === '百科') return `【百科】: ${question.title}\nA: ${question.answerA}\nB: ${question.answerB}\nC: ${question.answerC}\nD: ${question.answerD}`;
    else if (type === '竞答') return `【竞答】: ${question.quest}`;
    else if (type === '判断') return `【判断】: ${question.title}`;
    else if (type === '填诗') return `【填诗】: ${question.quest}`;
    else if (type === '成语') return `【成语】: ${question.question}`;
    else if (type === '谜语') return `【谜语】: ${question.quest}`;
    else if (type === '灯谜') return `【灯谜】: ${question.riddle} (${question.type})`;
    else if (type === '字谜') return `【字谜】: ${question.content}`;
    else if (type === '烧脑') return `【烧脑】: ${question.list[0].quest}`;
    else if (type === '广告') return `【广告】: ${question.content}`;
    else return 'Unknown question type';
  }

  async function verifyAnswer(session: Session, type: string, question: any, userAnswer: string) {
    let isCorrect = false;

    if (type === '判断') isCorrect = (userAnswer === '对' && question.answer === 1) || (userAnswer === '错' && question.answer === 0);
    else if (type === '烧脑') {
      const correctAnswer = question.list[0].result;
      const distance = levenshteinDistance(userAnswer, correctAnswer);
      const maxLength = Math.max(userAnswer.length, correctAnswer.length);
      const similarity = (maxLength - distance) / maxLength;
      isCorrect = similarity >= config.similarity;
    }
    else {
      // 对于其他所有类型，只需要检查 userAnswer 和 question.answer 是否相等
      const standardTypes = ['诗趣', '百科', '竞答', '填诗', '成语', '谜语', '灯谜', '字谜', '广告'];
      if (!standardTypes.includes(type)) throw new Error(`Unknown question type: ${type}`);
      isCorrect = userAnswer === (type === '竞答' ? question.result : question.answer);
    }

    if (isCorrect) {
      if (ctx.monetary && config.balance?.enable) {
        let userAid: number;
        userAid = (await ctx.database.get('binding', { pid: [session.userId] }, ['aid']))[0]?.aid;
        ctx.monetary.gain(userAid, config.balance.much);
        session.send(`恭喜你，回答正确！积分 +${config.balance.much}`);
      } else session.send('恭喜你，回答正确！');
    }
    else {
      let correctAnswer = question.answer;
      if (type === '诗趣') correctAnswer = `${question.answer}\n【解析】: ${question.analytic}`;
      else if (type === '竞答') correctAnswer = question.result;
      else if (type === '判断') correctAnswer = question.answer === 1 ? '对' : '错';
      else if (type === '填诗') correctAnswer = `${question.answer}\n【出处】: ${question.source}`;
      else if (type === '成语') correctAnswer = `${question.answer}（注音: ${question.pinyin}）\n【出处】: ${question.source}`;
      else if (type === '字谜') correctAnswer = `${question.answer}\n【解释】: ${question.reason}`;
      else if (type === '烧脑') correctAnswer = question.list[0].result;

      if (ctx.monetary && config.balance?.enable) {
        let userAid: number;
        userAid = (await ctx.database.get('binding', { pid: [session.userId] }, ['aid']))[0]?.aid;
        let balance = (await ctx.database.get('monetary', { uid: userAid }, ['value']))[0]?.value;
        // 如果不足或未定义，则不扣除
        if (balance === undefined) ctx.monetary.gain(userAid, 0);
        if (balance >= config.balance.reduce) {
          ctx.monetary.cost(userAid, config.balance.reduce);
          session.send(`回答错误，积分 -${config.balance.reduce}`);
        }
      } else session.send(`很遗憾，回答错误。`);
      session.send(`正确答案是：${correctAnswer}`);
    }
  }

  function levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;

    let matrix = [];

    // 初始化矩阵
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // 填充矩阵
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // 替换
            matrix[i][j - 1] + 1,     // 插入
            matrix[i - 1][j] + 1      // 删除
          );
        }
      }
    }

    return matrix[len1][len2];
  }
}