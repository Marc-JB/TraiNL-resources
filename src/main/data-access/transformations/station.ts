import { NsStation } from "../../models/ns/NsStation"
import { Station, CountryInfo } from "../../models/Station"

export function transformNsStation(it: NsStation): Station {
    return {
        id: parseInt(it.UICCode),
        code: it.code,
        name: it.namen.lang,
        country: getCountryInfo(it.land, "en"),
        facilities: {
            travelAssistance: it.heeftReisassistentie,
            departureTimesBoard: it.heeftVertrektijden
        },
        coordinates: {
            latitude: Math.round(it.lat * 10000) / 10000,
            longitude: Math.round(it.lng * 10000) / 10000
        },
        alternativeNames: buildSynonymList(it.synoniemen, it.namen.lang, it.namen.middel),
        platforms: it.sporen.map(it => it.spoorNummer)
    }
}

export function getCountryInfo(code: string, language: "en" | "nl" | string = "en"): CountryInfo {
    const from = (code: string, flag: string, name: string): CountryInfo => ({ code, flag, name })
    const isDutch = language === "nl"

    switch (code) {
        case "NL": return from("NL", "🇳🇱", isDutch ? "Nederland" : "The Netherlands")
        case "D": return from("DE", "🇩🇪", isDutch ? "Duitsland" : "Germany")
        case "GB": return from("UK", "🇬🇧", isDutch ? "Verenigd Koninkrijk" : "United Kingdom")
        case "CH": return from("CH", "🇨🇭", isDutch ? "Zwitserland" : "Switzerland")
        case "A": return from("AT", "🇦🇹", isDutch ? "Oostenrijk" : "Austria")
        case "B": return from("BE", "🇧🇪", isDutch ? "België" : "Belgium")
        case "F": return from("FR", "🇫🇷", isDutch ? "Frankrijk" : "France")
        default: throw new Error(`Unexpected switch statement falltrough (with country code: "${code}")`)
    }
}

function buildSynonymList(originalSynonyms: string[], longName: string, mediumName: string): string[] {
    originalSynonyms.push(longName)

    // Add mediumName as synonym if it has the city name removed (like Amsterdam RAI (full) -> RAI (medium))
    const abc = longName.split(" ", 2)[1]
    if (abc && mediumName.startsWith(abc))
        originalSynonyms.push(mediumName)

    originalSynonyms.forEach(it => {
        // Add CS instead of Centraal as synonym
        originalSynonyms.push(it.replace(" Centraal", " CS"))
        // Add synonyms for central stations without -Centraal, -Centrum or -Hbf suffixes
        originalSynonyms.push(it.replace(" Centraal", "").replace(" Centrum", "").replace(" Hbf", ""))
    })

    const specialCharacters: { [key: string]: string } = { "ü": "u", "ö": "o", "ä": "a", "â": "a" }

    return [...new Set(originalSynonyms)] // Remove duplicates
        // Remove duplicates that have special characters simplified (like München -> Munchen)
        .map(it => {
            let modified = it
            Object.keys(specialCharacters).forEach(key => modified = modified.replace(key, specialCharacters[key]))
            return {
                original: it,
                modified,
                altered: Object.keys(specialCharacters).some(key => it.includes(key))
            }
        })
        .filter((it, index, array) => it.altered || !array.some((item, pos) => pos !== index && item.modified === it.modified && item.altered))
        // Revert to string array of names
        .map(it => it.original)
        // Remove the longName and duplicates ending with ('s) or ('t)
        .filter(it => it !== longName && !it.endsWith(" (\u0027s)") && !it.endsWith(" (\u0027t)"))
}
