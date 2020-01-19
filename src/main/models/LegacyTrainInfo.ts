export interface LegacyTrainPart {
    image: string | null,
    number: number | null,
    type: string | null,
    hasWifi: boolean,
    hasPowerSockets: boolean,
    isAccessible: boolean
}

export interface LegacyTrainInfo {
    shortened: boolean,
    length: number | null,
    plannedLength: number | null,
    parts: LegacyTrainPart[]
}
