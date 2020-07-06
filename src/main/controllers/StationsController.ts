import { ApiController, HttpGet, Path } from "@peregrine/koa-with-decorators"
import { Context } from "koa"
import { searchStation, searchStations } from "../searchStations"
import { transformNsDeparture } from "../transformations/departure"
import { DataRepository } from "../data-access/Repositories"

async function sleep(timeInMilliSeconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeInMilliSeconds))
}

function getLanguage(_: Context): "en" | "nl" {
    return "nl"
}

@ApiController("/api/v0")
export class StationsController {
    public constructor(private readonly data: DataRepository) { }

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
