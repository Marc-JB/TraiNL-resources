export type NsTrainFacility = "TOILET" | "STILTE" | "STROOM" | "TOEGANKELIJK" | "FIETS" | "WIFI" | "BISTRO"

export interface NsTrainSeats {
    staanplaatsEersteKlas: number
    staanplaatsTweedeKlas: number
    zitplaatsEersteKlas: number
    zitplaatsTweedeKlas: number
    klapstoelEersteKlas: number
    klapstoelTweedeKlas: number
}

export interface NsTrainPart {
    materieelnummer?: number
    type: string
    faciliteiten: NsTrainFacility[]
    afbeelding?: string
    breedte?: number
    hoogte?: number
    zitplaatsen?: NsTrainSeats
    eindbestemming?: string
    bakken: {
        afbeelding: {
            url: string
            breedte: number
            hoogte: number
        }
    }[]
}

export interface NsCrowdsForecast {
    coach: number
    capacity: number
    seats: number
    classification: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN"
    paddingLeft: number
    paddingLeftFromPrevious: number
    width: number
}

export interface NsTrainInfo {
    crowdInfoResponse?: string
    bron: string
    ritnummer: number
    station: string
    type: string
    vervoerder: string
    spoor: string
    materieeldelen: NsTrainPart[]
    ingekort: boolean
    lengte: number
    geplandeLengte?: number
    lengteInMeters: number
    lengteInPixels: number
    drukteVoorspelling?: NsCrowdsForecast[]
    perronVoorzieningen?: {
        paddingLeft: number
        width: number
        type: "PERRONLETTER" | "LIFT" | "TRAP" | "ROLTRAP"
        description: string
    }[]
    bakbord?: number
    rijrichting?: "LINKS" | "RECHTS"
}
