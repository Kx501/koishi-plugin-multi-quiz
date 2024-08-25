import { Context, Session } from 'koishi'
import { Config, log } from './config'
import { } from 'koishi-plugin-monetary'

export const inject = {
  required: ['http'],
  optional: ['database', 'monetary']
}

export const name = 'multi-quiz'

export * from './config'

export const usage = `接口使用：[天聚数行|https://www.tianapi.com/]`;
export function apply(ctx: Context, config: Config) {
  const MAX_CALLS = config.maxCall;
  const timeout = config.timeout;

  let callCounts = {
    选诗: Array(config.commonKeys.length).fill(0),
    百科: Array(config.commonKeys.length).fill(0),
    问答: Array(config.commonKeys.length).fill(0),
    判断: Array(config.commonKeys.length).fill(0),
    填诗: Array(config.commonKeys.length).fill(0),
    成语: Array(config.commonKeys.length).fill(0),
    谜语: Array(config.commonKeys.length).fill(0),
    灯谜: Array(config.commonKeys.length).fill(0),
    字谜: Array(config.commonKeys.length).fill(0),
    脑筋急转弯: Array(config.commonKeys.length).fill(0)
  };

  let apiKeys = config.commonKeys;

  async function fetchQuestion(type: string) {
    const counts = callCounts[type];

    if (apiKeys.length === 0) return null; // 跳过为空的列表

    let index = counts.findIndex((count: number) => count < MAX_CALLS);

    if (index === -1) return null; // 跳过所有 key 达到上限的类型

    let url: string;

    if (type === '选诗') url = `https://apis.tianapi.com/scwd/index?key=${apiKeys[index]}`;
    else if (type === '百科') url = `https://apis.tianapi.com/baiketiku/index?key=${apiKeys[index]}`;
    else if (type === '问答') url = `https://apis.tianapi.com/wenda/index?key=${apiKeys[index]}`;
    else if (type === '判断') url = `https://apis.tianapi.com/decide/index?key=${apiKeys[index]}`;
    else if (type === '填诗') url = `https://apis.tianapi.com/duishici/index?key=${apiKeys[index]}`;
    else if (type === '成语') url = `https://apis.tianapi.com/caichengyu/index?key=${apiKeys[index]}`;
    else if (type === '谜语') url = `https://apis.tianapi.com/riddle/index?key=${apiKeys[index]}`;
    else if (type === '灯谜') url = `https://apis.tianapi.com/caizimi/index?key=${apiKeys[index]}`;
    else if (type === '字谜') url = `https://apis.tianapi.com/zimi/index?key=${apiKeys[index]}`;
    else if (type === '脑筋急转弯') url = `https://apis.tianapi.com/naowan/index?key=${apiKeys[index]}`;
    else throw new Error(`Unknown question type: ${type}`);

    const response = (await ctx.http('POST', url)).data;

    if (response.code === 200) {
      counts[index]++;
      return response.result;
    } else {
      throw new Error(`API error: ${response.msg}`);
    }
  }

  ctx.command('quiz', '随机答题')
    .alias('答题')
    .action(async ({ session }) => {
      const types = config.questionTypes;
      for (let i = 0; i < types.length; i++) {
        const randomType = types[Math.floor(Math.random() * types.length)];
        const question = await fetchQuestion(randomType);
        if (question) {
          session.send(formatQuestion(randomType, question));
          const userAnswer = await session.prompt(timeout);
          await verifyAnswer(session, randomType, question, userAnswer);
          return;
        }
      }
      session.send('暂时没有可用的题目，请稍后再试。');
    });

  ctx.command('quiz').subcommand('poetry', '选诗')
    .alias('诗选')
    .action(async ({ session }) => {
      const question = await fetchQuestion('选诗');
      if (!question) {
        session.send('暂时没有可用的选诗题目，请稍后再试。');
        return;
      }
      session.send(formatQuestion('选诗', question));
      const userAnswer = await session.prompt(timeout);
      await verifyAnswer(session, '选诗', question, userAnswer);
    });

  ctx.command('quiz').subcommand('trivia', '百科')
    .alias('百科')
    .action(async ({ session }) => {
      const question = await fetchQuestion('百科');
      if (!question) {
        session.send('暂时没有可用的百科题目，请稍后再试。');
        return;
      }
      session.send(formatQuestion('百科', question));
      const userAnswer = await session.prompt(timeout);
      await verifyAnswer(session, '百科', question, userAnswer);
    });

  ctx.command('quiz').subcommand('qa', '问答')
    .alias('问答')
    .action(async ({ session }) => {
      const question = await fetchQuestion('问答');
      if (!question) {
        session.send('暂时没有可用的问答题目，请稍后再试。');
        return;
      }
      session.send(formatQuestion('问答', question));
      const userAnswer = await session.prompt(timeout);
      await verifyAnswer(session, '问答', question, userAnswer);
    });

  ctx.command('quiz').subcommand('judgment', '判断')
    .alias('判断')
    .action(async ({ session }) => {
      const question = await fetchQuestion('判断');
      if (!question) {
        session.send('暂时没有可用的判断题目，请稍后再试。');
        return;
      }
      session.send(formatQuestion('判断', question));
      const userAnswer = await session.prompt(timeout);
      await verifyAnswer(session, '判断', question, userAnswer);
    });

  ctx.command('quiz').subcommand('fillpoetry', '填诗')
    .alias('填诗')
    .action(async ({ session }) => {
      const question = await fetchQuestion('填诗');
      if (!question) {
        session.send('暂时没有可用的填诗题目，请稍后再试。');
        return;
      }
      session.send(formatQuestion('填诗', question));
      const userAnswer = await session.prompt(timeout);
      await verifyAnswer(session, '填诗', question, userAnswer);
    });

  ctx.command('quiz').subcommand('idiom', '成语')
    .alias('成语')
    .action(async ({ session }) => {
      const question = await fetchQuestion('成语');
      if (!question) {
        session.send('暂时没有可用的成语题目，请稍后再试。');
        return;
      }
      session.send(formatQuestion('成语', question));
      const userAnswer = await session.prompt(timeout);
      await verifyAnswer(session, '成语', question, userAnswer);
    });

  ctx.command('quiz').subcommand('riddle', '谜语')
    .alias('谜语')
    .action(async ({ session }) => {
      const question = await fetchQuestion('谜语');
      if (!question) {
        session.send('暂时没有可用的谜语题目，请稍后再试。');
        return;
      }
      session.send(formatQuestion('谜语', question));
      const userAnswer = await session.prompt(timeout);
      await verifyAnswer(session, '谜语', question, userAnswer);
    });

  ctx.command('quiz').subcommand('lanternriddle', '灯谜')
    .alias('灯谜')
    .action(async ({ session }) => {
      const question = await fetchQuestion('灯谜');
      if (!question) {
        session.send('暂时没有可用的灯谜题目，请稍后再试。');
        return;
      }
      session.send(formatQuestion('灯谜', question));
      const userAnswer = await session.prompt(timeout);
      await verifyAnswer(session, '灯谜', question, userAnswer);
    });

  ctx.command('quiz').subcommand('charpuzzle', '字谜')
    .alias('字谜')
    .action(async ({ session }) => {
      const question = await fetchQuestion('字谜');
      if (!question) {
        session.send('暂时没有可用的字谜题目，请稍后再试。');
        return;
      }
      session.send(formatQuestion('字谜', question));
      const userAnswer = await session.prompt(timeout);
      await verifyAnswer(session, '字谜', question, userAnswer);
    });

  ctx.command('quiz').subcommand('brainteaser', '脑筋急转弯')
    .alias('脑筋急转弯')
    .action(async ({ session }) => {
      const question = await fetchQuestion('脑筋急转弯');
      if (!question) {
        session.send('暂时没有可用的脑筋急转弯题目，请稍后再试。');
        return;
      }
      session.send(formatQuestion('脑筋急转弯', question));
      const userAnswer = await session.prompt(timeout);
      await verifyAnswer(session, '脑筋急转弯', question, userAnswer);
    });

  function formatQuestion(type: string, question: any) {
    if (type === '选诗') return `Question: ${question.question}\nA: ${question.answer_a}\nB: ${question.answer_b}\nC: ${question.answer_c}`;
    else if (type === '百科') return `Question: ${question.title}\nA: ${question.answerA}\nB: ${question.answerB}\nC: ${question.answerC}\nD: ${question.answerD}`;
    else if (type === '问答') return `Question: ${question.quest}`;
    else if (type === '判断') return `Question: ${question.title}`;
    else if (type === '填诗') return `Question: ${question.quest}`;
    else if (type === '成语') return `Question: ${question.question}\nAbbr: ${question.abbr}`;
    else if (type === '谜语') return `Question: ${question.quest}`;
    else if (type === '灯谜') return `Question: ${question.riddle}`;
    else if (type === '字谜') return `Question: ${question.content}`;
    else if (type === '脑筋急转弯') return `Question: ${question.quest}`;
    else return 'Unknown question type';
  }

  async function verifyAnswer(session: Session, type: string, question: any, userAnswer: string) {
    let isCorrect = false;

    if (type === '选诗') isCorrect = userAnswer === question.answer;
    else if (type === '百科') isCorrect = userAnswer === question.answer;
    else if (type === '填诗') isCorrect = userAnswer === question.answer;
    else if (type === '成语') isCorrect = userAnswer === question.answer;
    else if (type === '谜语') isCorrect = userAnswer === question.answer;
    else if (type === '灯谜') isCorrect = userAnswer === question.answer;
    else if (type === '字谜') isCorrect = userAnswer === question.answer;
    else if (type === '问答') isCorrect = userAnswer === question.result;
    else if (type === '判断') isCorrect = (userAnswer === '对' && question.answer === 1) || (userAnswer === '错' && question.answer === 0);
    else if (type === '脑筋急转弯') isCorrect = userAnswer.includes(question.result);
    else throw new Error(`Unknown question type: ${type}`);

    if (isCorrect) {
      if (ctx.monetary && config.balance?.enable) {
        let userAid: number;
        userAid = (await ctx.database.get('binding', { pid: [session.userId] }, ['aid']))[0]?.aid;
        ctx.monetary.gain(userAid, config.balance.much);
      }

      session.send('恭喜你，回答正确！');
    }
    else {
      let correctAnswer = question.answer;
      if (type === '判断') correctAnswer = question.answer === 1 ? '对' : '错';
      else if (type === '填诗') correctAnswer = `${question.answer} (来源: ${question.source})`;
      else if (type === '成语') correctAnswer = `${question.answer} (拼音: ${question.pinyin})`;
      else if (type === '灯谜') correctAnswer = `${question.answer} (分类: ${question.type})`;
      else if (type === '字谜') correctAnswer = `${question.answer} (解释: ${question.reason})`;
      else if (type === '脑筋急转弯') correctAnswer = question.result;
      session.send(`很遗憾，回答错误。正确答案是：${correctAnswer}`);
    }
  }
}