import moment from "moment"

/**
 * @typedef {{
 *     id: string
 *     type: "prio_3" | "prio_2" | "prio_1" | "verstoring" | string
 *     titel: string
 *     topic: string
 *     melding?: {
 *         id: string
 *         titel: string
 *         beschrijving: string
 *         type: "prio_3" | "prio_2" | "prio_1" | string
 *         buttonPositie: string
 *         laatstGewijzigd: string
 *         volgendeUpdate: string
 *         bodyItems: any[]
 *         buttons: { titel: string, type: "planner" | "werkzaamheden", voorleesTitel: string }[]
 *     }
 *     verstoring?: {
 *         type: "STORING" | string
 *         id: string
 *         geldigheidsLijst: { startDatum: string, eindDatum: string }[]
 *         verwachting: string
 *         fase: string
 *         faseLabel: string
 *         alternatiefVervoer: string
 *         landelijk: boolean
 *         oorzaak: string
 *         header: string
 *         meldtijd: string
 *         gevolg?: string
 *         baanvakken: { stations: string[] }[]
 *         trajecten: { stations: string[], begintijd: string, eindtijd: string, richting: "HEEN" | "HEEN_EN_TERUG" }[]
 *         versie: string
 *         volgnummer: string
 *         prioriteit: number
 *     }
 * }} NsDisruption
 */

/** @type {NsDisruption | undefined} */
export const NsDisruption = undefined
