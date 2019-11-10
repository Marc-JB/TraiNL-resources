import moment from "moment"
import express from "express"

/**
 * @param {express.Response} response
 * @param {number} expirationInSeconds
 */
export function expire(response, expirationInSeconds) {
    response.setHeader("Cache-Control", `public, max-age=${expirationInSeconds}, s-maxage=${expirationInSeconds}`)
    response.setHeader("Expires", moment().add(expirationInSeconds, "seconds").utc().format("ddd, D MMM YYYY HH:mm:ss [GMT]"))
}
