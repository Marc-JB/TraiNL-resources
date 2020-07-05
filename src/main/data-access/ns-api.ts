/** @fileoverview Class for handling requests to the NS API. */
import axios, { AxiosInstance } from "axios"
import { NsDisruption } from "../models/ns/NsDisruption"
import { NsMaintenance } from "../models/ns/NsMaintenance"
import { NsDeparture } from "../models/ns/NsDeparture"
import { NsStation } from "../models/ns/NsStation"
import { NsTrainInfo } from "../models/ns/NsTrainInfo"

export class NsApi {
    public constructor(
        private readonly lang: "en" | "nl" | string = "en",
        private readonly apiKey: string | null = null
    ) {}

    protected static _getApi(apiName: string, apiKey: string, apiVersion: number = 1): AxiosInstance {
        return axios.create({
            baseURL: `https://gateway.apiportal.ns.nl/${apiName}/api/v${apiVersion}/`,
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "Ocp-Apim-Subscription-Key": apiKey
            }
        })
    }

    public async getDisruptions(
        lang: "en" | "nl" | string | null = null,
        apiKey: string | null = null
    ): Promise<NsDisruption[]> {
        const api = NsApi._getApi("reisinformatie-api", apiKey ?? this.apiKey ?? "", 2)
        try {
            return (await api.get("disruptions", {
                params: {
                    type: "storing",
                    lang: lang ?? this.lang
                }
            })).data.payload ?? []
        } catch (error) {
            console.error(error)
            return []
        }
    }

    public async getMaintenanceList(
        actual: boolean = true,
        lang: "en" | "nl" | string | null = null,
        apiKey: string | null = null
    ): Promise<NsMaintenance[]> {
        const api = NsApi._getApi("reisinformatie-api", apiKey ?? this.apiKey ?? "", 2)
        try {
            return (await api.get("disruptions", {
                params: {
                    type: "werkzaamheid",
                    lang: lang ?? this.lang,
                    actual
                }
            })).data.payload ?? []
        } catch (error) {
            console.error(error)
            return []
        }
    }

    public async getDepartures(
        id: number,
        lang: "en" | "nl" | string | null = null,
        apiKey: string | null = null
    ): Promise<NsDeparture[]> {
        console.log(`GET: departures for ${id} (${lang ?? this.lang})`)
        const api = NsApi._getApi("reisinformatie-api", apiKey ?? this.apiKey ?? "", 2)
        try {
            return (await api.get("departures", {
                params: {
                    lang: lang ?? this.lang,
                    uicCode: `${id}`
                }
            })).data.payload.departures ?? []
        } catch (error) {
            console.error(error)
            return []
        }
    }

    public async getStations(apiKey: string | null = null): Promise<NsStation[]> {
        console.log("GET: stations (NS)")
        const api = NsApi._getApi("reisinformatie-api", apiKey ?? this.apiKey ?? "", 2)
        try {
            return (await api.get("stations")).data.payload ?? []
        } catch (error) {
            console.error(error)
            return []
        }
    }

    public async getTrainInfo(
        journeyNumber: number,
        apiKey: string | null = null
    ): Promise<NsTrainInfo | null> {
        console.log(`GET: train info for ${journeyNumber}`)
        const api = NsApi._getApi("virtual-train-api", apiKey ?? this.apiKey ?? "", 1)
        try {
            return (await api.get(`trein/${journeyNumber}`, {
                params: {
                    features: "zitplaats,platformitems,cta,drukte"
                }
            })).data ?? null
        } catch (error) {
            console.error(error)
            return null
        }
    }
}
