import { config } from "dotenv"
import express from "express"
import { getDisruptions } from "./disruptions.js"
import { getDeparturesForStation, getStations } from "./stations.js"

if(process.env.NS_API_KEY === undefined)
    config()

const server = express()
server.get("/api/v1/stations/:id/departures.json", getDeparturesForStation)
server.get("/api/v1/stations.json", getStations)
server.get("/api/v1/disruptions.json", getDisruptions)
server.listen(process.env.PORT || "8080")
