/** @fileoverview Class for OVgo static API requests. */
import axios from "axios"

export class OVgoStaticAPI {
    /**
     * @throws {Error}
     * @returns {Promise<import("../models/Station").Station[]>}
     */
    static async getStations() {
        console.log("GET: stations (OVgo)")
        const api = axios.create({ baseURL: "https://Marc-JB.github.io/OVgo-api/" })
        const result = await api.get("stations.json")
        if(result.status >= 400 && result.status < 600)
            throw new Error(`Something went wrong. Got error code ${result.status}. Body: ${result.data}`)

        return result.data
    }
}
