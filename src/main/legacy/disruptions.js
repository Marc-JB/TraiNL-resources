/**
 * @fileoverview Functions used for the Disruptions API
 */

import { NsApi } from "./ns-api.js"
import moment from "moment"
import { expire } from "../expire.js"
import { ResponseBuilder } from "../webserver.js"

const api = NsApi.INSTANCE

/**
 * @deprecated
 * @param {import("../models/ns-disruption.js").NsDisruption | import("../models/ns-maintenance").NsMaintenance} disruption
 * @param {string} language
 */
function mapDisruption(disruption, language) {
    if (disruption.type.startsWith("prio")) {
        /** @type {import("../models/ns-disruption.js").NsDisruption} */
        // @ts-ignore
        const it = disruption
        return {
            id: it.id,
            type: "warning",
            title: it.titel,
            description: it.melding.beschrijving
        }
    } else if (disruption.type === "werkzaamheid") {
        /** @type {import("../models/ns-maintenance.js").NsMaintenance} */
        // @ts-ignore
        const it = disruption
        return {
            id: it.id,
            type: "maintenance",
            title: it.titel,
            description: it.verstoring.gevolg.split(/(geen |, |,|)extra reistijd/u)[0].trim(),
            additionalTravelTime: it.verstoring.extraReistijd,
            cause: language === "nl" ? "Werkzaamheden" : "Maintenance",
            effect: it.verstoring.gevolg,
            startDate: moment(it.verstoring.geldigheidsLijst[0].startDatum),
            endDate: moment(it.verstoring.geldigheidsLijst[0].eindDatum)
        }
    } else if (disruption.type === "verstoring") {
        /** @type {import("../models/ns-disruption.js").NsDisruption} */
        const it = disruption
        return {
            id: it.id,
            type: "disruption",
            title: it.titel,
            description: [
                it.verstoring.oorzaak,
                it.verstoring.gevolg,
                it.verstoring.verwachting
            ].filter(it => it !== null && it !== "").join(" "),
            cause: it.verstoring.oorzaak,
            effect: it.verstoring.gevolg,
            expectations: it.verstoring.verwachting,
            startDate: moment(it.verstoring.meldtijd)
        }
    }

    throw new Error("Disruption type unknown")
}

/**
 * @deprecated
 * @param {import("@peregrine/webserver").ReadonlyHttpRequest} request
 */
export const getDisruptions = async(request) => {
    const language = (request.acceptedLanguages || [["en", 1]])[0][0].split("-")[0]

    const disruptions = (await api.getDisruptions(request.url.query.get("actual") === "false" ? false : true, language))
        .map(it => mapDisruption(it, language))
        .filter(it => !!it && !!it.id && !!it.type && !!it.title)
        .map(it => ({
            id: it.id,
            type: it.type,
            title: it.title,
            description: it.description || "",
            additionalTravelTime: it.additionalTravelTime || null,
            cause: it.cause || null,
            effect: it.effect || null,
            expectations: it.expectations || null,
            startDate: it.startDate || null,
            endDate: it.endDate || null
        }))

    const repsonseBuilder = new ResponseBuilder()
    expire(repsonseBuilder, 60 * 2)
    repsonseBuilder.setJsonBody(disruptions)
    return repsonseBuilder.build()
}
