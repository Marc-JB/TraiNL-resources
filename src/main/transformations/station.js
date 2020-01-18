/**
 * @param {import("../models/NsStation").NsStation} it
 * @returns {import("../models/Station").Station}
 */
export function transformNsStation(it) {
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

/**
 * @param {string} code
 * @param {string} language
 * @returns { import("../models/Station").CountryInfo }
 */
export function getCountryInfo(code, language = "en") {
    switch (code) {
        case "NL": return {
            flag: "🇳🇱",
            name: language === "nl" ? "Nederland" : "The Netherlands",
            code: "NL"
        }
        case "D": return {
            flag: "🇩🇪",
            name: language === "nl" ? "Duitsland" : "Germany",
            code: "DE"
        }
        case "GB": return {
            flag: "🇬🇧",
            name: language === "nl" ? "Verenigd Koninkrijk" : "United Kingdom",
            code: "UK"
        }
        case "CH": return {
            flag: "🇨🇭",
            name: language === "nl" ? "Zwitserland" : "Switzerland",
            code: "CH"
        }
        case "A": return {
            flag: "🇦🇹",
            name: language === "nl" ? "Oostenrijk" : "Austria",
            code: "AT"
        }
        case "B": return {
            flag: "🇧🇪",
            name: language === "nl" ? "België" : "Belgium",
            code: "BE"
        }
        case "F": return {
            flag: "🇫🇷",
            name: language === "nl" ? "Frankrijk" : "France",
            code: "FR"
        }
        default: throw new Error(`Unexpected switch statement falltrough (with country code: "${code}")`)
    }
}

/**
 * @param {string[]} originalSynonyms
 * @param {string} longName
 * @param {string} mediumName
 * @returns {string[]}
 */
function buildSynonymList(originalSynonyms, longName, mediumName) {
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

    const specialCharacters = { "ü": "u", "ö": "o", "ä": "a", "â": "a" }

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
