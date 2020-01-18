export interface Station {
    id: number,
    code: string,
    name: string,
    country: {
        flag: string,
        code: string,
        name: string
    },
    facilities: {
        travelAssistance: boolean,
        departureTimesBoard: boolean
    },
    coordinates: {
        latitude: number,
        longitude: number
    },
    alternativeNames: string[],
    platforms: string[],
}
