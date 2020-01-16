import env from "./env.js"
import { WebServer, ResponseBuilder } from "./webserver.js"
import { expire } from "./expire.js"
import { OVgoStaticAPI } from "./data-access/ovgostatic-api.js"
import { NsApi } from "./data-access/ns-api.js"
import { transformNsDeparture } from "./transformations/departure.js"
import { transformNsTrainInfo } from "./transformations/train-info.js"
import { loadDeparturesLegacy } from "./disruptions-legacy.js"
import { ApiCacheManager } from "./data-access/ApiCacheManager.js"
import { mapDepartureLegacy } from "./transformations/departure-legacy.js"
import { searchStations, searchStation } from "./searchStations.js"

function buildServer(){
    const serverBuilder = new WebServer.Builder()

    if(env.PORT) serverBuilder.setPort(env.PORT)

    if(env.CERT && env.KEY) {
        serverBuilder.setKey(env.KEY).setCert(env.CERT)
        if(env.CA) serverBuilder.setCA(env.CA)
    } else serverBuilder.useHttp1()

    return serverBuilder.build()
}

/**
 * @param {ApiCacheManager} data
 */
async function main(data) {
    const server = await buildServer()

    /**
     * @param {import("@peregrine/webserver").ReadonlyHttpRequest} request
     */
    const fetchStations = async (request) => {
        let query = request.url.query.get("q")
        const responseBuilder = new ResponseBuilder()
        expire(responseBuilder, 60 * 60 * 24 * 5)
        responseBuilder.setJsonBody(query && typeof query === "string" ? await searchStations(data, query, false) : await data.getStations())
        return responseBuilder.build()
    }

    loadDeparturesLegacy(server.root.createEndpointAtPath("api/v1"), data)

    server.root.get("/api/v{v}/stations.json", fetchStations)

    /**
     * @param {import("@peregrine/webserver").ReadonlyHttpRequest} request
     * @returns {"en" | "nl"}
     */
    function getLanguage(request) {
        const [[primaryLanguage = "en"] = ["en", 1]] = request.acceptedLanguages
        /** @type {"en" | "nl"} */
        // @ts-ignore
        return primaryLanguage.split("-")[0]
    }

    server.root.get("/api/v{v}/stations/{id}.json", async (request) => {
        const stationCode = parseInt(request.url.params.get("id"))

        const stations = await data.getStations()
        const station = stations.find(it => it.id === stationCode)

        const responseBuilder = new ResponseBuilder()
        expire(responseBuilder, 90)
        responseBuilder.setJsonBody(station)
        return responseBuilder.build()
    })

    server.root.get("api/v{v}/stations/{id}/departures.json", async (request) => {
        const language = getLanguage(request)
        const isLegacyMode = request.url.params.get("v") === "1"
        const stationCode = request.url.params.get("id")

        const uicCode = isNaN(parseInt(stationCode)) ? (await data.getStations()).find(it => it.code === stationCode.toUpperCase()).id : parseInt(stationCode)

        const responseBuilder = new ResponseBuilder()
        expire(responseBuilder, 90)

        const nsDepartures = await data.getDepartures(uicCode, language)

        if(isLegacyMode) {
            const departures = nsDepartures.filter((_item, index) => index < 8).map(departure => mapDepartureLegacy(data, departure))
            responseBuilder.setJsonBody(await Promise.all(departures))
        } else {
            const departures = nsDepartures.map(departure => transformNsDeparture(data, departure, language))
            responseBuilder.setJsonBody(await Promise.all(departures))
        }

        return responseBuilder.build()
    })

    server.root.get("/api/v{v}/journeys/{id}.json", async (request) => {
        const journeyId = parseInt(request.url.params.get("id"))
        const responseBuilder = new ResponseBuilder()
        expire(responseBuilder, 60 * 5)
        responseBuilder.setJsonBody(await transformNsTrainInfo(await data.getJourney(journeyId), id => searchStation(data, id)))
        return responseBuilder.build()
    })

    await server.listen()
}

main(new ApiCacheManager(new NsApi(undefined, env.NS_API_KEY), OVgoStaticAPI)).catch(console.error)
