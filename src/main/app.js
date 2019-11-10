import env from "./env.js"
import express from "express"
import legacy from "./legacy/app.js"
import { expire } from "./expire.js"
import { Cache } from "./data-access/cache.js"
import { OVgoStaticAPI } from "./data-access/ovgostatic-api.js"
import { NsApi } from "./data-access/ns-api.js"
import { transformNsDeparture } from "./transformations/departure.js"
import { transformNsTrainInfo } from "./transformations/train-info.js"

class CacheManager {
    constructor() {
        /** @type {Cache<import("./models/station").Station[]>} */
        this.stations = new Cache(60 * 60 * 24, OVgoStaticAPI.getStations)

        /** @type {Map<number, Map<string, Cache<import("./models/departure.js").Departure[]>>>} */
        this.departures = new Map()

        /** @type {Map<number, Cache<import("./models/traininfo").TrainInfo>>} */
        this.journeys = new Map()
    }

    async getStations() {
        return await this.stations.get()
    }

    /**
     * @param {number} stationCode
     * @param {string} language
     */
    async getDepartures(stationCode, language) {
        if(!this.departures.has(stationCode)) {
            this.departures.set(stationCode, new Map())
        }

        if(!this.departures.get(stationCode).has(language)) {
            this.departures.get(stationCode).set(language, new Cache(90, async () => {
                const departures = await nsApi.getDepartures(stationCode, language)
                const newDepartures = departures.map(departure => transformNsDeparture(departure, stationLookUp))
                return await Promise.all(newDepartures)
            }))
        }

        return await this.departures.get(stationCode).get(language).get()
    }

    /**
     * @param {number} id
     */
    async getJourney(id){
        if(!this.journeys.has(id)) {
            this.journeys.set(id, new Cache(60 * 5, async () => await transformNsTrainInfo(await nsApi.getTrainInfo(id), stationLookUp)))
        }

        return await this.journeys.get(id).get()
    }
}

const cacheManager = new CacheManager()

const nsApi = new NsApi(undefined, env.NS_API_KEY)

/**
 * @param {string} id
 * @returns {Promise<import("./models/station").Station>}
 */
const stationLookUp = async (id) => (await searchStations(id, true))[0]

/**
 * @param {string} q
 * @param {boolean} onlyExactMatches
 * @returns {Promise<import("./models/station").Station[]>}
 */
async function searchStations(q, onlyExactMatches) {
    const stations = await cacheManager.getStations()

    /** @type {(it: import("./models/station").Station) => boolean} */
    const matchFunction = it => it.name.toLowerCase().includes(q.toLowerCase()) || it.code.toLowerCase().includes(q.toLowerCase()) || it.alternativeNames.some(it => it.toLowerCase().includes(q.toLowerCase()))

    /** @type {(it: import("./models/station").Station) => boolean} */
    const exactMatchFunction = it => it.name === q || it.code === q || it.alternativeNames.includes(q)

    return stations.filter(onlyExactMatches ? exactMatchFunction : matchFunction)
        .sort((a, b) => exactMatchFunction(a) ? 1 : exactMatchFunction(b) ? -1 : 0).slice(0, 10)
}

const server = express()
legacy(server)

server.get("/api/v0/stations.json", async (request, response) => {
    let query = request.query.q
    expire(response, 60 * 60 * 24 * 5)
    response.status(200).json(query ? await searchStations(query, false) : await cacheManager.getStations())
})

server.get("/api/v0/stations/:id.json", async (request, response) => {
    const language = (request.headers["accept-language"] || "en").split(",")[0]
    const stationCode = parseInt(request.params.id)

    const stations = await cacheManager.getStations()
    const departures = await cacheManager.getDepartures(stationCode, language)

    const station = stations.find(it => it.id == stationCode)
    station.departures = departures

    expire(response, 90)
    response.status(200).json(station)
})

server.get("/api/v0/stations/:id/departures.json", async (request, response) => {
    const language = (request.headers["accept-language"] || "en").split(",")[0]
    const stationCode = parseInt(request.params.id)

    expire(response, 90)
    response.status(200).json(await cacheManager.getDepartures(stationCode, language))
})

server.get("/api/v0/journey/:id.json", async (request, response) => {
    const journeyId = parseInt(request.params.id)
    expire(response, 60 * 5)
    response.status(200).json(await cacheManager.getJourney(journeyId))
})

server.listen(env.PORT || "8080")
