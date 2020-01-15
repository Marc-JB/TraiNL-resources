import moment from "moment"

/**
 * @typedef {{
 *     titel: string,
 *     startDate: import("moment").Moment,
 *     endDate: import("moment").Moment,
 *     trajects: {
 *         stations: number[],
 *         startDate: import("moment").Moment,
 *         endDate: import("moment").Moment,
 *         bothDirections: boolean
 *     }[],
 *     travelAdviceShort: string,
 *     travelAdviceDetailed: string,
 *     verstoring?: {
 *         extraReistijd: string
 *         reisadviezen: { titel: string, reisadvies: { advies: string[] }[] }[]
 *         geldigheidsLijst: { startDatum: string, eindDatum: string }[]
 *         gevolg: string
 *         impact: number
 *         maatschappij: number
 *         landelijk: boolean
 *         oorzaak: string
 *         header: string
 *         periode: string
 *         trajecten: { stations: string[], begintijd: string, eindtijd: string, richting: "HEEN" | "HEEN_EN_TERUG" }[]
 *         prioriteit: number
 *     }
 * }} Maintenance
 */

/** @type {Maintenance | undefined} */
export const Maintenance = undefined
