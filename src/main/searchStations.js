/**
 * @param {import("./data-access/ApiCacheManager").ApiCacheManager} data
 * @param {string} q
 * @param {boolean} [onlyExactMatches]
 * @param {number} [limit]
 * @returns {Promise<import("./models/station").Station[]>}
 */
export async function searchStations(data, q, onlyExactMatches = true, limit = 10) {
    const stations = await data.getStations()

    /** @type {(it: import("./models/station").Station) => boolean} */
    const matchFunction = it => it.name.toLowerCase().includes(q.toLowerCase()) || it.code.toLowerCase().includes(q.toLowerCase()) || it.alternativeNames.some(it => it.toLowerCase().includes(q.toLowerCase()))

    /** @type {(it: import("./models/station").Station) => boolean} */
    const exactMatchFunction = it => it.name === q || it.code === q || it.alternativeNames.includes(q)

    return stations.filter(onlyExactMatches ? exactMatchFunction : matchFunction)
        .sort((a, b) =>
            exactMatchFunction(a) && !exactMatchFunction(b) ? -1 :
                exactMatchFunction(b) && !exactMatchFunction(a) ? 1 :
                    a.name.toLowerCase().startsWith(q.toLowerCase()) && !b.name.toLowerCase().startsWith(q.toLowerCase()) ? -1 :
                        b.name.toLowerCase().startsWith(q.toLowerCase()) && !a.name.toLowerCase().startsWith(q.toLowerCase()) ? 1 : 0
        ).slice(0, limit)
}

/**
 * @param {import("./data-access/ApiCacheManager").ApiCacheManager} data
 * @param {string} q
 * @returns {Promise<import("./models/station").Station>}
 */
export async function searchStation(data, q) {
    return (await searchStations(data, q))[0]
}
