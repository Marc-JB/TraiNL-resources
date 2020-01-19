export interface NsMaintenance {
    id: string
    type: "werkzaamheid"
    titel: string
    verstoring?: {
        type: "WERKZAAMHEID"
        id: string
        extraReistijd: string
        reisadviezen: {
            titel: string,
            reisadvies: {
                advies: string[]
            }[]
        }[]
        geldigheidsLijst: {
            startDatum: string,
            eindDatum: string
        }[]
        gevolg: string
        impact: number
        maatschappij: number
        landelijk: boolean
        oorzaak: string
        header: string
        periode: string
        trajecten: {
            stations: string[],
            begintijd: string,
            eindtijd: string,
            richting: "HEEN" | "HEEN_EN_TERUG"
        }[]
        prioriteit: number
    }
}
