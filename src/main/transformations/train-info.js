import { searchStation } from "../searchStations.js"
import { fixNsTrainInfo } from "./fix-traininfo.js"

/**
 * @param {import("../data-access/ApiCacheManager").ApiCacheManager} data
 * @param {import("../models/NsTrainInfo").NsTrainInfo} trainInfo
 * @param {import("../models/NsDeparture").NsDeparture} [departure]
 * @param {"en" | "nl"} [language]
 * @returns {Promise<import("../models/TrainInfo").TrainInfo>}
 */
export async function transformNsTrainInfo(data, trainInfo, departure = null, language = "en") {
    const it = await fixNsTrainInfo(data, trainInfo, departure, language)

    return {
        journeyId: it.ritnummer,
        stationId: (await searchStation(data, it.station)).id,
        type: it.type,
        operator: it.vervoerder,
        platform: it.spoor,
        parts: await Promise.all(it.materieeldelen.map(async part => {
            const totalSeatsFirstClass = !part.zitplaatsen ? 0 : part.zitplaatsen.zitplaatsEersteKlas + part.zitplaatsen.klapstoelEersteKlas
            const totalSeatsSecondClass = !part.zitplaatsen ? 0 : part.zitplaatsen.zitplaatsTweedeKlas + part.zitplaatsen.klapstoelTweedeKlas

            return {
                id: part.materieelnummer,
                type: part.type,
                facilities: {
                    toilet: part.faciliteiten.includes("TOILET"),
                    silenceCompartment: part.faciliteiten.includes("STILTE"),
                    powerSockets: part.faciliteiten.includes("STROOM"),
                    wifi: part.faciliteiten.includes("WIFI"),
                    wheelchairAccessible: part.faciliteiten.includes("TOEGANKELIJK"),
                    bicycles: part.faciliteiten.includes("FIETS"),
                    bar: part.faciliteiten.includes("BISTRO"),
                    firstClass: totalSeatsFirstClass > 0
                },
                image: part.afbeelding,
                seats: totalSeatsSecondClass,
                seatsFirstClass: totalSeatsFirstClass,
                destinationStationId: part.eindbestemming ? (await searchStation(data, part.eindbestemming)).id : null
            }
        })),
        shortened: it.ingekort,
        actualNumberOfCoaches: it.lengte,
        plannedNumberOfCoaches: it.geplandeLengte,
        length: it.lengteInMeters,
        crowdsForecast: it.drukteVoorspelling.map(forecast => ({
            coach: forecast.coach,
            capacity: forecast.capacity,
            seats: forecast.seats,
            classification: forecast.classification === "UNKNOWN" ? null : forecast.classification
        }))
    }
}
