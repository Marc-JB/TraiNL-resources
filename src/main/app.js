import env from "./env.js"
import express from "express"
import legacy from "./legacy/app.js"
import { expire } from "./expire.js"
import { Cache } from "./data-access/cache.js"
import { OVgoStaticAPI } from "./data-access/ovgostatic-api.js"
import { NsApi } from "./data-access/ns-api.js"
import { transformNsDeparture } from "./transformations/departure.js"
import { transformNsTrainInfo } from "./transformations/train-info.js"

/** @type {{
 *     stations: Cache<import("./models/station").Station[]>,
 *     departures: Map<number, Map<string, Cache<import("./models/departure.js").Departure[]>>>,
 *     journeys: Map<number, Cache<import("./models/traininfo").TrainInfo>>
 * }} */
const caches = {
    stations: new Cache(60 * 60 * 24, OVgoStaticAPI.getStations),
    departures: new Map(),
    journeys: new Map()
}

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
    const stations = await caches.stations.get()

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
    response.status(200).json(query ? await searchStations(query, false) : await caches.stations.get())
})

/**
 * @param {number} stationCode
 * @param {string} language
 */
async function departureCacheFn(stationCode, language) {
    const departures = await nsApi.getDepartures(stationCode, language)
    const newDepartures = departures.map(departure => transformNsDeparture(departure, stationLookUp))
    return await Promise.all(newDepartures)
}

server.get("/api/v0/stations/:id.json", async (request, response) => {
    const language = (request.headers["accept-language"] || "en").split(",")[0]
    const stationCode = parseInt(request.params.id)

    if(!caches.departures.has(stationCode)) {
        caches.departures.set(stationCode, new Map())
    }

    if(!caches.departures.get(stationCode).has(language)) {
        caches.departures
            .get(stationCode)
            .set(language, new Cache(60, () => departureCacheFn(stationCode, language)))
    }

    const stations = await caches.stations.get()
    const departures = await caches.departures.get(stationCode).get(language).get()

    const station = stations.find(it => it.id == stationCode)
    station.departures = departures

    expire(response, 90)
    response.status(200).json(station)
})

server.get("/api/v0/stations/:id/departures.json", async (request, response) => {
    const language = (request.headers["accept-language"] || "en").split(",")[0]
    const stationCode = parseInt(request.params.id)

    if(!caches.departures.has(stationCode)) {
        caches.departures.set(stationCode, new Map())
    }

    if(!caches.departures.get(stationCode).has(language)) {
        caches.departures
            .get(stationCode)
            .set(language, new Cache(60, () => departureCacheFn(stationCode, language)))
    }

    expire(response, 90)
    response.status(200).json(await caches.departures.get(stationCode).get(language).get())
})

server.get("/api/v0/journey/:id.json", async (request, response) => {
    const journeyId = parseInt(request.params.id)

    if(!caches.journeys.has(journeyId)) {
        caches.journeys.set(journeyId, new Cache(60, async () => await transformNsTrainInfo(await nsApi.getTrainInfo(journeyId), stationLookUp)))
    }

    expire(response, 60 * 5)
    response.status(200).json(await caches.journeys.get(journeyId).get())
})

server.listen(env.PORT || "8080")
