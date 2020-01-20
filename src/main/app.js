import env from "./env.js"
import { WebServer, ResponseBuilder } from "./webserver.js"
import { OVgoStaticAPI } from "./data-access/ovgostatic-api.js"
import { NsApi } from "./data-access/ns-api.js"
import { transformNsDeparture } from "./transformations/departure.js"
import { loadDisruptionsLegacy } from "./disruptions-legacy.js"
import { ApiCacheManager } from "./data-access/ApiCacheManager.js"
import { searchStations, searchStation } from "./searchStations.js"

/**
 * @param {number} timeInMilliSeconds
 * @returns {Promise<void>}
 */
function sleep(timeInMilliSeconds) {
    return new Promise(resolve => setTimeout(resolve, timeInMilliSeconds))
}

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
        return new ResponseBuilder()
            .setCacheExpiration(60 * 60 * 24 * 5)
            .setJsonBody(query && typeof query === "string" ? await searchStations(data, query, false) : await data.getStations())
            .build()
    }

    loadDisruptionsLegacy(server.root.createEndpointAtPath("api/v1"), data)

    server.root.get("/api/v0/stations.json", fetchStations)

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

    server.root.get("/api/v0/stations/{id}.json", async (request) => {
        const stationCode = parseInt(request.url.params.get("id"))

        const stations = await data.getStations()
        const station = stations.find(it => it.id === stationCode)

        return new ResponseBuilder()
            .setCacheExpiration(90)
            .setJsonBody(station)
            .build()
    })

    server.root.get("api/v0/stations/{id}/departures.json", async (request) => {
        const language = getLanguage(request)
        const stationId = request.url.params.get("id").replace("%20", " ")

        const uicCode = isNaN(parseInt(stationId)) ? (await searchStation(data, stationId)).id : parseInt(stationId)

        const nsDepartures = (await data.getDepartures(uicCode, language)).filter((_item, index) => index < 12)

        const departures = []

        for(const departure of nsDepartures) {
            await sleep(75)
            departures.push(await transformNsDeparture(data, departure, language))
        }

        return new ResponseBuilder()
            .setCacheExpiration(90)
            .setJsonBody(await Promise.all(departures))
            .build()
    })

    await server.listen()
}

main(new ApiCacheManager(new NsApi(undefined, env.NS_API_KEY), OVgoStaticAPI)).catch(console.error)
