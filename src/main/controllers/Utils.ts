import { Response, Request } from "koa"

export async function sleep(timeInMilliSeconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeInMilliSeconds))
}

export function getLanguage(_req: Request): "en" | "nl" {
    return "nl"
}

export function setCacheTime(_resp: Response, _time: number): void {}
