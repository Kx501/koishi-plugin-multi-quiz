export function formatQuestion(type: string, question: any) {
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