import moment from "moment"
import { fixNsDeparture } from "./fix-departure.js"
import { fixNsTrainInfo } from "./fix-traininfo.js"

/**
 * @deprecated
 * @param {number} journeyNumber
 * @param { import("../data-access/ApiCacheManager").ApiCacheManager } data
 * @param {import("../models/NsDeparture").NsDeparture} [departure]
 * @param {"en" | "nl"} [language]
 */
export async function getTrainCompositionLegacy(journeyNumber, data, departure = null, language = "en") {
    const trainInfo = await fixNsTrainInfo(data, await data.getJourney(journeyNumber), departure, language)

    return {
        shortened: trainInfo.ingekort,
        length: trainInfo.lengte || null,
        plannedLength: trainInfo.geplandeLengte || null,
        parts: trainInfo.materieeldelen.map(part => ({
            image: part.afbeelding || null,
            number: part.materieelnummer || null,
            type: part.type || null,
            hasWifi: part.faciliteiten.includes("WIFI"),
            hasPowerSockets: part.faciliteiten.includes("STROOM"),
            isAccessible: part.faciliteiten.includes("TOEGANKELIJK")
        }))
    }
}

/**
 * @deprecated
 * @param { import("../data-access/ApiCacheManager").ApiCacheManager } data
 * @param { import("../models/NsDeparture").NsDeparture } it
 * @param {"en" | "nl"} [language]
 */
export async function mapDepartureLegacy(data, it, language = "en") {
    const departure = await fixNsDeparture(data, it, language)

    const plannedDepartureTime = moment(departure.plannedDateTime)
    const actualDepartureTime = moment(departure.actualDateTime)

    return {
        direction: departure.direction,
        departureTime: plannedDepartureTime.format(),
        delay: actualDepartureTime.unix() - plannedDepartureTime.unix(),
        actualDepartureTime: actualDepartureTime.format(),
        platform: departure.actualTrack,
        platformChanged: departure.actualTrack !== departure.plannedTrack,
        plannedPlatform: departure.plannedTrack,
        journeyNumber: parseInt(departure.product.number),
        operator: departure.product.operatorName,
        category: departure.product.longCategoryName,
        cancelled: departure.cancelled,
        trainComposition: await getTrainCompositionLegacy(parseInt(departure.product.number), data, departure, language),
        majorStops: departure.routeStations.map(stop => ({
            id: parseInt(stop.uicCode),
            name: stop.mediumName
        })),
        messages: departure.messages.map(message => ({
            type: message.style,
            message: message.message
        }))
    }
}
