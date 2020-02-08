import dotenv from "dotenv"

if(process.env.NS_API_KEY === undefined)
    dotenv.config()

export default {
    NS_API_KEY: process.env.NS_API_KEY,
    DEV_MODE: process.env.DEV_MODE === "true",
    PORT: process.env.PORT
}
