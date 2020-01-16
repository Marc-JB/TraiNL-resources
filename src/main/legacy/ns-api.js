/**
 * @fileoverview Class for handling requests to the NS API.
 */

import axios from "axios"
import env from "../env.js"

/** @type {NsApi} */
let INSTANCE = null

/** @deprecated */
export class NsApi {
    #nsApi = axios.create({
        baseURL: "https://gateway.apiportal.ns.nl/reisinformatie-api/api/v2/",
        headers: {
            "Ocp-Apim-Subscription-Key": env.NS_API_KEY
        }
    })

    #nsTrainApi = axios.create({
        baseURL: "https://gateway.apiportal.ns.nl/virtual-train-api/api/v1/",
        headers: {
            "Ocp-Apim-Subscription-Key": env.NS_API_KEY
        }
    })

    /**
     * @returns {NsApi} the singleton instance for this class.
     */
    static get INSTANCE() {
        if (INSTANCE === null)
            INSTANCE = new NsApi()

        return INSTANCE
    }

    /**
     * @param {boolean} actual True if the disruptions should be actual.
     * @param {string} lang The language of the response
     * @returns {Promise<(import("../models/ns-disruption.js").NsDisruption | import("../models/ns-maintenance").NsMaintenance)[]>}
     */
    async getDisruptions(actual = true, lang) {
        try {
            return (await this.#nsApi.get("disruptions", { params: { actual, lang } })).data.payload
        } catch (error) {
            return []
        }
    }

    /**
     * @param {string} id The station code or id
     * @param {string} lang The language of the response
     * @returns {Promise<import("../models/ns-departure.js").NsDeparture[]>}
     */
    async getDepartures(id, lang) {
        const params = {
            lang
        }

        if(/^\d+$/.test(id)) params.uicCode = id
        else params.station = id

        try {
            return (await this.#nsApi.get("departures", { params })).data.payload.departures.filter((_item, index) => index < 8)
        } catch (error) {
            return []
        }
    }

    /**
     * @throws {Error}
     * @param {number} journeyNumber The journey number
     * @param {string} departureStationCode The station code of the departure station
     * @param {import("moment").Moment} departureTime The time of the departure
     * @returns {Promise<import("../models/ns-traininfo.js").NsTrainInfo>}
     */
    async getTrainInfo(journeyNumber, departureStationCode, departureTime) {
        return (await this.#nsTrainApi.get(`trein/${journeyNumber}/${departureStationCode}`, {
            params: {
                dateTime: departureTime.format("YYYY-MM-DDTHH:mm")
            }
        })).data
    }
}
