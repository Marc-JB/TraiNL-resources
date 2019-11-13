/**
 * @param {import("../models/ns-traininfo.js").NsTrainInfo} it
 * @param {(id: string) => Promise<import("../models/station.js").Station>} stationLookUp
 * @param {"en" | "nl"} [language]
 * @returns {Promise<import("../models/traininfo.js").TrainInfo>}
 */
export async function transformNsTrainInfo(it, stationLookUp, language = "en") {
    const isQbuzzDMG = it.vervoerder === "R-net" && it.type === "GTW"
    const isEurostar = it.type.toLowerCase() === "eurostar"

    let operator = it.vervoerder
    if(isEurostar) {
        operator = `Eurostar/NS Internation${language === "en" ? "a" : "aa"}l`
    } else if(it.type.toLowerCase() === "tvg") {
        operator = `Thalys/NS Internation${language === "en" ? "a" : "aa"}l`
    } else if(it.type.toLowerCase() === "ice") {
        operator = `DB/NS Internation${language === "en" ? "a" : "aa"}l`
    } else if (isQbuzzDMG) {
        operator = `R-net ${language === "en" ? "by" : "door"} Qbuzz`
    } else if (it.vervoerder.toLowerCase() === "r-net" && !isQbuzzDMG) {
        operator = `R-net ${language === "en" ? "by" : "door"} NS`
    }

    return {
        journeyId: it.ritnummer,
        stationId: (await stationLookUp(it.station)).id,
        type: it.type,
        operator,
        platform: it.spoor,
        parts: await Promise.all(it.materieeldelen.map(async part => {
            let imageUrl = part.afbeelding
            let type = part.type

            if (isEurostar && !!imageUrl) {
                imageUrl = "https://marc-jb.github.io/OVgo-api/eurostar_e320.png"
                type = "Eurostar e320/Class 374"
            }

            if (isQbuzzDMG && imageUrl.includes("arriva")) {
                imageUrl = `https://marc-jb.github.io/OVgo-api/gtw_e_${imageUrl.includes("6") ? "6" : "8"}_qbuzz${imageUrl.includes("6") ? "_v2" : ""}.png`
            }
            if (isQbuzzDMG && type.includes("Arriva")) {
                type = type.replace("Arriva", "Qbuzz")
            }

            const totalSeatsFirstClass = isQbuzzDMG || !part.zitplaatsen ? 0 : part.zitplaatsen.zitplaatsEersteKlas + part.zitplaatsen.klapstoelEersteKlas
            const totalSeatsSecondClass = !part.zitplaatsen ? 0 : part.zitplaatsen.zitplaatsTweedeKlas + part.zitplaatsen.klapstoelTweedeKlas + (isQbuzzDMG ? part.zitplaatsen.zitplaatsEersteKlas + part.zitplaatsen.klapstoelEersteKlas : 0)

            return {
                id: part.materieelnummer,
                type: type,
                facilities: {
                    toilet: part.faciliteiten.includes("TOILET"),
                    silenceCompartment: part.faciliteiten.includes("STILTE"),
                    powerSockets: part.faciliteiten.includes("STROOM") && !isQbuzzDMG,
                    wifi: part.faciliteiten.includes("WIFI"),
                    wheelchairAccessible: part.faciliteiten.includes("TOEGANKELIJK"),
                    bicycles: part.faciliteiten.includes("FIETS"),
                    bar: part.faciliteiten.includes("BISTRO"),
                    firstClass: totalSeatsFirstClass > 0
                },
                image: imageUrl,
                seats: totalSeatsSecondClass,
                seatsFirstClass: totalSeatsFirstClass,
                destinationStationId: (await stationLookUp(part.eindbestemming)).id
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
