/** @fileoverview Class for OVgo static API requests. */
import axios from "axios"
import { Station } from "../models/Station"

// eslint-disable-next-line @typescript-eslint/naming-convention
export const OVgoStaticAPI = {
    getStations: async (): Promise<Station[]> => {
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
