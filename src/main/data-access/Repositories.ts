import { Station } from "../models/Station"
import { NsDeparture } from "../models/ns/NsDeparture"
import { NsTrainInfo } from "../models/ns/NsTrainInfo"
import { NsDisruption } from "../models/ns/NsDisruption"
import { NsMaintenance } from "../models/ns/NsMaintenance"

export interface DataRepository {
    getStations(): Promise<Station[]>

    getDepartures(stationCode: number, language: "en" | "nl"): Promise<NsDeparture[]>

    getJourney(id: number): Promise<NsTrainInfo | null>

    getDisruptions(language: "en" | "nl"): Promise<NsDisruption[]>

    getMaintenance(actual: boolean, language: "en" | "nl"): Promise<NsMaintenance[]>
}
