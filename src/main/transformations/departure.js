import moment from "moment"
import { fixNsDeparture } from "./fix-departure.js"
import { searchStation } from "../searchStations.js"
import { transformNsTrainInfo } from "./train-info.js"

/**
 * @throws {Error}
 * @param { import("../data-access/ApiCacheManager").ApiCacheManager } data
 * @param {import("../models/NsDeparture").NsDeparture} departure
 * @param {"en" | "nl"} [language]
 * @returns {Promise<import("../models/Departure").Departure>}
 */
export async function transformNsDeparture(data, departure, language = "en") {
    const it = await fixNsDeparture(data, departure, language)

    const plannedDepartureTime = moment(it.plannedDateTime).toDate()
    const actualDepartureTime = moment(it.actualDateTime).toDate()

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
        direction: await searchStation(data, it.direction),
        actualDepartureTime: actualDepartureTime,
        plannedDepartureTime: plannedDepartureTime,
        delayInSeconds: Math.round((actualDepartureTime.getTime() - plannedDepartureTime.getTime()) / 1000),
        actualPlatform: it.actualTrack,
        plannedPlatform: it.plannedTrack,
        platformChanged: it.actualTrack !== it.plannedTrack,
        operator: it.product.operatorName,
        category: it.product.longCategoryName,
        cancelled: it.cancelled || false,
        majorStops: await Promise.all(it.routeStations.map(async stop => (await data.getStations()).find(it => it.id === parseInt(stop.uicCode)))),
        warnings: it.messages.filter(it => it.style === "WARNING").map(it => it.message),
        info: it.messages.filter(it => it.style === "INFO").map(it => it.message),
        departureStatus,
        trainComposition: await transformNsTrainInfo(data, await data.getJourney(parseInt(it.product.number)), it, language)
    }
}
