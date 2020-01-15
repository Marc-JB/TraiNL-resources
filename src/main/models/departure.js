import moment from "moment"

/**
 * @typedef {{
 *     journeyId: number
 *     directionStationId: number
 *     actualDepartureTime: moment.Moment
 *     plannedDepartureTime: moment.Moment
 *     delayInSeconds: number
 *     actualPlatform: string
 *     plannedPlatform: string
 *     platformChanged: boolean
 *     operator: string
 *     category: string
 *     cancelled: boolean
 *     majorStopIds: number[]
 *     warnings: string[]
 *     info: string[]
 *     departureStatus: "UNDERWAY" | "ARRIVED" | "DEPARTED"
 * }} Departure
 */

/** @type {Departure | undefined} */
export const Departure = undefined
