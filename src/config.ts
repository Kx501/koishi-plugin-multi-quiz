import { Schema, Logger } from "koishi";
import { questionL } from "./list";

export const log = new Logger('multi-quiz')

export interface Config {
    maxCall: number
    timeout: number
    similarity: number
    keysDict: {
        key: string
        questionTypes: string[]
    }[]
    balance: {
        enable?: boolean
        much?: number
        reduce?: number
    }
}

export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
        maxCall: Schema.number().description('每个key最大调用次数').default(100),
        timeout: Schema.number().description('回答限时').default(40000),
        similarity: Schema.number().description('答案相似度阈值，用于脑筋急转弯判断正误').default(0.8),
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
                    add: Schema.number().description('奖励额度'),
                    reduce: Schema.number().description('惩罚额度'),
                }),
                Schema.object({}),
            ]),
        ]),
    }).description('基础设置')
])