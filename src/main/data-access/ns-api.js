/** @fileoverview Class for handling requests to the NS API. */
import axios from "axios"

export class NsApi {
    /** @type { "en" | "nl" | string } */
    #lang = "en"

    /** @type { string | null } */
    #apiKey = null

    /**
     * @param {"en" | "nl" | string} lang
     * @param {string} apiKey
     */
    constructor(lang = "en", apiKey = null){
        this.#lang = lang
        this.#apiKey = apiKey
    }

    /**
     * @protected
     * @param {string} apiName
     * @param {string} apiKey
     * @param {number} apiVersion
     */
    static _getApi(apiName, apiKey, apiVersion = 1) {
        return axios.create({
            baseURL: `https://gateway.apiportal.ns.nl/${apiName}/api/v${apiVersion}/`,
            headers: {
                "Ocp-Apim-Subscription-Key": apiKey
            }
        })
    }

    /**
     * @throws {Error}
     * @param {"en" | "nl" | string} lang
     * @param {string} apiKey
     * @returns {Promise<import("../models/ns/NsDisruption").NsDisruption[]>}
     */
    async getDisruptions(lang = null, apiKey = null){
        const api = NsApi._getApi("reisinformatie-api", apiKey || this.#apiKey, 2)
        const result = await api.get("disruptions", { params: { type: "storing", lang: lang || this.#lang } })
        if(result.status >= 400 && result.status < 600)
            throw new Error(`Something went wrong. Got error code ${result.status}. Body: ${result.data}`)

        return result.data.payload
    }

    /**
     * @throws {Error}
     * @param {boolean} actual
     * @param {"en" | "nl" | string} lang
     * @param {string} apiKey
     * @returns {Promise<import("../models/ns/NsMaintenance").NsMaintenance[]>}
     */
    async getMaintenanceList(actual = true, lang = null, apiKey = null){
        const api = NsApi._getApi("reisinformatie-api", apiKey || this.#apiKey, 2)
        const result = await api.get("disruptions", { params: { type: "werkzaamheid", lang: lang || this.#lang, actual } })
        if(result.status >= 400 && result.status < 600)
            throw new Error(`Something went wrong. Got error code ${result.status}. Body: ${result.data}`)

        return result.data.payload
    }

    /**
     * @throws {Error}
     * @param {number} id
     * @param {"en" | "nl" | string} lang
     * @param {string} apiKey
     * @returns {Promise<import("../models/ns/NsDeparture").NsDeparture[]>}
     */
    async getDepartures(id, lang = null, apiKey = null) {
        console.log(`GET: departures for ${id} (${lang || this.#lang})`)
        const api = NsApi._getApi("reisinformatie-api", apiKey || this.#apiKey, 2)
        const result = await api.get("departures", {
            params: {
                lang: lang || this.#lang,
                uicCode: `${id}`
            }
        })
        if(result.status >= 400 && result.status < 600)
            throw new Error(`Something went wrong. Got error code ${result.status}. Body: ${result.data}`)

        return result.data.payload.departures
    }

    /**
     * @throws {Error}
     * @param {string} apiKey
     * @returns {Promise<import("../models/ns/NsStation").NsStation[]>}
     */
    async getStations(apiKey = null){
        console.log("GET: stations (NS)")
        const api = NsApi._getApi("reisinformatie-api", apiKey || this.#apiKey, 2)
        const result = await api.get("stations")
        if(result.status >= 400 && result.status < 600)
            throw new Error(`Something went wrong. Got error code ${result.status}. Body: ${result.data}`)

        return result.data.payload
    }

    /**
     * @throws {Error}
     * @param {number} journeyNumber The journey number
     * @param {string} apiKey
     * @returns {Promise<import("../models/ns/NsTrainInfo").NsTrainInfo>}
     */
    async getTrainInfo(journeyNumber, apiKey = null) {
        console.log(`GET: train info for ${journeyNumber}`)
        const api = NsApi._getApi("virtual-train-api", apiKey || this.#apiKey, 1)
        const result = await api.get(`trein/${journeyNumber}`, { params: { features: "zitplaats,platformitems,cta,drukte" } })
        if(result.status >= 400 && result.status < 600)
            throw new Error(`Something went wrong. Got error code ${result.status}. Body: ${result.data}`)

        return result.data
    }
}
