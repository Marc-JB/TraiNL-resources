export interface NsStation {
    UICCode: string
    code: string
    namen: {
        lang: string,
        middel: string
    }
    land: string
    heeftReisassistentie: boolean
    heeftVertrektijden: boolean
    lat: number
    lng: number
    synoniemen: string[]
    sporen: {
        spoorNummer: string
    }[]
}
