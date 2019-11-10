import moment from "moment"

/**
 * @typedef {{
 *     direction: string
 *     name: string
 *     plannedDateTime: string
 *     plannedTimeZoneOffset: number
 *     actualDateTime: string
 *     actualTimeZoneOffset: string
 *     actualTrack: string
 *     plannedTrack: string
 *     product: {
 *         number: string
 *         categoryCode: string
 *         shortCategoryName: string
 *         longCategoryName: string
 *         operatorCode: string
 *         operatorName: string
 *         type: string
 *     }
 *     trainCategory: string
 *     cancelled: boolean
 *     routeStations: { uicCode: string, mediumName: string }[]
 *     messages?: { message: string, style: "INFO" | "WARNING" }[]
 *     departureStatus: "INCOMING" | "ON_STATION" | "DEPARTED"
 * }} NsDeparture
 */

/** @type {NsDeparture | undefined} */
export const NsDeparture = undefined
