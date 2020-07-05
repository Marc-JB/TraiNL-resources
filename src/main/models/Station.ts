export interface CountryInfo {
    flag: string
    code: string
    name: string
}

export interface StationFacilities {
    travelAssistance: boolean
    departureTimesBoard: boolean
}

export interface Coordinates {
    latitude: number
    longitude: number
}

export interface Station {
    id: number
    code: string
    name: string
    country: CountryInfo
    facilities: StationFacilities
    coordinates: Coordinates
    alternativeNames: string[]
    platforms: string[]
}
