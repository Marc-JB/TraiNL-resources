import moment from "moment"

/**
 * @throws {Error}
 * @param {import("../models/ns-departure.js").NsDeparture} it
 * @param {(id: string) => Promise<import("../models/station.js").Station>} stationLookUp
 * @returns {Promise<import("../models/departure.js").Departure>}
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
        actualDepartureTime: actualDepartureTime,
        plannedDepartureTime: plannedDepartureTime,
        delayInSeconds: actualDepartureTime.unix() - plannedDepartureTime.unix(),
        actualPlatform: it.actualTrack || it.plannedTrack || "-",
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
