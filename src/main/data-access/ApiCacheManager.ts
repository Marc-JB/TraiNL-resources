import { Cache } from "./cache"
import { NsApi } from "./ns-api"
import { OVgoStaticAPI } from "./ovgostatic-api"
import { Station } from "../models/Station"
import { NsDeparture } from "../models/ns/NsDeparture"
import { NsTrainInfo } from "../models/ns/NsTrainInfo"
import { NsDisruption } from "../models/ns/NsDisruption"
import { NsMaintenance } from "../models/ns/NsMaintenance"

export class ApiCacheManager {
    private readonly stations: Cache<Station[]>

    private readonly departures = new Map<number, Map<string, Cache<NsDeparture[]>>>()

    private readonly journeys = new Map<number, Cache<NsTrainInfo | null>>()

    private readonly disruptions = new Map<string, Cache<NsDisruption[]>>()

    private readonly maintenance = new Map<string, Map<boolean, Cache<NsMaintenance[]>>>()

    public constructor(
        private readonly nsApi: NsApi,
        private readonly ovGoApi: typeof OVgoStaticAPI
    ) {
        this.stations = new Cache<Station[]>(60 * 60 * 24, async () => this.ovGoApi.getStations())
    }

    public async getStations(): Promise<Station[]> {
        return this.stations.value
    }

    public async getDepartures(stationCode: number, language: "en" | "nl"): Promise<NsDeparture[]> {
        if (!this.departures.has(stationCode)) {
            this.departures.set(stationCode, new Map())
        }

        if (!this.departures.get(stationCode)!.has(language)) {
            this.departures.get(stationCode)!.set(language, new Cache(90, async () => this.nsApi.getDepartures(stationCode, language)))
        }

        return this.departures.get(stationCode)!.get(language)!.value
    }

    public async getJourney(id: number): Promise<NsTrainInfo | null> {
        if (!this.journeys.has(id)) {
            this.journeys.set(id, new Cache(60 * 5, async () => this.nsApi.getTrainInfo(id)))
        }

        return this.journeys.get(id)!.value
    }

    public async getDisruptions(language: "en" | "nl"): Promise<NsDisruption[]> {
        if (!this.disruptions.has(language)) {
            this.disruptions.set(language, new Cache(60 * 2, async () => this.nsApi.getDisruptions(language)))
        }

        return this.disruptions.get(language)!.value
    }

    public async getMaintenance(actual: boolean = true, language: "en" | "nl"): Promise<NsMaintenance[]> {
        if (!this.maintenance.has(language)) {
            this.maintenance.set(language, new Map())
        }

        if (!this.maintenance.get(language)!.has(actual)) {
            this.maintenance.get(language)!.set(actual, new Cache(60 * 5, async () => this.nsApi.getMaintenanceList(actual, language)))
        }

        return this.maintenance.get(language)!.get(actual)!.value
    }
}
