import env from "./env.js"
import { WebServer, ResponseBuilder } from "./webserver.js"
import { expire } from "./expire.js"
import { Cache } from "./data-access/cache.js"
import { OVgoStaticAPI } from "./data-access/ovgostatic-api.js"
import { NsApi } from "./data-access/ns-api.js"
import { transformNsDeparture } from "./transformations/departure.js"
import { transformNsTrainInfo } from "./transformations/train-info.js"
import legacy from "./legacy/app.js"

class CacheManager {
    /** @type {Cache<import("./models/station").Station[]>} */
    #stations = new Cache(60 * 60 * 24, OVgoStaticAPI.getStations)

    /** @type {Map<number, Map<string, Cache<import("./models/departure.js").Departure[]>>>} */
    #departures = new Map()

    /** @type {Map<number, Cache<import("./models/traininfo").TrainInfo>>} */
    #journeys = new Map()

    async getStations() {
        return await this.#stations.get()
    }

    /**
     * @param {number} stationCode
     * @param {"en" | "nl"} language
     */
    async getDepartures(stationCode, language) {
        if(!this.#departures.has(stationCode)) {
            this.#departures.set(stationCode, new Map())
        }

        if(!this.#departures.get(stationCode).has(language)) {
            this.#departures.get(stationCode).set(language, new Cache(90, async () => {
                const departures = await nsApi.getDepartures(stationCode, language)
                const newDepartures = departures.map(departure => transformNsDeparture(departure, stationLookUp, language))
                return await Promise.all(newDepartures)
            }))
        }

        return await this.#departures.get(stationCode).get(language).get()
    }

    /**
     * @param {number} id
     */
    async getJourney(id){
        if(!this.#journeys.has(id)) {
            this.#journeys.set(id, new Cache(60 * 5, async () => await transformNsTrainInfo(await nsApi.getTrainInfo(id), stationLookUp)))
        }

        return await this.#journeys.get(id).get()
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
 * @param {number} [limit]
 * @returns {Promise<import("./models/station").Station[]>}
 */
async function searchStations(q, onlyExactMatches, limit = 10) {
    const stations = await cacheManager.getStations()

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
    /*if(env.CERT && env.KEY) {
        serverBuilder.setKey(env.KEY).setCert(env.CERT)
    } else {*/
        serverBuilder.useHttp1()
    //}
    const server = await serverBuilder.build()

    server.root.get(".well-known/acme-challenge/3TeCYOldD9nxKzJo9JEmZMfxHEWsw7Ajy5fGz_PwIss", _ => {
        return new ResponseBuilder()
            .setPlainTextBody("3TeCYOldD9nxKzJo9JEmZMfxHEWsw7Ajy5fGz_PwIss.KBGHgt6UgZKHnPlzfOfZTy1_2sBk2Vl2n-tq2CLglO8")
            .build()
    })

    const oldApi = server.root.createEndpointAtPath("api/v1")
    legacy(oldApi)

    const newApi = server.root.createEndpointAtPath("api/v0")

    newApi.get("stations.json", async (request) => {
        let query = request.url.query.get("q")
        const responseBuilder = new ResponseBuilder()
        expire(responseBuilder, 60 * 60 * 24 * 5)
        responseBuilder.setJsonBody(query && typeof query === "string" ? await searchStations(query, false) : await cacheManager.getStations())
        return responseBuilder.build()
    })

    newApi.get("stations/{id}.json", async (request) => {
        const stationCode = parseInt(request.url.params.get("id"))

        const stations = await cacheManager.getStations()
        const station = stations.find(it => it.id === stationCode)

        const responseBuilder = new ResponseBuilder()
        expire(responseBuilder, 90)
        responseBuilder.setJsonBody(station)
        return responseBuilder.build()
    })

    newApi.get("stations/{id}/departures.json", async (request) => {
        const language = (request.acceptedLanguages || [["en", 1]])[0][0].split("-")[0]
        const stationCode = parseInt(request.url.params.get("id"))
        const responseBuilder = new ResponseBuilder()
        expire(responseBuilder, 90)
        responseBuilder.setJsonBody(await cacheManager.getDepartures(stationCode, language))
        return responseBuilder.build()
    })

    newApi.get("journeys/{id}.json", async (request) => {
        const journeyId = parseInt(request.url.params.get("id"))
        const responseBuilder = new ResponseBuilder()
        expire(responseBuilder, 60 * 5)
        responseBuilder.setJsonBody(await cacheManager.getJourney(journeyId))
        return responseBuilder.build()
    })

    await server.listen()
}

main().catch(console.error)
