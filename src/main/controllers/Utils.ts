import { Response, Request } from "koa"

export async function sleep(timeInMilliSeconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeInMilliSeconds))
}

function parseAcceptHeader(content: string): ReadonlySet<[string, number]> {
    return new Set(
        content
            .split(",")
            .map(it => it.trim())
            .filter(it => it !== "")
            .map(it => {
                const [code, q = "1"] = it.split(";q=")
                return [code, parseFloat(q)] as [string, number]
            })
    )
}

export function getLanguage(request: Request): "en" | "nl" {
    const [[primaryLanguage = "en"] = ["en", 1]] = parseAcceptHeader(request.get("Accept-Language"))
    const language = primaryLanguage.split("-")[0]
    return language === "en" || language === "nl" ? language : "en"
}

export function setCacheExpirationTime(response: Response, expirationTimeInSeconds: number): void {
    const now = new Date()
    now.setTime(now.getTime() + expirationTimeInSeconds * 1000)
    response.set("Cache-Control", `public, max-age=${expirationTimeInSeconds}, s-maxage=${expirationTimeInSeconds}`)
    response.set("Expires", now.toUTCString())
}
