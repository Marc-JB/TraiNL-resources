// eslint-disable-next-line no-unused-vars
import moment from "moment"

/** @template T */
export class Cache {
    /** @type { T | null } */
    #cache = null

    /** @type { Promise<T> | null } */
    #cachePromise = null

    /** @type { moment.Moment | null } */
    #lastRefresh = null

    /** @type { number } */
    #refreshAfter

    /** @type { () => Promise<T> } */
    #refreshFunction

    /**
     * @param {number} refreshAfter
     * @param {() => Promise<T>} refreshFunction
     */
    constructor (refreshAfter, refreshFunction){
        this.#refreshAfter = refreshAfter
        this.#refreshFunction = refreshFunction
    }

    /** @private */
    shouldRefresh() {
        return this.#lastRefresh === null || moment().subtract(this.#refreshAfter, "seconds").isAfter(this.#lastRefresh)
    }

    get() {
        if(this.shouldRefresh()) {
            this.#lastRefresh = moment()
            this.#cachePromise = this.#refreshFunction()
            this.#cachePromise.then(result => {
                this.#cache = result
            }).finally(() => {
                this.#cachePromise = null
            })
            return this.#cachePromise
        } else if (this.#cachePromise != null) {
            return this.#cachePromise
        }

        return this.#cache
    }
}
