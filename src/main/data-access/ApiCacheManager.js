import { Cache } from "./cache.js"

export class ApiCacheManager {
    /** @type { import("./ns-api.js").NsApi } */
    #nsApi

    /** @type { typeof import("./ovgostatic-api").OVgoStaticAPI } */
    #ovGoApi

    /** @type {Cache<import("../models/station").Station[]>} */
    #stations = new Cache(60 * 60 * 24, () => this.#ovGoApi.getStations())

    /** @type {Map<number, Map<string, Cache<import("../models/NsDeparture").NsDeparture[]>>>} */
    #departures = new Map()

    /** @type {Map<number, Cache<import("../models/NsTrainInfo").NsTrainInfo>>} */
    #journeys = new Map()

    /** @type {Map<string, Cache<import("../models/NsDisruption").NsDisruption[]>>} */
    #disruptions = new Map()

    /** @type {Map<string, Map<boolean, Cache<import("../models/NsMaintenance").NsMaintenance[]>>>}*/
    #maintenance = new Map()

    /**
     * @param { import("./ns-api.js").NsApi } nsApi
     * @param { typeof import("./ovgostatic-api").OVgoStaticAPI } ovGoApi
     */
    constructor(nsApi, ovGoApi){
        this.#nsApi = nsApi
        this.#ovGoApi = ovGoApi
    }

    getStations() {
        return this.#stations.value
    }

    /**
     * @param {number} stationCode
     * @param {"en" | "nl"} language
     */
    getDepartures(stationCode, language) {
        if(!this.#departures.has(stationCode)) {
            this.#departures.set(stationCode, new Map())
        }

        if(!this.#departures.get(stationCode).has(language)) {
            this.#departures.get(stationCode).set(language, new Cache(90, () => this.#nsApi.getDepartures(stationCode, language)))
        }

        return this.#departures.get(stationCode).get(language).value
    }

    /**
     * @param {number} id
     */
    getJourney(id){
        if(!this.#journeys.has(id)) {
            this.#journeys.set(id, new Cache(60 * 5, () => this.#nsApi.getTrainInfo(id)))
        }

        return this.#journeys.get(id).value
    }

    /**
     * @param {"en" | "nl"} language
     */
    getDisruptions(language){
        if(!this.#disruptions.has(language)) {
            this.#disruptions.set(language, new Cache(60 * 2, () => this.#nsApi.getDisruptions(language)))
        }

        return this.#disruptions.get(language).value
    }

    /**
     * @param {boolean} actual
     * @param {"en" | "nl"} language
     */
    getMaintenance(actual = true, language) {
        if(!this.#maintenance.has(language)) {
            this.#maintenance.set(language, new Map())
        }

        if(!this.#maintenance.get(language).has(actual)) {
            this.#maintenance.get(language).set(actual, new Cache(60 * 5, () => this.#nsApi.getMaintenanceList(actual, language)))
        }

        return this.#maintenance.get(language).get(actual).value
    }
}
