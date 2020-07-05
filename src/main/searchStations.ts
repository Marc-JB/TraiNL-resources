import { ApiCacheManager } from "./data-access/ApiCacheManager"
import { Station } from "./models/Station"

export async function searchStations(
    data: ApiCacheManager,
    q: string,
    onlyExactMatches: boolean = true,
    limit: number = 10
): Promise<Station[]> {
    const stations = await data.getStations()

    const matchFunction = (it: Station): boolean => it.name.toLowerCase().includes(q.toLowerCase()) || it.code.toLowerCase().includes(q.toLowerCase()) || it.alternativeNames.some(it => it.toLowerCase().includes(q.toLowerCase()))

    const exactMatchFunction = (it: Station): boolean => it.name.toLowerCase() === q.toLowerCase() || it.code.toLowerCase() === q.toLowerCase() || it.alternativeNames.map(it => it.toLowerCase()).includes(q.toLowerCase())

    return stations.filter(onlyExactMatches ? exactMatchFunction : matchFunction)
        .sort((a: Station, b: Station) =>
            exactMatchFunction(a) && !exactMatchFunction(b) ? -1 :
                exactMatchFunction(b) && !exactMatchFunction(a) ? 1 :
                    a.name.toLowerCase().startsWith(q.toLowerCase()) && !b.name.toLowerCase().startsWith(q.toLowerCase()) ? -1 :
                        b.name.toLowerCase().startsWith(q.toLowerCase()) && !a.name.toLowerCase().startsWith(q.toLowerCase()) ? 1 : 0
        ).slice(0, limit)
}

export async function searchStation(data: ApiCacheManager, q: string): Promise<Station | null> {
    return (await searchStations(data, q))[0]
}
