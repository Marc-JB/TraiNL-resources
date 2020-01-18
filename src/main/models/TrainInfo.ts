export interface TrainFacilities {
    toilet: boolean
    silenceCompartment: boolean
    powerSockets: boolean
    wifi: boolean
    wheelchairAccessible: boolean
    bicycles: boolean
    bar: boolean
    firstClass: boolean
}

export interface TrainPart {
    id: number
    type: string
    facilities: TrainFacilities
    image: string
    seats: number
    seatsFirstClass: number
    destinationStationId: number
}

export interface CrowdsForecast {
    coach: number
    capacity: number
    seats: number
    classification: "HIGH" | "MEDIUM" | "LOW" | null
}

export interface TrainInfo {
    journeyId: number
    stationId: number
    type: string
    operator: string
    platform: string
    parts: TrainPart[]
    shortened: boolean
    actualNumberOfCoaches: number
    plannedNumberOfCoaches: number
    length: number
    crowdsForecast: CrowdsForecast[]
}
