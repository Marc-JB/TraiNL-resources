import moment from "moment"

/**
 * @typedef {{
 *     id: string
 *     type: "werkzaamheid"
 *     titel: string
 *     verstoring?: {
 *         type: "WERKZAAMHEID"
 *         id: string
 *         extraReistijd: string
 *         reisadviezen: { titel: string, reisadvies: { advies: string[] }[] }[]
 *         geldigheidsLijst: { startDatum: string, eindDatum: string }[]
 *         gevolg: string
 *         impact: number
 *         maatschappij: number
 *         landelijk: boolean
 *         oorzaak: "werkzaamheden"
 *         header: string
 *         periode: string
 *         trajecten: { stations: string[], begintijd: string, eindtijd: string, richting: "HEEN" | "HEEN_EN_TERUG" }[]
 *         prioriteit: number
 *     }
 * }} NsMaintenance
 */

/** @type {NsMaintenance | undefined} */
export const NsMaintenance = undefined
