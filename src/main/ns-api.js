/**
 * @fileoverview Class for handling requests to the NS API.
 */

import axios from "axios"
// eslint-disable-next-line no-unused-vars
import moment from "moment"
import env from "./env.js"
import { transform } from "./stationsListBuilder.js"

/** @type {NsApi} */
let INSTANCE = null

export class NsApi {

    /**
     * @protected
     */
    constructor() {
        this.ovGoStaticApi = axios.create({
            baseURL: "https://Marc-JB.github.io/OVgo-api/"
        })

        this.nsApi = axios.create({
            baseURL: "https://gateway.apiportal.ns.nl/reisinformatie-api/api/v2/",
            headers: {
                "Ocp-Apim-Subscription-Key": env.NS_API_KEY
            }
        })

        this.nsTrainApi = axios.create({
            baseURL: "https://gateway.apiportal.ns.nl/virtual-train-api/api/v1/",
            headers: {
                "Ocp-Apim-Subscription-Key": env.NS_API_KEY
            }
        })
    }

    /**
     * @returns {NsApi} the singleton instance for this class.
     */
    static get INSTANCE() {
        if (INSTANCE === null)
            INSTANCE = new NsApi()

        return INSTANCE
    }

    /**
     * @param {boolean} getFromNs
     * @returns {Promise<{
     *     id: number,
     *     code: string,
     *     name: string,
     *     country: { flag: string, code: string, name: string },
     *     facilities: { travelAssistance: boolean, departureTimesBoard: boolean },
     *     coordinates: { latitude: number, longitude: number },
     *     alternativeNames: string[],
     *     platforms: string[]
     * }[]>}
     */
    async getAllStations(getFromNs = false) {
        if(getFromNs){
            const { data } = await this.nsApi.get("stations")
            return data.payload.map(transform)
        }

        if (!this.stationsCache) {
            try {
                this.stationsCache = (await this.ovGoStaticApi.get("stations.json")).data
            } catch (error) {
                return []
            }
        }

        return this.stationsCache
    }

    /**
     * @param {boolean} actual True if the disruptions should be actual.
     * @param {string} lang The language of the response
     * @returns {Promise<{ [key: string]: any }[]>}
     */
    async getDisruptions(actual = true, lang) {
        try {
            return (await this.nsApi.get("disruptions", { params: { actual, lang } })).data.payload
        } catch (error) {
            return []
        }
    }

    /**
     * @param {string} id The station code or id
     * @param {string} lang The language of the response
     * @returns {Promise<{ [key: string]: any }[]>}
     */
    async getDepartures(id, lang) {
        const params = {
            lang
        }

        if(/^\d+$/.test(id)) params.uicCode = id
        else params.station = id

        try {
            return (await this.nsApi.get("departures", { params })).data.payload.departures.filter((_item, index) => index < 8)
        } catch (error) {
            return []
        }
    }

    /**
     * @param {number} journeyNumber The journey number
     * @param {string} departureStationCode The station code of the departure station
     * @param {moment.Moment} departureTime The time of the departure
     * @returns {Promise<{ [key: string]: any }>}
     */
    async getTrainInfo(journeyNumber, departureStationCode, departureTime) {
        try {
            return (await this.nsTrainApi.get(`trein/${journeyNumber}/${departureStationCode}`, {
                params: {
                    dateTime: departureTime.format("YYYY-MM-DDTHH:mm")
                }
            })).data
        } catch (error) {
            return {}
        }
    }
}
