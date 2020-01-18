import moment from "moment"
import { fixNsDeparture } from "./fix-departure.js"

/**
 * @deprecated
 * @param {number} journeyNumber
 * @param { import("../data-access/ApiCacheManager").ApiCacheManager } data
 */
export async function getTrainCompositionLegacy(journeyNumber, data) {
    const trainInfo = await data.getJourney(journeyNumber)

    const type = trainInfo.type ? trainInfo.type.toLowerCase() : ""

    const isQbuzzDMG = trainInfo.vervoerder === "R-net" && type !== "flirt"
    const isEurostar = type === "eurostar"

    if(trainInfo.materieeldelen && trainInfo.materieeldelen.some(it => it.type === "Flirt 2 TAG")) {
        trainInfo.vervoerder = `R-net door NS`
    } else if (trainInfo.vervoerder === "R-net" && type !== "flirt") {
        trainInfo.vervoerder = `R-net door Qbuzz`
    }

    if(type === "eurostar") {
        trainInfo.vervoerder = `Eurostar/NS Internationaal`
    } else if(type === "tvg") {
        trainInfo.vervoerder = `Thalys/NS Internationaal`
    } else if(type === "ice") {
        trainInfo.vervoerder = `DB/NS Internationaal`
    }

    return {
        shortened: trainInfo.ingekort || false,
        length: trainInfo.lengte || null,
        plannedLength: trainInfo.geplandeLengte || trainInfo.lengte || null,
        parts: (trainInfo.materieeldelen || []).map(part => {
            let imageUrl = part.afbeelding || null
            let type = part.type || null

            const facilities = part.faciliteiten || []

            if (isEurostar && !!imageUrl) {
                imageUrl = "https://marc-jb.github.io/OVgo-api/eurostar_e320.png"
                type = "Eurostar e320/Class 374"
            }

            if (isQbuzzDMG) {
                type = "Qbuzz GTW"
                if(!imageUrl)
                    imageUrl = "https://marc-jb.github.io/OVgo-api/gtw_qbuzz_26.png"
            }

            return {
                image: imageUrl,
                number: part.materieelnummer || null,
                type,
                hasWifi: facilities.includes("WIFI"),
                hasPowerSockets: facilities.includes("STROOM"),
                isAccessible: facilities.includes("TOEGANKELIJK")
            }
        })
    }
}

/**
 * @deprecated
 * @param { import("../data-access/ApiCacheManager").ApiCacheManager } data
 * @param { import("../models/ns-departure.js").NsDeparture } it
 */
export async function mapDepartureLegacy(data, it) {
    const departure = await fixNsDeparture(data, it)

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
        trainComposition: await getTrainCompositionLegacy(parseInt(departure.product.number), data),
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
