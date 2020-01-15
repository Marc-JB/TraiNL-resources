import moment from "moment"

/**
 * @param {import("@peregrine/webserver").ResponseBuilder} response
 * @param {number} expirationInSeconds
 */
export function expire(response, expirationInSeconds) {
    response.setHeader("Cache-Control", `public, max-age=${expirationInSeconds}, s-maxage=${expirationInSeconds}`)
    response.setHeader("Expires", moment().add(expirationInSeconds, "seconds").utc().format("ddd, D MMM YYYY HH:mm:ss [GMT]"))
}
