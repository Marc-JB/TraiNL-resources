import { ApiController, HttpGet, Path } from "@peregrine/koa-with-decorators"
import { Context } from "koa"
import { searchStation, searchStations } from "../searchStations"
import { transformNsDeparture } from "../data-access/transformations/departure"
import { DataRepository } from "../data-access/Repositories"
import { setCacheExpirationTime, getLanguage, sleep } from "./Utils"

@ApiController("/api/v0")
export class StationsController {
    public constructor(private readonly data: DataRepository) { }

    @HttpGet
    @Path("/stations.json")
    public async getAllStations({ request, response }: Context): Promise<void> {
        const { q = null } = request.query
        response.status = 200
        const hasQueryString = q !== null && typeof q === "string"
        response.body = hasQueryString ? await searchStations(this.data, q, false) : await this.data.getStations()
        setCacheExpirationTime(response, 60 * 60 * 24 * 5)
    }

    @HttpGet
    @Path("/stations/:id.json")
    public async getStationById({ params, response }: Context): Promise<void> {
        const stationCode = parseInt(params.id)

        const stations = await this.data.getStations()
        const station = stations.find(it => it.id === stationCode) ?? null

        response.status = station === null ? 404 : 200
        if (station !== null) response.body = station
        setCacheExpirationTime(response, 90)
    }

    @HttpGet
    @Path("/stations/:id/departures.json")
    public async getDeparturesForStationById({ request, params, response }: Context): Promise<void> {
        const language = getLanguage(request)
        const stationId = params.id.replace("%20", " ")

        const uicCode = isNaN(parseInt(stationId)) ? (await searchStation(this.data, stationId))!.id : parseInt(stationId)

        const nsDepartures = (await this.data.getDepartures(uicCode, language)).filter((_, i) => i < 12)

        const departures = []

        for (const departure of nsDepartures) {
            await sleep(75)
            departures.push(await transformNsDeparture(this.data, departure, language))
        }

        response.status = 200
        response.body = await Promise.all(departures)
        setCacheExpirationTime(response, 90)
    }
}
