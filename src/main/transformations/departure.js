import moment from "moment"
import { fixNsDeparture } from "./fix-departure"
import { searchStation } from "../searchStations"

/**
 * @throws {Error}
 * @param { import("../data-access/ApiCacheManager").ApiCacheManager } data
 * @param {import("../models/ns-departure.js").NsDeparture} departure
 * @param {"en" | "nl"} [language]
 * @returns {Promise<import("../models/departure.js").Departure>}
 */
export async function transformNsDeparture(data, departure, language = "en") {
    const it = await fixNsDeparture(data, departure, language)

    const plannedDepartureTime = moment(it.plannedDateTime)
    const actualDepartureTime = moment(it.actualDateTime)

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
        directionStationId: (await searchStation(data, it.direction)).id,
        actualDepartureTime: actualDepartureTime,
        plannedDepartureTime: plannedDepartureTime,
        delayInSeconds: actualDepartureTime.unix() - plannedDepartureTime.unix(),
        actualPlatform: it.actualTrack,
        plannedPlatform: it.plannedTrack,
        platformChanged: it.actualTrack !== it.plannedTrack,
        operator: it.product.operatorName,
        category: it.product.longCategoryName,
        cancelled: it.cancelled || false,
        majorStopIds: it.routeStations.map(stop => parseInt(stop.uicCode)),
        warnings: it.messages.filter(it => it.style === "WARNING").map(it => it.message),
        info: it.messages.filter(it => it.style === "INFO").map(it => it.message),
        departureStatus
    }
}
