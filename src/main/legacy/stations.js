/**
 * @fileoverview Functions used for the Station API
 */

import { NsApi } from "./ns-api.js"
import { expire } from "../expire.js"
import moment from "moment"

const api = NsApi.INSTANCE

/**
 * @deprecated
 * @param {number} journeyNumber
 * @param {string} operatorName
 * @param {string} stationCode
 * @param {moment.Moment} departureTime
 */
async function getTrainComposition(journeyNumber, operatorName, stationCode, departureTime) {
    const trainInfo = await api.getTrainInfo(journeyNumber, stationCode, departureTime)

    return {
        shortened: trainInfo.ingekort || false,
        length: trainInfo.lengte || null,
        plannedLength: trainInfo.geplandeLengte || trainInfo.lengte || null,
        parts: (trainInfo.materieeldelen || []).map(part => {
            let imageUrl = part.afbeelding || null
            let type = part.type || null

            if (imageUrl === null && type === "EUROSTAR") {
                imageUrl = "https://marc-jb.github.io/OVgo-api/eurostar_e320.png"
                type = "Eurostar e320/Class 374"
            }

            if (operatorName === "Qbuzz" && imageUrl !== null && imageUrl.includes("arriva")) {
                imageUrl = `https://marc-jb.github.io/OVgo-api/gtw_e_${imageUrl.includes("6") ? "6" : "8"}_qbuzz${imageUrl.includes("6") ? "_v2" : ""}.png`
            }
            if (operatorName === "Qbuzz" && type !== null && type.includes("Arriva")) {
                type = type.replace("Arriva", "Qbuzz")
            }

            const facilities = part.faciliteiten || []

            return {
                image: imageUrl,
                number: part.materieelnummer || null,
                type,
                hasWifi: facilities.includes("WIFI"),
                hasPowerSockets: facilities.includes("STROOM") && operatorName !== "Qbuzz",
                isAccessible: facilities.includes("TOEGANKELIJK")
            }
        })
    }
}

/**
 * @deprecated
 * @param {{ [key: string]: any }} departure
 * @param {string} stationCode
 */
async function mapDeparture(departure, stationCode) {
    let { operatorName, longCategoryName } = departure.product
    if (operatorName === "R-net") {
        longCategoryName = `${operatorName} ${longCategoryName}`
        operatorName = longCategoryName === "Sprinter" ? "NS" : "Qbuzz"
    }

    const plannedDepartureTime = moment(departure.plannedDateTime)
    const actualDepartureTime = moment(departure.actualDateTime || departure.plannedDateTime)

    const trainComposition =
        await getTrainComposition(departure.product.number, operatorName, stationCode, plannedDepartureTime)

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
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 */
export const getDeparturesForStation = async(request, response) => {
    const language = (request.headers["accept-language"] || "en").split(",")[0]

    const stationCode = request.params.id

    const departures = (await api.getDepartures(stationCode, language))
        .map(departure => mapDeparture(departure, stationCode))

    expire(response, 90)
    response.status(200).json(await Promise.all(departures))
}

/**
 * @deprecated
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 */
export const getStations = async(request, response) => {
    expire(response, 60 * 60 * 24 * 5)
    response.status(200).json(await api.getAllStations(/*request.query.getFromNs === "true"*/))
}
