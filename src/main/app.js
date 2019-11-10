import env from "./env.js"
import express from "express"
import { expire } from "./expire.js"
import { getDisruptions } from "./disruptions.js"
import { getDeparturesForStation, getStations } from "./stations.js"
import { Cache } from "./data-access/cache.js"
import { OVgoStaticAPI } from "./data-access/ovgostatic-api.js"
import { NsApi } from "./data-access/ns-api.js"
import { transformNsDeparture } from "./transformations/departure.js"
import { transformNsTrainInfo } from "./transformations/train-info.js"
import { Station } from "./models/station.js"
import { Departure } from "./models/departure.js"

/** @type {{[key: string]: Cache<any>}} */
const caches = {
    stations: new Cache(60 * 60 * 24, OVgoStaticAPI.getStations)
}

const nsApi = new NsApi(undefined, env.NS_API_KEY)

/**
 * @param {string} id
 * @returns {Promise<Station>}
 */
const stationLookUp = async (id) => (await searchStations(id, true))[0]

/**
 * @param {string} q
 * @param {boolean} onlyExactMatches
 * @returns {Promise<Station[]>}
 */
async function searchStations(q, onlyExactMatches) {
    /** @type {Station[]} */
    const stations = await caches.stations.get()

    /** @type {(it: Station) => boolean} */
    const matchFunction = it => it.name.toLowerCase().includes(q.toLowerCase()) || it.code.toLowerCase().includes(q.toLowerCase()) || it.alternativeNames.some(it => it.toLowerCase().includes(q.toLowerCase()))

    /** @type {(it: Station) => boolean} */
    const exactMatchFunction = it => it.name === q || it.code === q || it.alternativeNames.includes(q)

    return stations.filter(onlyExactMatches ? exactMatchFunction : matchFunction)
        .sort((a, b) => exactMatchFunction(a) ? 1 : exactMatchFunction(b) ? -1 : 0).slice(0, 10)
}

const server = express()

server.get("/api/v1/stations/:id/departures.json", getDeparturesForStation)
server.get("/api/v1/stations.json", getStations)
server.get("/api/v1/disruptions.json", getDisruptions)

server.get("/api/v0/stations.json", async (request, response) => {
    let query = request.query.q
    expire(response, 60 * 60 * 24 * 5)
    response.status(200).json(query ? await searchStations(query, false) : await caches.stations.get())
})

server.get("/api/v0/stations/:id.json", async (request, response) => {
    const language = (request.headers["accept-language"] || "en").split(",")[0]
    const stationCode = parseInt(request.params.id)
    const key = `departures:${stationCode}:${language}`

    caches[key] = caches[key] || new Cache(60, async () => {
        const departures = await nsApi.getDepartures(stationCode, language)
        const newDepartures = await Promise.all(departures.map(departure => {
            return transformNsDeparture(departure, stationLookUp)
        }))
        return newDepartures
    })

    /** @type {Station[]} */
    const stations = await caches.stations.get()

    /** @type {Departure[]} */
    const departures = await caches[key].get()

    const station = stations.find(it => it.id == stationCode)
    station.departures = departures

    expire(response, 90)
    response.status(200).json(station)
})

server.get("/api/v0/stations/:id/departures.json", async (request, response) => {
    const language = (request.headers["accept-language"] || "en").split(",")[0]
    const stationCode = parseInt(request.params.id)
    const key = `departures:${stationCode}:${language}`
    caches[key] = caches[key] || new Cache(60, async () => {
        const departures = await nsApi.getDepartures(stationCode, language)
        const newDepartures = await Promise.all(departures.map(departure => {
            return transformNsDeparture(departure, stationLookUp)
        }))
        return newDepartures
    })

    expire(response, 90)
    response.status(200).json(await caches[key].get())
})

server.get("/api/v0/journey/:id.json", async (request, response) => {
    const journeyId = parseInt(request.params.id)
    const key = `journey:${journeyId}`
    caches[key] = caches[key] || new Cache(60, async () => await transformNsTrainInfo(await nsApi.getTrainInfo(journeyId), stationLookUp))

    expire(response, 60 * 5)
    response.status(200).json(await caches[key].get())
})

server.listen(env.PORT || "8080")
