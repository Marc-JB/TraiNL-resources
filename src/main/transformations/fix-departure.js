import { searchStation } from "../searchStations.js"

/**
 * @throws {Error}
 * @param {import("../data-access/ApiCacheManager").ApiCacheManager} data
 * @param {import("../models/ns/NsDeparture").NsDeparture} it
 * @param {"en" | "nl"} [language]
 * @returns {Promise<import("../models/ns/NsDeparture").NsDeparture>}
 */
export async function fixNsDeparture(data, it, language = "en") {
    if (it.product.operatorName.toLowerCase() === "r-net") {
        it.product.operatorName = it.product.longCategoryName.toLowerCase() === "sprinter" ? `R-net ${language === "en" ? "by" : "door"} NS` : `R-net ${language === "en" ? "by" : "door"} Qbuzz`
    }

    it.routeStations = it.routeStations ?? []

    await Promise.all([
        (async () => {
            it.direction = it.direction ? (await searchStation(data, it.direction))?.name ?? it.direction : it.direction
        })(),
        (async () => {
            it.routeStations = await Promise.all(
                it.routeStations.map(async it => ({
                    uicCode: it.uicCode,
                    mediumName: (await data.getStations()).find(s => s.id === parseInt(it.uicCode))?.name ?? it.mediumName
                }))
            )
        })()
    ])

    it.actualTrack = it.actualTrack ?? it.plannedTrack ?? "-"
    it.plannedTrack = it.plannedTrack ?? "-"
    it.actualDateTime = it.actualDateTime ?? it.plannedDateTime
    it.messages = it.messages ?? []
    it.cancelled = it.cancelled ?? false

    return it
}
