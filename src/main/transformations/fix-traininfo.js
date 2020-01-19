import { searchStation } from "../searchStations.js"

/** @type {import("../models/ns/NsTrainInfo").NsTrainFacility[]} */
const qbuzzFacilities = ["FIETS"]

const qbuzz2 = {
    type: "GTW-EMU 2/6",
    faciliteiten: qbuzzFacilities,
    afbeelding: "https://marc-jb.github.io/OVgo-api/gtw_qbuzz_26.png",
    zitplaatsen: {
        staanplaatsEersteKlas: 0,
        staanplaatsTweedeKlas: 0,
        zitplaatsEersteKlas: 0,
        zitplaatsTweedeKlas: 92,
        klapstoelEersteKlas: 0,
        klapstoelTweedeKlas: 21
    },
    bakken: []
}

const qbuzz3 = {
    type: "GTW-EMU 2/8",
    faciliteiten: qbuzzFacilities,
    afbeelding: "https://marc-jb.github.io/OVgo-api/gtw_qbuzz_28.png",
    zitplaatsen: {
        staanplaatsEersteKlas: 0,
        staanplaatsTweedeKlas: 0,
        zitplaatsEersteKlas: 0,
        zitplaatsTweedeKlas: 148,
        klapstoelEersteKlas: 0,
        klapstoelTweedeKlas: 24
    },
    bakken: []
}

/**
 * @throws {Error}
 * @param {import("../data-access/ApiCacheManager").ApiCacheManager} data
 * @param {import("../models/ns/NsTrainInfo").NsTrainInfo} it
 * @param {import("../models/ns/NsDeparture").NsDeparture} [departure]
 * @param {"en" | "nl"} [language]
 * @returns {Promise<import("../models/ns/NsTrainInfo").NsTrainInfo>}
 */
export async function fixNsTrainInfo(data, it, departure = null, language = "en") {
    it.materieeldelen = it.materieeldelen || []
    it.drukteVoorspelling = it.drukteVoorspelling || []
    it.ingekort = it.ingekort || false

    const type = it.type ? it.type.toLowerCase() : ""
    const isQbuzzDMG = it.vervoerder === "R-net" && !it.materieeldelen.some(it => it.type === "Flirt 2 TAG")
    const isEurostar = type === "eurostar"

    if (it.vervoerder === "R-net") {
        it.vervoerder = `R-net ${language === "en" ? "by" : "door"} ${isQbuzzDMG ? "Qbuzz" : "NS"}`
    } else if(isEurostar) {
        it.vervoerder = `Eurostar/NS Internation${language === "en" ? "a" : "aa"}l`
    } else if(type === "tvg") {
        it.vervoerder = `Thalys/NS Internation${language === "en" ? "a" : "aa"}l`
    } else if(type === "ice") {
        it.vervoerder = `DB/NS Internation${language === "en" ? "a" : "aa"}l`
    }

    it.station = (await searchStation(data, it.station)).name

    if(isQbuzzDMG) {
        if (it.lengteInMeters < 49) {
            it.lengte = 2
            it.materieeldelen = [qbuzz2]
        } else if(it.lengteInMeters < 69) {
            it.lengte = 3
            it.materieeldelen = [qbuzz3]
        } else if(it.lengteInMeters < 90) {
            it.lengte = 4
            it.materieeldelen = [qbuzz2, qbuzz2]
        } else if(it.lengteInMeters < 105) {
            it.lengte = 5
            it.materieeldelen = [qbuzz3, qbuzz2]
        } else {
            it.lengte = 6
            it.materieeldelen = [qbuzz3, qbuzz3]
        }
    }

    it.materieeldelen = await Promise.all(it.materieeldelen.map(async part => {
        part.faciliteiten = part.faciliteiten || []

        if (isEurostar && !!part.afbeelding) {
            part.afbeelding = "https://marc-jb.github.io/OVgo-api/eurostar_e320.png"
            part.type = "Eurostar e320/Class 374"
        }

        if(part.eindbestemming)
            part.eindbestemming = (await searchStation(data, part.eindbestemming)).name
        else if(departure && departure.direction)
            part.eindbestemming = departure.direction

        return part
    }))

    it.geplandeLengte = it.geplandeLengte || it.lengte

    return it
}
