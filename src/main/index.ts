import { createRouter } from "@peregrine/koa-with-decorators"
import dotenv from "dotenv"
import Koa, { Context, Next } from "koa"
import bodyParser from "koa-bodyparser"
import { ApiCacheManager } from "./data-access/ApiCacheManager"
import { NsApi } from "./data-access/ns-api"
import { OVgoStaticAPI } from "./data-access/ovgostatic-api"
import { DisruptionsControllerLegacy } from "./controllers/DisruptionsControllerLegacy"
import { StationsController } from "./controllers/StationsController"

if (process.env.NS_API_KEY === undefined) dotenv.config()

/** Utility function that wraps a callback function into a Promise. */
async function promisify<R>(func: (cb: (err?: Error) => void) => R): Promise<R> {
    return new Promise((resolve, reject) => {
        const returnValue = func((err) => {
            if (err) reject(err)
            else resolve(returnValue)
        })
    })
}

async function main(): Promise<void> {
    const data = new ApiCacheManager(new NsApi(undefined, process.env.NS_API_KEY), OVgoStaticAPI)

    const koaApp = new Koa()
    koaApp.use(bodyParser())

    const stationsRoute = createRouter(StationsController, new StationsController(data))
    koaApp.use(stationsRoute.routes())
    koaApp.use(stationsRoute.allowedMethods())

    const legacyDisruptionsRoute = createRouter(DisruptionsControllerLegacy, new DisruptionsControllerLegacy(data))
    koaApp.use(legacyDisruptionsRoute.routes())
    koaApp.use(legacyDisruptionsRoute.allowedMethods())

    // Remove default response body, catch all errors.
    koaApp.use(async (ctx: Context, next: Next) => {
        try {
            await next()
        } catch (err) {
            console.error(err)
            ctx.response.status = 500
        }

        const statusCode = ctx.response.status as number | null ?? 404
        ctx.response.body = ctx.response.body ?? ""
        ctx.response.status = statusCode
    })

    const port = process.env.PORT ?? 8080

    await promisify((cb) => koaApp.listen(port, cb))

    console.log(`Server is running on port ${port}`)
}

main().catch(console.error)
