import moment from "moment"

export class Cache<T> {
    private cache: T | null = null

    private cachePromise: Promise<T> | null = null

    private lastRefresh: moment.Moment | null = null

    public constructor (
        private readonly refreshAfter: number,
        private readonly refreshFunction: () => Promise<T>
    ) {}

    private get shouldRefresh(): boolean {
        return this.lastRefresh === null || moment().subtract(this.refreshAfter, "seconds").isAfter(this.lastRefresh)
    }

    public get value(): Promise<T> {
        if (this.shouldRefresh) {
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

        return Promise.resolve(this.cache!)
    }
}
