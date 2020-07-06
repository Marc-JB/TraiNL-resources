import moment from "moment"
import { fixNsDeparture } from "./fix-departure"
import { searchStation } from "../../searchStations"
import { transformNsTrainInfo } from "./train-info"
import { Departure } from "../../models/Departure"
import { NsDeparture } from "../../models/ns/NsDeparture"
import { DataRepository } from "../Repositories"

export async function transformNsDeparture(
    data: DataRepository,
    departure: NsDeparture,
    language: "en" | "nl" = "en"
): Promise<Departure> {
    const it = await fixNsDeparture(data, departure, language)

    const plannedDepartureTime = moment(it.plannedDateTime).toDate()
    const actualDepartureTime = moment(it.actualDateTime).toDate()

    let departureStatus: "UNDERWAY" | "ARRIVED" | "DEPARTED"
    switch (it.departureStatus) {
        case "INCOMING": {
            departureStatus = "UNDERWAY"
            break
        }
        case "ON_STATION": {
            departureStatus = "ARRIVED"
            break
        }
        case "DEPARTED": {
            departureStatus = "DEPARTED"
            break
        }
        default: throw new Error("Unexpected switch statement falltrough")
    }

    return {
        id: parseInt(it.product.number),
        direction: (await searchStation(data, it.direction))!,
        actualDepartureTime: actualDepartureTime,
        plannedDepartureTime: plannedDepartureTime,
        delayInSeconds: Math.round((actualDepartureTime.getTime() - plannedDepartureTime.getTime()) / 1000),
        actualPlatform: it.actualTrack,
        plannedPlatform: it.plannedTrack,
        platformChanged: it.actualTrack !== it.plannedTrack,
        operator: it.product.operatorName,
        category: it.product.longCategoryName,
        cancelled: it.cancelled || false,
        majorStops: await Promise.all(it.routeStations.map(async stop => (await data.getStations()).find(it => it.id === parseInt(stop.uicCode))!)),
        warnings: it.messages?.filter(it => it.style === "WARNING").map(it => it.message) ?? [],
        info: it.messages?.filter(it => it.style === "INFO").map(it => it.message) ?? [],
        departureStatus,
        trainComposition: await transformNsTrainInfo(data, await data.getJourney(parseInt(it.product.number)), it, language)
    }
}
