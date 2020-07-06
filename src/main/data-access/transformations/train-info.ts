import { searchStation } from "../../searchStations"
import { fixNsTrainInfo } from "./fix-traininfo"
import { NsTrainInfo } from "../../models/ns/NsTrainInfo"
import { NsDeparture } from "../../models/ns/NsDeparture"
import { TrainInfo, TrainPart } from "../../models/TrainInfo"
import { DataRepository } from "../Repositories"

export async function transformNsTrainInfo(
    data: DataRepository,
    trainInfo: NsTrainInfo | null,
    departure: NsDeparture | null = null,
    language: "en" | "nl" = "en"
): Promise<TrainInfo> {
    const it = await fixNsTrainInfo(data, trainInfo ?? {}, departure, language)

    let seatCount = 0
    let seatCountFirstClass = 0

    const parts = await Promise.all(it.materieeldelen.map(async part => {
        const totalSeatsFirstClass = (part.zitplaatsen?.zitplaatsEersteKlas ?? 0) + (part.zitplaatsen?.klapstoelEersteKlas ?? 0)
        seatCountFirstClass += totalSeatsFirstClass
        const totalSeatsSecondClass = (part.zitplaatsen?.zitplaatsTweedeKlas ?? 0) + (part.zitplaatsen?.klapstoelTweedeKlas ?? 0)
        seatCount += totalSeatsSecondClass

        return {
            id: part.materieelnummer,
            type: part.type,
            facilities: {
                toilet: part.faciliteiten.includes("TOILET"),
                silenceCompartment: part.faciliteiten.includes("STILTE"),
                powerSockets: part.faciliteiten.includes("STROOM"),
                wifi: part.faciliteiten.includes("WIFI"),
                wheelchairAccessible: part.faciliteiten.includes("TOEGANKELIJK"),
                bicycles: part.faciliteiten.includes("FIETS"),
                bar: part.faciliteiten.includes("BISTRO"),
                firstClass: totalSeatsFirstClass > 0
            },
            image: part.afbeelding,
            seats: totalSeatsSecondClass,
            seatsFirstClass: totalSeatsFirstClass,
            destination: part.eindbestemming ? await searchStation(data, part.eindbestemming) : null
        } as TrainPart
    }))

    return {
        id: it.ritnummer,
        station: it.station ? await searchStation(data, it.station) : null,
        type: it.type,
        operator: it.vervoerder,
        platform: it.spoor,
        parts: parts,
        shortened: it.ingekort,
        actualNumberOfCoaches: it.lengte,
        plannedNumberOfCoaches: it.geplandeLengte ?? it.lengte,
        length: it.lengteInMeters,
        crowdsForecast: it.drukteVoorspelling?.map(forecast => ({
            coach: forecast.coach,
            capacity: forecast.capacity,
            seats: forecast.seats,
            classification: forecast.classification === "UNKNOWN" ? null : forecast.classification
        })) ?? [],
        facilities: {
            toilet: parts.some(it => it.facilities.toilet),
            silenceCompartment: parts.some(it => it.facilities.silenceCompartment),
            powerSockets: parts.some(it => it.facilities.powerSockets),
            wifi: parts.some(it => it.facilities.wifi),
            wheelchairAccessible: parts.some(it => it.facilities.wheelchairAccessible),
            bicycles: parts.some(it => it.facilities.bicycles),
            bar: parts.some(it => it.facilities.bar),
            firstClass: parts.some(it => it.facilities.firstClass)
        },
        seats: seatCount,
        seatsFirstClass: seatCountFirstClass
    }
}
