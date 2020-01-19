export interface LegacyDeparture {
    direction: string,
    departureTime: string,
    delay: number,
    actualDepartureTime: string,
    platform: string,
    platformChanged: boolean,
    plannedPlatform: string,
    journeyNumber: number,
    operator: string,
    category: string,
    cancelled: boolean,
    trainComposition: import("./LegacyTrainInfo").LegacyTrainInfo,
    majorStops: {
        id: number,
        name: string
    }[],
    messages: {
        type: string,
        message: string
    }[]
}
