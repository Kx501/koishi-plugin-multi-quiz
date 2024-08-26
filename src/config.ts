import { Schema, Logger } from "koishi";
import { questionL } from "./list";

export const log = new Logger('multi-quiz')

export interface Config {
    maxCall: number
    timeout: number
    questionTypes: string[]
    commonKeys: string[]
    balance: {
        enable?: boolean
        much?: number
    }
}

export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
        maxCall: Schema.number().description('每个key最大调用次数').default(100),
        timeout: Schema.number().description('回答限时').default(40000),
        questionTypes: Schema.array(Schema.union(questionL)).role('select').default(questionL).description('选择的题型'),
        commonKeys: Schema.array(Schema.string()).role('table').description('通用key'),
        balance: Schema.intersect([
            Schema.object({
                enable: Schema.boolean().default(false).description('启用经济'),
            }),
            Schema.union([
                Schema.object({
                    enable: Schema.const(true).required(),
                    much: Schema.number().description('奖励额度'),
                }),
                Schema.object({}),
            ]),
        ]),
    }).description('基础设置')
])