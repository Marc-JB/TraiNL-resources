import dotenv from "dotenv"

if(process.env.NS_API_KEY === undefined)
    dotenv.config()

export default {
    NS_API_KEY: process.env.NS_API_KEY,
    PORT: process.env.PORT,
    KEY: process.env.KEY,
    CERT: process.env.CERT
}
