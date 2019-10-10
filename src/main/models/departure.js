import moment from "moment"
import { TrainInfo } from "./traininfo.js"

/**
 * @typedef {{
 *     journeyId: number
 *     directionStationId: number
 *     departureTime: moment.Moment
 *     plannedDepartureTime: moment.Moment
 *     delayInSeconds: number
 *     platform: string
 *     plannedPlatform: string
 *     platformChanged: boolean
 *     operator: string
 *     category: string
 *     cancelled: boolean
 *     majorStopIds: number[]
 *     warnings: string[]
 *     info: string[]
 *     departureStatus: "UNDERWAY" | "ARRIVED" | "DEPARTED"
 *     trainComposition?: TrainInfo
 * }} Departure
 */

/** @type {Departure | undefined} */
export const Departure = undefined
