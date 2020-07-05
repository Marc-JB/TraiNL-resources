export interface Departure {
    id: number
    direction: import("./Station").Station
    actualDepartureTime: Date
    plannedDepartureTime: Date
    delayInSeconds: number
    actualPlatform: string
    plannedPlatform: string
    platformChanged: boolean
    operator: string
    category: string
    cancelled: boolean
    majorStops: import("./Station").Station[]
    warnings: string[]
    info: string[]
    departureStatus: "UNDERWAY" | "ARRIVED" | "DEPARTED"
    trainComposition: import("./TrainInfo").TrainInfo
}
