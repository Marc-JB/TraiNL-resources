import { NsDeparture } from "../models/ns-departure.js"
import { Departure } from "../models/departure.js"
import { Station } from "../models/station.js"
import moment from "moment"

/**
 * @throws {Error}
 * @param {NsDeparture} it
 * @param {(id: string) => Promise<Station>} stationLookUp
 * @returns {Promise<Departure>}
 */
export async function transformNsDeparture(it, stationLookUp) {
    let { operatorName, longCategoryName } = it.product
    if (operatorName === "R-net") {
        longCategoryName = `${operatorName} ${longCategoryName}`
        operatorName = longCategoryName === "Sprinter" ? "NS" : "Qbuzz"
    }

    const plannedDepartureTime = moment(it.plannedDateTime)
    const actualDepartureTime = moment(it.actualDateTime || it.plannedDateTime)

    /** @type {"UNDERWAY" | "ARRIVED" | "DEPARTED"} */
    let departureStatus
    switch (it.departureStatus) {
        case "INCOMING": {
            departureStatus = "UNDERWAY"
            break
        }
        case "ON_STATION": {
            departureStatus = "ARRIVED"
            break
        }
        case "DEPARTED": {
            departureStatus = "DEPARTED"
            break
        }
        default: throw new Error("Unexpected switch statement falltrough")
    }

    return {
        journeyId: parseInt(it.product.number),
        directionStationId: (await stationLookUp(it.direction)).id,
        departureTime: actualDepartureTime,
        plannedDepartureTime: plannedDepartureTime,
        delayInSeconds: actualDepartureTime.unix() - plannedDepartureTime.unix(),
        platform: it.actualTrack || it.plannedTrack || "-",
        plannedPlatform: it.plannedTrack || "-",
        platformChanged: (it.actualTrack && it.actualTrack !== it.plannedTrack) || false,
        operator: operatorName,
        category: longCategoryName,
        cancelled: it.cancelled || false,
        majorStopIds: (it.routeStations || []).map(stop => parseInt(stop.uicCode)),
        warnings: (it.messages || []).filter(it => it.style === "WARNING").map(it => it.message),
        info: (it.messages || []).filter(it => it.style === "INFO").map(it => it.message),
        departureStatus
    }
}
