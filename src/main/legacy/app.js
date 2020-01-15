import { getDisruptions } from "./disruptions.js"
import { getDeparturesForStation, getStations } from "./stations.js"

/**
 * @param {import("express").Express} server
 */
export default function(server) {
    server.get("/api/v1/stations/:id/departures.json", getDeparturesForStation)
    server.get("/api/v1/stations.json", getStations)
    server.get("/api/v1/disruptions.json", getDisruptions)
}
