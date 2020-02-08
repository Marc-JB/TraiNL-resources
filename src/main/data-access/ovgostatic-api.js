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
        try {
            return (await api.get("stations.json")).data ?? []
        } catch (error) {
            console.error(error)
            return []
        }
    }
}
