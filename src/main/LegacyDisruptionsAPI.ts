import { ApiController, HttpGet, Path } from "@peregrine/koa-with-decorators"
import { Context } from "koa"
import moment from "moment"
import { ApiCacheManager } from "./data-access/ApiCacheManager"
import { NsDisruption } from "./models/ns/NsDisruption"
import { NsMaintenance } from "./models/ns/NsMaintenance"

@ApiController("/api/v1")
export class LegacyDisruptionsAPI {
    public constructor(private readonly data: ApiCacheManager) {}

    @HttpGet
    @Path("/disruptions.json")
    public async getDisruptions(ctx: Context): Promise<void> {
        // TODO: cache time of 60 * 2
        const language = "en"

        const actual = ctx.query.actual !== "false"

        const disruptionList: (NsDisruption | NsMaintenance)[] = (await Promise.all([
            this.data.getDisruptions(language),
            this.data.getMaintenance(actual, language)
        ])).flat()

        const disruptions = disruptionList
            .map(it => mapDisruptionLegacy(it, language))
            .filter(it => !!it?.id && !!it?.type && !!it?.title)
            .map(it => ({
                id: it.id,
                type: it.type,
                title: it.title,
                description: it.description ?? "",
                additionalTravelTime: it.additionalTravelTime ?? null,
                cause: it.cause ?? null,
                effect: it.effect ?? null,
                expectations: it.expectations ?? null,
                startDate: it.startDate ?? null,
                endDate: it.endDate ?? null
            }))

        ctx.response.status = 200
        ctx.response.body = disruptions
    }
}

/** @deprecated */
function mapDisruptionLegacy(
    disruption: Partial<NsDisruption> | Partial<NsMaintenance>,
    language: "en" | "nl" | string
): any {
    if (disruption.type?.startsWith("prio")) {
        const it = disruption as Partial<NsDisruption>
        return {
            id: it.id,
            type: "warning",
            title: it.titel,
            description: it.melding?.beschrijving
        }
    } else if (disruption.type === "werkzaamheid") {
        const it = disruption as Partial<NsMaintenance>
        return {
            id: it.id,
            type: "maintenance",
            title: it.titel,
            description: it.verstoring?.gevolg.split(/(geen |, |,|)extra reistijd/u)[0].trim(),
            additionalTravelTime: it.verstoring?.extraReistijd,
            cause: language === "nl" ? "Werkzaamheden" : "Maintenance",
            effect: it.verstoring?.gevolg,
            startDate: moment(it.verstoring?.geldigheidsLijst[0].startDatum),
            endDate: moment(it.verstoring?.geldigheidsLijst[0].eindDatum)
        }
    } else if (disruption.type === "verstoring") {
        const it = disruption as Partial<NsDisruption>
        return {
            id: it.id,
            type: "disruption",
            title: it.titel,
            description: [
                it.verstoring?.oorzaak,
                it.verstoring?.gevolg,
                it.verstoring?.verwachting
            ].filter(it => it !== undefined && it !== "").join(" "),
            cause: it.verstoring?.oorzaak,
            effect: it.verstoring?.gevolg,
            expectations: it.verstoring?.verwachting,
            startDate: moment(it.verstoring?.meldtijd)
        }
    }

    throw new Error("Disruption type unknown")
}
