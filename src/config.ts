import { Schema, Logger } from "koishi";
import { questionL } from "./list";

export const log = new Logger('multi-quiz')

export interface Config {
    maxCall: number;
    timeout: number;
    delay: number;
    keysDict: {
        key: string;
        questionTypes: string[];
    }[];
    balance: {
        enable?: boolean;
        gain?: number;
        cost?: number;
    };
    dvcrole: string;
    dvcQuestionTypes: string[]; // 新增字段
}

export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
        maxCall: Schema.number().default(100).description('每个key最大调用次数'),
        timeout: Schema.number().default(40000).description('回答限时'),
        delay: Schema.number().default(200).description('每次调用间隔'),
        keysDict: Schema.array(Schema.object({
            key: Schema.string(),
            questionTypes: Schema.array(Schema.union(questionL)).role('select').default(questionL).description('选择的题型'),
        })).role('table'),
        balance: Schema.intersect([
            Schema.object({
                enable: Schema.boolean().default(false).description('启用经济'),
            }),
            Schema.union([
                Schema.object({
                    enable: Schema.const(true).required(),
                    gain: Schema.number().default(6).description('奖励额度'),
                    cost: Schema.number().default(2).description('惩罚额度'),
                }),
                Schema.object({}),
            ]),
        ]),
        dvcrole: Schema.string().role('textarea', { rows: [2, 8] }).default('请判断下面用户的回答是否正确，只用回答‘True’或‘False’不要说多余的话').description('dvc角色'),
        dvcQuestionTypes: Schema.array(Schema.union(questionL)).role('select').default(['烧脑']).description('需要使用dvc服务的题型') // 新增字段
    }).description('基础设置')
]);