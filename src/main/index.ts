import Koa, { Context, Next } from "koa"
import bodyParser from "koa-bodyparser"
import { OVgoStaticAPI } from "./data-access/ovgostatic-api"
import { NsApi } from "./data-access/ns-api"
import { transformNsDeparture } from "./transformations/departure"
// import { loadDisruptionsLegacy } from "./disruptions-legacy"
import { ApiCacheManager } from "./data-access/ApiCacheManager"
import { searchStations, searchStation } from "./searchStations"
import { HttpGet, Path, createRouter, ApiController } from "@peregrine/koa-with-decorators"
import dotenv from "dotenv"

if (process.env.NS_API_KEY === undefined) dotenv.config()

async function sleep(timeInMilliSeconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeInMilliSeconds))
}

/** Utility function that wraps a callback function into a Promise. */
async function promisify<R>(func: (cb: (err?: Error) => void) => R): Promise<R> {
    return new Promise((resolve, reject) => {
        const returnValue = func((err) => {
            if (err) reject(err)
            else resolve(returnValue)
        })
    })
}

function getLanguage(_: Context): "en" | "nl" {
    return "nl"
}

@ApiController("/api/v0")
class StationsAPI {
    public constructor(private readonly data: ApiCacheManager) {}

    @HttpGet
    @Path("/stations.json")
    public async getAllStations(ctx: Context): Promise<void> {
        // TODO: cache time of 60 * 60 * 24 * 5
        const { q = null } = ctx.query
        ctx.response.status = 200
        ctx.response.body = q !== null && typeof q === "string" ? await searchStations(this.data, q, false) : await this.data.getStations()
    }

    @HttpGet
    @Path("/stations/:id.json")
    public async getStationById(ctx: Context): Promise<void> {
        // TODO: cache time of 90
        const stationCode = parseInt(ctx.params.id)

        const stations = await this.data.getStations()
        const station = stations.find(it => it.id === stationCode) ?? null

        ctx.response.status = station === null ? 404 : 200
        if (station !== null) ctx.response.body = station
    }

    @HttpGet
    @Path("/stations/:id/departures.json")
    public async getDeparturesForStationById(ctx: Context): Promise<void> {
        // TODO: cache time of 90
        const language = getLanguage(ctx)
        const stationId = ctx.params.id.replace("%20", " ")

        const uicCode = isNaN(parseInt(stationId)) ? (await searchStation(this.data, stationId))!.id : parseInt(stationId)

        const nsDepartures = (await this.data.getDepartures(uicCode, language)).filter((_, i) => i < 12)

        const departures = []

        for (const departure of nsDepartures) {
            await sleep(75)
            departures.push(await transformNsDeparture(this.data, departure, language))
        }

        ctx.response.status = 200
        ctx.response.body = await Promise.all(departures)
    }
}

async function main(data: ApiCacheManager): Promise<void> {
    const koaApp = new Koa()
    koaApp.use(bodyParser())

    const stationsRoute = createRouter(StationsAPI, new StationsAPI(data))

    koaApp.use(stationsRoute.routes())
    koaApp.use(stationsRoute.allowedMethods())

    /* const v1ApiRouter = new Router({
        prefix: "/api/v1"
    }) */

    // TODO: legacy loadDisruptionsLegacy

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

    console.log(`Server is running on ${port}`)
}

main(new ApiCacheManager(new NsApi(undefined, process.env.NS_API_KEY), OVgoStaticAPI)).catch(console.error)
