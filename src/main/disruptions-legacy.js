import moment from "moment"
import { ResponseBuilder } from "./webserver.js"

/**
 * @param {import("@peregrine/webserver").Endpoint} endpoint
 * @param { import("./data-access/ApiCacheManager").ApiCacheManager } data
 */
export function loadDeparturesLegacy(endpoint, data) {
    endpoint.get("disruptions.json", async(request) => {
        /** @type {"en" | "nl"} */
        // @ts-ignore
        const language = request.acceptedLanguages.size > 0 ? Array.from(request.acceptedLanguages)[0][0].split("-")[0] : "en"

        const actual = request.url.query.get("actual") === "false" ? false : true

        /** @type {(import("./models/NsDisruption").NsDisruption | import("./models/NsMaintenance").NsMaintenance)[]} */
        // @ts-ignore
        const disruptionList = (await Promise.all([data.getDisruptions(language), data.getMaintenance(actual, language)])).flat()

        const disruptions = disruptionList
            .map(it => mapDisruptionLegacy(it, language))
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

        return new ResponseBuilder()
            .setCacheExpiration(60 * 2)
            .setJsonBody(disruptions)
            .build()
    })
}

/**
 * @deprecated
 * @param {import("./models/NsDisruption").NsDisruption | import("./models/NsMaintenance").NsMaintenance} disruption
 * @param {string} language
 */
export function mapDisruptionLegacy(disruption, language) {
    if (disruption.type.startsWith("prio")) {
        /** @type {import("./models/NsDisruption").NsDisruption} */
        // @ts-ignore
        const it = disruption
        return {
            id: it.id,
            type: "warning",
            title: it.titel,
            description: it.melding.beschrijving
        }
    } else if (disruption.type === "werkzaamheid") {
        /** @type {import("./models/NsMaintenance").NsMaintenance} */
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
        /** @type {import("./models/NsDisruption").NsDisruption} */
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
