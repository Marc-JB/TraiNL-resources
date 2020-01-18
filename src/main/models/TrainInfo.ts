export interface TrainInfo {
    journeyId: number
    stationId: number
    type: string
    operator: string
    platform: string
    parts: {
        id: number
        type: string
        facilities: {
            toilet: boolean
            silenceCompartment: boolean
            powerSockets: boolean
            wifi: boolean
            wheelchairAccessible: boolean
            bicycles: boolean
            bar: boolean
            firstClass: boolean
        }
        image: string
        seats: number
        seatsFirstClass: number
        destinationStationId: number
    }[]
    shortened: boolean
    actualNumberOfCoaches: number
    plannedNumberOfCoaches: number
    length: number
    crowdsForecast: {
        coach: number
        capacity: number
        seats: number
        classification: "HIGH" | "MEDIUM" | "LOW" | null
    }[]
}
