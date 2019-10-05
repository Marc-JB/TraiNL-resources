/**
 * @fileoverview Functions used for the Disruptions API
 */

import { NsApi } from "./ns-api.js"
// eslint-disable-next-line no-unused-vars
import express from "express"
import moment from "moment"

const api = NsApi.INSTANCE

/**
 * @enum {string}
 */
const DISRUPTION_TYPE = {
    WARNING: "warning",
    MAINTENANCE: "maintenance",
    DISRUPTION: "disruption"
}

/**
 * @throws {Error} when disruption type is unknown
 * @param {{ [key: string]: any }} disruption
 * @returns {string}
 */
function getDisruptionType(disruption) {
    if (disruption.type.startsWith("prio"))
        return DISRUPTION_TYPE.WARNING
    else if (disruption.type === "werkzaamheid")
        return DISRUPTION_TYPE.MAINTENANCE
    else if (disruption.type === "verstoring")
        return DISRUPTION_TYPE.DISRUPTION

    throw new Error("Disruption type unknown")
}

/**
 * @param {{ [key: string]: any }} disruption
 * @param {string} language
 */
function mapDisruption(disruption, language) {
    try {
        const type = getDisruptionType(disruption)
        switch (type) {
            case DISRUPTION_TYPE.WARNING:
                return {
                    id: disruption.id,
                    type: "warning",
                    title: disruption.titel,
                    description: disruption.melding.beschrijving
                }
            case DISRUPTION_TYPE.MAINTENANCE:
                return {
                    id: disruption.id,
                    type: "maintenance",
                    title: disruption.titel,
                    description: disruption.verstoring.gevolg.split(/(geen |, |,|)extra reistijd/u)[0].trim(),
                    additionalTravelTime: disruption.verstoring.extraReistijd,
                    cause: language === "nl" ? "Werkzaamheden" : "Maintenance",
                    effect: disruption.verstoring.gevolg,
                    startDate: moment(disruption.verstoring.geldigheidsLijst[0].startDatum).format(),
                    endDate: moment(disruption.verstoring.geldigheidsLijst[0].eindDatum).format()
                }
            case DISRUPTION_TYPE.DISRUPTION:
                return {
                    id: disruption.id,
                    type: "disruption",
                    title: disruption.titel,
                    description: [
                        disruption.verstoring.oorzaak,
                        disruption.verstoring.gevolg,
                        disruption.verstoring.verwachting
                    ].filter(it => it !== null && it !== "").join(" "),
                    cause: disruption.verstoring.oorzaak,
                    effect: disruption.verstoring.gevolg,
                    expectations: disruption.verstoring.verwachting,
                    startDate: moment(disruption.verstoring.meldtijd).format()
                }
        }
    } catch (error) {
        console.log(error)
    }

    return {
        id: disruption.id,
        title: disruption.titel
    }
}

/**
 * @param {express.Request} request
 * @param {express.Response} response
 */
export const getDisruptions = async(request, response) => {
    const language = (request.headers["accept-language"] || "en").split(",")[0]

    const disruptions = (await api.getDisruptions(request.query.actual || true, language))
        .map(disruption => mapDisruption(disruption, language))
        .map(message => ({
            id: message.id || "other",
            type: message.type || "other",
            title: message.title || "???",
            description: message.description || "",
            additionalTravelTime: message.additionalTravelTime || null,
            cause: message.cause || null,
            effect: message.effect || null,
            expectations: message.expectations || null,
            startDate: message.startDate || null,
            endDate: message.endDate || null
        }))

    response.status(200).json(disruptions)
}
