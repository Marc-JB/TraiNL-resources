import { NsDeparture } from "../models/ns-departure.js"
import { Departure } from "../models/departure.js"
import { Station } from "../models/station.js"
import moment from "moment"

/**
 * @throws {Error}
 * @param {NsDeparture} departure
 * @param {(id: string) => Promise<Station>} stationLookUp
 * @returns {Promise<Departure>}
 */
export async function transformNsDeparture(departure, stationLookUp) {
    let { operatorName, longCategoryName } = departure.product
    if (operatorName === "R-net") {
        longCategoryName = `${operatorName} ${longCategoryName}`
        operatorName = longCategoryName === "Sprinter" ? "NS" : "Qbuzz"
    }

    const plannedDepartureTime = moment(departure.plannedDateTime)
    const actualDepartureTime = moment(departure.actualDateTime || departure.plannedDateTime)

    /** @type {"UNDERWAY" | "ARRIVED" | "DEPARTED"} */
    let departureStatus
    switch (departure.departureStatus) {
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
        journeyId: parseInt(departure.product.number),
        directionStationId: (await stationLookUp(departure.direction)).id,
        departureTime: actualDepartureTime,
        plannedDepartureTime: plannedDepartureTime,
        delayInSeconds: actualDepartureTime.unix() - plannedDepartureTime.unix(),
        platform: departure.actualTrack || departure.plannedTrack || "-",
        plannedPlatform: departure.plannedTrack || "-",
        platformChanged: (departure.actualTrack && departure.actualTrack !== departure.plannedTrack) || false,
        operator: operatorName,
        category: longCategoryName,
        cancelled: departure.cancelled || false,
        majorStopIds: (departure.routeStations || []).map(stop => parseInt(stop.uicCode)),
        warnings: (departure.messages || []).filter(it => it.style === "WARNING").map(it => it.message),
        info: (departure.messages || []).filter(it => it.style === "INFO").map(it => it.message),
        departureStatus
    }
}
