import env from "./env.js"
import express from "express"
import { getDisruptions } from "./disruptions.js"
import { getDeparturesForStation, getStations } from "./stations.js"

const server = express()
server.get("/api/v1/stations/:id/departures.json", getDeparturesForStation)
server.get("/api/v1/stations.json", getStations)
server.get("/api/v1/disruptions.json", getDisruptions)
server.listen(env.PORT || "8080")
