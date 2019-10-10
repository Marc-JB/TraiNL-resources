import env from "./env.js"
import express from "express"
import { getDisruptions } from "./disruptions.js"
import { getDeparturesForStation, getStations } from "./stations.js"
import { Cache } from "./data-access/cache.js"
import { OVgoStaticAPI } from "./data-access/ovgostatic-api.js"
import { NsApi } from "./data-access/ns-api.js"
import { transformNsDeparture } from "./transformations/departure.js"
import { Station } from "./models/station.js"

/** @type {{[key: string]: Cache<any>}} */
const caches = {
    stations: new Cache(60 * 60 * 24, OVgoStaticAPI.getStations)
}

const nsApi = new NsApi(undefined, env.NS_API_KEY)

const server = express()
server.get("/api/v1/stations/:id/departures.json", getDeparturesForStation)
server.get("/api/v1/stations.json", getStations)
server.get("/api/v1/disruptions.json", getDisruptions)
server.get("/api/v0/stations.json", async (_request, response) => {
    response.status(200).json(await caches.stations.get())
})
server.get("/api/v0/stations/:id/departures.json", async (request, response) => {
    const language = (request.headers["accept-language"] || "en").split(",")[0]
    const stationCode = parseInt(request.params.id)
    const key = `departures:${stationCode}:${language}`
    caches[key] = caches[key] || new Cache(60, async () => {
        const departures = await nsApi.getDepartures(stationCode, language)
        const newDepartures = await Promise.all(departures.map(departure => {
            return transformNsDeparture(departure, async (id) => {
                /** @type {Station[]} */
                const stations = await caches.stations.get()
                return stations.find(it => it.name === id || it.code === id || it.alternativeNames.includes(id))
            })
        }))
        return newDepartures
    })
    response.status(200).json(await caches[key].get())
})
server.listen(env.PORT || "8080")
