import { searchStation } from "../searchStations.js"

/** @type {import("../models/ns/NsTrainInfo").NsTrainFacility[]} */
const qbuzzFacilities = ["FIETS"]

const qbuzz2 = {
    type: "GTW-E 2/6 Qbuzz",
    faciliteiten: qbuzzFacilities,
    afbeelding: "https://vt.ns-mlab.nl/v1/images/gtw_qbuzz_26.png",
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
    type: "GTW-E 2/8 Qbuzz",
    faciliteiten: qbuzzFacilities,
    afbeelding: "https://vt.ns-mlab.nl/v1/images/gtw_qbuzz_28.png",
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

const ovGoImages = [
    "eurostar", "ice", "thalys",
    "nsr_flirt_3", "nsr_flirt_4", "sgmm_2", "sgmm_3", "sng_3", "sng_4",
    "gtw_qbuzz_26", "gtw_qbuzz_28",
    "virm_4", "virm_6", "virmm1_4", "virmm1_6"
]

/**
 * @throws {Error}
 * @param {import("../data-access/ApiCacheManager").ApiCacheManager} data
 * @param {Partial<import("../models/ns/NsTrainInfo").NsTrainInfo>} it
 * @param {import("../models/ns/NsDeparture").NsDeparture} [departure]
 * @param {"en" | "nl"} [language]
 * @returns {Promise<import("../models/ns/NsTrainInfo").NsTrainInfo>}
 */
export async function fixNsTrainInfo(data, it, departure = null, language = "en") {
    it.materieeldelen = it.materieeldelen ?? []
    it.drukteVoorspelling = it.drukteVoorspelling ?? []
    it.ingekort = it.ingekort ?? false

    const type = it.type?.toLowerCase() ?? ""
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

    it.station = it.station ? (await searchStation(data, it.station))?.name ?? it.station : it.station

    if(isQbuzzDMG) it.materieeldelen = it.materieeldelen.map(it => it.type.includes("8") ? qbuzz3 : qbuzz2)

    it.materieeldelen = await Promise.all(it.materieeldelen.map(async part => {
        part.faciliteiten = part.faciliteiten ?? []
        part.afbeelding = part.afbeelding || null

        if (isEurostar && part.afbeelding !== null) {
            part.afbeelding = "https://vt.ns-mlab.nl/v1/images/eurostar.png"
            part.type = "Eurostar e320/Class 374"
        }

        if(part.afbeelding !== null) {
            const images = part.afbeelding.split("/")
            const image = images[images.length - 1].replace(".png", "")
            if(ovGoImages.includes(image)) {
                part.afbeelding = `https://marc-jb.github.io/OVgo-api/${image}.png`
            }
        }

        if(part.eindbestemming)
            part.eindbestemming = (await searchStation(data, part.eindbestemming)).name
        else if(departure?.direction)
            part.eindbestemming = departure.direction

        if(part.type?.startsWith("Flirt") && it.vervoerder === "NS" && !part.faciliteiten.includes("TOEGANKELIJK"))
            part.faciliteiten.push("TOEGANKELIJK")

        if(part.type?.startsWith("SGM") && part.faciliteiten.includes("TOILET"))
            part.faciliteiten = part.faciliteiten.filter(it => it !== "TOILET")

        return part
    }))

    it.geplandeLengte = it.geplandeLengte ?? it.lengte
    it.bron = it.bron ?? "NS"

    // @ts-ignore
    return it
}
