export interface NsTrainInfo {
    crowdInfoResponse?: string
    bron: string
    ritnummer: number
    station: string
    type: string
    vervoerder: string
    spoor: string
    materieeldelen: {
        materieelnummer: number
        type: string
        faciliteiten: ("TOILET" | "STILTE" | "STROOM" | "TOEGANKELIJK" | "FIETS" | "WIFI" | "BISTRO")[]
        afbeelding: string
        breedte: number
        hoogte: number
        zitplaatsen?: {
            staanplaatsEersteKlas: number
            staanplaatsTweedeKlas: number
            zitplaatsEersteKlas: number
            zitplaatsTweedeKlas: number
            klapstoelEersteKlas: number
            klapstoelTweedeKlas: number
        }
        eindbestemming: string
        bakken: {
            afbeelding: {
                url: string,
                breedte: number,
                hoogte: number
            }
        }[]
    }[]
    ingekort: boolean
    lengte: number
    geplandeLengte?: number
    lengteInMeters: number
    lengteInPixels: number
    drukteVoorspelling?: {
        coach: number
        capacity: number
        seats: number
        classification: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN"
        paddingLeft: number
        paddingLeftFromPrevious: number
        width: number
    }[]
    perronVoorzieningen?: {
        paddingLeft: number
        width: number
        type: "PERRONLETTER" | "LIFT" | "TRAP" | "ROLTRAP"
        description: string
    }[]
    bakbord?: number
    rijrichting?: "LINKS" | "RECHTS"
}
