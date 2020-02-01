import { searchStation } from "../searchStations.js"
import { fixNsTrainInfo } from "./fix-traininfo.js"

/**
 * @param {import("../data-access/ApiCacheManager").ApiCacheManager} data
 * @param {import("../models/ns/NsTrainInfo").NsTrainInfo} trainInfo
 * @param {import("../models/ns/NsDeparture").NsDeparture} [departure]
 * @param {"en" | "nl"} [language]
 * @returns {Promise<import("../models/TrainInfo").TrainInfo>}
 */
export async function transformNsTrainInfo(data, trainInfo, departure = null, language = "en") {
    const it = await fixNsTrainInfo(data, trainInfo || {}, departure, language)

    let seatCount = 0
    let seatCountFirstClass = 0

    const parts = await Promise.all(it.materieeldelen.map(async part => {
        const totalSeatsFirstClass = !part.zitplaatsen ? 0 : part.zitplaatsen.zitplaatsEersteKlas + part.zitplaatsen.klapstoelEersteKlas
        seatCountFirstClass += totalSeatsFirstClass
        const totalSeatsSecondClass = !part.zitplaatsen ? 0 : part.zitplaatsen.zitplaatsTweedeKlas + part.zitplaatsen.klapstoelTweedeKlas
        seatCount += totalSeatsSecondClass

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
            destination: part.eindbestemming ? await searchStation(data, part.eindbestemming) : null
        }
    }))

    return {
        id: it.ritnummer,
        station: await searchStation(data, it.station),
        type: it.type,
        operator: it.vervoerder,
        platform: it.spoor,
        parts: parts,
        shortened: it.ingekort,
        actualNumberOfCoaches: it.lengte,
        plannedNumberOfCoaches: it.geplandeLengte,
        length: it.lengteInMeters,
        crowdsForecast: it.drukteVoorspelling.map(forecast => ({
            coach: forecast.coach,
            capacity: forecast.capacity,
            seats: forecast.seats,
            classification: forecast.classification === "UNKNOWN" ? null : forecast.classification
        })),
        facilities: {
            toilet: parts.some(it => it.facilities.toilet),
            silenceCompartment: parts.some(it => it.facilities.silenceCompartment),
            powerSockets: parts.some(it => it.facilities.powerSockets),
            wifi: parts.some(it => it.facilities.wifi),
            wheelchairAccessible: parts.some(it => it.facilities.wheelchairAccessible),
            bicycles: parts.some(it => it.facilities.bicycles),
            bar: parts.some(it => it.facilities.bar),
            firstClass: parts.some(it => it.facilities.firstClass)
        },
        seats: seatCount,
        seatsFirstClass: seatCountFirstClass
    }
}
