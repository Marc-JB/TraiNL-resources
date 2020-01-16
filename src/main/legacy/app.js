import { getDisruptions } from "./disruptions.js"
import { getDeparturesForStation } from "./stations.js"

/**
 * @param {import("@peregrine/webserver").Endpoint} endpoint
 */
export default function(endpoint) {
    endpoint.get("stations/{id}/departures.json", getDeparturesForStation)
    endpoint.get("disruptions.json", getDisruptions)
}
