import { searchStation } from "../searchStations"
import { NsDeparture } from "../models/ns/NsDeparture"
import { DataRepository } from "../data-access/Repositories"

export async function fixNsDeparture(
    data: DataRepository,
    it: Partial<NsDeparture>,
    language: "en" | "nl" = "en"
): Promise<NsDeparture> {
    if (it.product?.operatorName.toLowerCase() === "r-net") {
        it.product.operatorName = it.product.longCategoryName.toLowerCase() === "sprinter" ? `R-net ${language === "en" ? "by" : "door"} NS` : `R-net ${language === "en" ? "by" : "door"} Qbuzz`
    }

    it.routeStations = it.routeStations ?? []

    await Promise.all([
        (async (): Promise<void> => {
            it.direction = it.direction ? (await searchStation(data, it.direction))?.name ?? it.direction : it.direction
        })(),
        (async (): Promise<void> => {
            it.routeStations = await Promise.all(
                it.routeStations?.map(async it => ({
                    uicCode: it.uicCode,
                    mediumName: (await data.getStations()).find(s => s.id === parseInt(it.uicCode))?.name ?? it.mediumName
                })) ?? []
            )
        })()
    ])

    it.actualTrack = it.actualTrack ?? it.plannedTrack ?? "-"
    it.plannedTrack = it.plannedTrack ?? "-"
    it.actualDateTime = it.actualDateTime ?? it.plannedDateTime
    it.messages = it.messages ?? []
    it.cancelled = it.cancelled ?? false

    // @ts-expect-error
    return it
}
