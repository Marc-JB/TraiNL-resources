/**
 * @param {import("../models/ns-traininfo.js").NsTrainInfo} it
 * @param {(id: string) => Promise<import("../models/station.js").Station>} stationLookUp
 * @param {"en" | "nl"} [language]
 * @returns {Promise<import("../models/traininfo.js").TrainInfo>}
 */
export async function transformNsTrainInfo(it, stationLookUp, language = "en") {
    const type = it.type ? it.type.toLowerCase() : ""
    const isQbuzzDMG = it.vervoerder === "R-net" && type !== "flirt"
    const isEurostar = type === "eurostar"

    if(it.materieeldelen && it.materieeldelen.some(it => it.type === "Flirt 2 TAG")) {
        it.vervoerder = `R-net ${language === "en" ? "by" : "door"} NS`
    } else if (it.vervoerder === "R-net" && type !== "flirt") {
        it.vervoerder = `R-net ${language === "en" ? "by" : "door"} Qbuzz`
    }

    if(isEurostar) {
        it.vervoerder = `Eurostar/NS Internation${language === "en" ? "a" : "aa"}l`
    } else if(type === "tvg") {
        it.vervoerder = `Thalys/NS Internation${language === "en" ? "a" : "aa"}l`
    } else if(type === "ice") {
        it.vervoerder = `DB/NS Internation${language === "en" ? "a" : "aa"}l`
    }

    return {
        journeyId: it.ritnummer,
        stationId: (await stationLookUp(it.station)).id,
        type: it.type,
        operator: it.vervoerder,
        platform: it.spoor,
        parts: await Promise.all(it.materieeldelen.map(async part => {
            let imageUrl = part.afbeelding
            let type = part.type

            if (isEurostar && !!imageUrl) {
                imageUrl = "https://marc-jb.github.io/OVgo-api/eurostar_e320.png"
                type = "Eurostar e320/Class 374"
            }

            if (isQbuzzDMG) {
                type = "Qbuzz GTW"
                if(!imageUrl)
                    imageUrl = "https://marc-jb.github.io/OVgo-api/gtw_qbuzz_26.png"
            }

            const totalSeatsFirstClass = !part.zitplaatsen ? 0 : part.zitplaatsen.zitplaatsEersteKlas + part.zitplaatsen.klapstoelEersteKlas
            const totalSeatsSecondClass = !part.zitplaatsen ? 0 : part.zitplaatsen.zitplaatsTweedeKlas + part.zitplaatsen.klapstoelTweedeKlas

            return {
                id: part.materieelnummer,
                type: type,
                facilities: {
                    toilet: part.faciliteiten.includes("TOILET"),
                    silenceCompartment: part.faciliteiten.includes("STILTE"),
                    powerSockets: part.faciliteiten.includes("STROOM") && !isQbuzzDMG,
                    wifi: part.faciliteiten.includes("WIFI"),
                    wheelchairAccessible: part.faciliteiten.includes("TOEGANKELIJK"),
                    bicycles: part.faciliteiten.includes("FIETS") || isQbuzzDMG,
                    bar: part.faciliteiten.includes("BISTRO"),
                    firstClass: totalSeatsFirstClass > 0
                },
                image: imageUrl,
                seats: totalSeatsSecondClass,
                seatsFirstClass: totalSeatsFirstClass,
                destinationStationId: part.eindbestemming ? (await stationLookUp(part.eindbestemming)).id : null
            }
        })),
        shortened: it.ingekort,
        actualNumberOfCoaches: it.lengte,
        plannedNumberOfCoaches: it.geplandeLengte || it.lengte,
        length: it.lengteInMeters,
        crowdsForecast: it.drukteVoorspelling ? it.drukteVoorspelling.map(forecast => ({
            coach: forecast.coach,
            capacity: forecast.capacity,
            seats: forecast.seats,
            classification: forecast.classification === "UNKNOWN" ? null : forecast.classification
        })) : []
    }
}
