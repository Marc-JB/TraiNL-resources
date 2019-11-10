// eslint-disable-next-line no-unused-vars
import moment from "moment"

/**
 * @template T
 */
export class Cache {
    /**
     * @param {number} refreshAfter
     * @param {() => Promise<T>} refreshFunction
     */
    constructor (refreshAfter, refreshFunction){
        /** @type { T | null } */
        this.cache = null

        /** @type {Promise<T> | null} */
        this.cachePromise = null

        /** @type { moment.Moment | null } */
        this.lastRefresh = null
        this.refreshAfter = refreshAfter

        this.refreshFunction = refreshFunction
    }

    shouldRefresh() {
        return this.lastRefresh === null || moment().subtract(this.refreshAfter, "seconds").isAfter(this.lastRefresh)
    }

    get() {
        if(this.shouldRefresh()) {
            this.lastRefresh = moment()
            this.cachePromise = this.refreshFunction()
            this.cachePromise.then(result => {
                this.cache = result
            }).finally(() => {
                this.cachePromise = null
            })
            return this.cachePromise
        } else if (this.cachePromise != null) {
            return this.cachePromise
        }

        return this.cache
    }
}
