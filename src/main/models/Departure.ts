export interface Departure {
    journeyId: number
    directionStationId: number
    actualDepartureTime: import("moment").Moment
    plannedDepartureTime: import("moment").Moment
    delayInSeconds: number
    actualPlatform: string
    plannedPlatform: string
    platformChanged: boolean
    operator: string
    category: string
    cancelled: boolean
    majorStopIds: number[]
    warnings: string[]
    info: string[]
    departureStatus: "UNDERWAY" | "ARRIVED" | "DEPARTED"
}
