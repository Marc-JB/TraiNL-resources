/**
 * @fileoverview Functions used for the Station API
 */

import { NsApi } from "./ns-api.js"
import { expire } from "../expire.js"
import moment from "moment"
import { ResponseBuilder } from "../webserver.js"

const api = NsApi.INSTANCE

/**
 * @deprecated
 * @param {number} journeyNumber
 * @param {string} stationCode
 * @param {moment.Moment} departureTime
 */
async function getTrainComposition(journeyNumber, stationCode, departureTime) {
    const trainInfo = await api.getTrainInfo(journeyNumber, stationCode, departureTime)

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
                imageUrl = imageUrl && imageUrl.includes("8") ?  "https://marc-jb.github.io/OVgo-api/gtw_qbuzz_28.png" : "https://treinposities.nl/matimg/gtw_qbuzz_26.png"
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
 * @param {import("../models/ns-departure.js").NsDeparture} departure
 * @param {string} stationCode
 */
async function mapDeparture(departure, stationCode) {
    let { operatorName, longCategoryName } = departure.product
    if (operatorName === "R-net") {
        operatorName = longCategoryName === "Sprinter" ? "R-net door NS" : "R-net door Qbuzz"
    }

    const plannedDepartureTime = moment(departure.plannedDateTime)
    const actualDepartureTime = moment(departure.actualDateTime || departure.plannedDateTime)

    const trainComposition = await getTrainComposition(parseInt(departure.product.number), stationCode, plannedDepartureTime)

    return {
        direction: departure.direction,
        departureTime: plannedDepartureTime.format(),
        delay: actualDepartureTime.unix() - plannedDepartureTime.unix(),
        actualDepartureTime: actualDepartureTime.format(),
        platform: departure.actualTrack || departure.plannedTrack || "-",
        platformChanged: (departure.actualTrack && departure.actualTrack !== departure.plannedTrack) || false,
        plannedPlatform: departure.plannedTrack || "-",
        journeyNumber: parseInt(departure.product.number),
        operator: operatorName,
        category: longCategoryName,
        cancelled: departure.cancelled || false,
        trainComposition,
        majorStops: (departure.routeStations || []).map(stop => ({
            id: parseInt(stop.uicCode),
            name: stop.mediumName
        })),
        messages: (departure.messages || []).map(message => ({
            type: message.style,
            message: message.message
        }))
    }
}

/**
 * @deprecated
 * @param {import("@peregrine/webserver").ReadonlyHttpRequest} request
 */
export const getDeparturesForStation = async(request) => {
    const language = request.acceptedLanguages.size > 0 ? Array.from(request.acceptedLanguages)[0][0].split("-")[0] : "en"

    const stationCode = request.url.params.get("id")

    const departures = (await api.getDepartures(stationCode, language))
        .map(departure => mapDeparture(departure, stationCode))

    const responseBuilder = new ResponseBuilder()
    expire(responseBuilder, 90)
    responseBuilder.setJsonBody(await Promise.all(departures))
    return responseBuilder.build()
}
