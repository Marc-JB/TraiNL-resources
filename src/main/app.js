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

const data = new ApiCacheManager(new NsApi(undefined, env.NS_API_KEY), OVgoStaticAPI)

/**
 * @param {string} id
 * @returns {Promise<import("./models/station").Station>}
 */
const stationLookUp = async (id) => (await searchStations(id))[0]

/**
 * @param {string} q
 * @param {boolean} [onlyExactMatches]
 * @param {number} [limit]
 * @returns {Promise<import("./models/station").Station[]>}
 */
async function searchStations(q, onlyExactMatches = true, limit = 10) {
    const stations = await data.getStations()

    /** @type {(it: import("./models/station").Station) => boolean} */
    const matchFunction = it => it.name.toLowerCase().includes(q.toLowerCase()) || it.code.toLowerCase().includes(q.toLowerCase()) || it.alternativeNames.some(it => it.toLowerCase().includes(q.toLowerCase()))

    /** @type {(it: import("./models/station").Station) => boolean} */
    const exactMatchFunction = it => it.name === q || it.code === q || it.alternativeNames.includes(q)

    return stations.filter(onlyExactMatches ? exactMatchFunction : matchFunction)
        .sort((a, b) =>
            exactMatchFunction(a) && !exactMatchFunction(b) ? -1 :
                exactMatchFunction(b) && !exactMatchFunction(a) ? 1 :
                    a.name.toLowerCase().startsWith(q.toLowerCase()) && !b.name.toLowerCase().startsWith(q.toLowerCase()) ? -1 :
                        b.name.toLowerCase().startsWith(q.toLowerCase()) && !a.name.toLowerCase().startsWith(q.toLowerCase()) ? 1 : 0
        ).slice(0, limit)
}

async function main() {
    const serverBuilder = new WebServer.Builder()

    if(env.PORT) serverBuilder.setPort(env.PORT)

    if(env.CERT && env.KEY) {
        serverBuilder.setKey(env.KEY).setCert(env.CERT)
        if(env.CA) serverBuilder.setCA(env.CA)
    } else serverBuilder.useHttp1()

    const server = await serverBuilder.build()

    /**
     * @param {import("@peregrine/webserver").ReadonlyHttpRequest} request
     */
    const fetchStations = async (request) => {
        let query = request.url.query.get("q")
        const responseBuilder = new ResponseBuilder()
        expire(responseBuilder, 60 * 60 * 24 * 5)
        responseBuilder.setJsonBody(query && typeof query === "string" ? await searchStations(query, false) : await data.getStations())
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
            const departures = nsDepartures.filter((_item, index) => index < 8).map(departure => mapDepartureLegacy(departure, data))
            responseBuilder.setJsonBody(await Promise.all(departures))
        } else {
            const departures = nsDepartures.map(departure => transformNsDeparture(departure, stationLookUp, language))
            responseBuilder.setJsonBody(await Promise.all(departures))
        }

        return responseBuilder.build()
    })

    server.root.get("/api/v{v}/journeys/{id}.json", async (request) => {
        const journeyId = parseInt(request.url.params.get("id"))
        const responseBuilder = new ResponseBuilder()
        expire(responseBuilder, 60 * 5)
        responseBuilder.setJsonBody(await transformNsTrainInfo(await data.getJourney(journeyId), stationLookUp))
        return responseBuilder.build()
    })

    await server.listen()
}

main().catch(console.error)
