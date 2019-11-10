import { getCountryInfo } from "../main/legacy/stationsListBuilder.js"
import { describe, it } from "mocha"
import chai from "chai"

chai.should()

describe("Country Info tests", () => {
    it("Country Info should throw error when country code is unknown", () => {
        getCountryInfo.bind("abcdef").should.throw(Error)
    })

    it("Country Info should return proper object when country code is valid", () => {
        const countryInfoNL = getCountryInfo("NL")

        countryInfoNL.should.be.an.instanceOf(Object)

        countryInfoNL.should.have.property("code")
        countryInfoNL.code.should.be.a("string").and.equal("NL")

        countryInfoNL.should.have.property("name")
        countryInfoNL.name.should.be.a("string").and.equal("The Netherlands")

        countryInfoNL.should.have.property("flag")
        countryInfoNL.flag.should.be.a("string").and.equal("🇳🇱")
    })

    it("Country Info should return proper object when country code is valid and language is set properly", () => {
        const countryInfoNL = getCountryInfo("NL", "nl")

        countryInfoNL.should.be.an.instanceOf(Object)

        countryInfoNL.should.have.property("code")
        countryInfoNL.code.should.be.a("string").and.equal("NL")

        countryInfoNL.should.have.property("name")
        countryInfoNL.name.should.be.a("string").and.equal("Nederland")

        countryInfoNL.should.have.property("flag")
        countryInfoNL.flag.should.be.a("string").and.equal("🇳🇱")
    })

    it("Country Info should fallback properly to english if language is invalid or not available.", () => {
        const countryInfoNL = getCountryInfo("NL", "abcdef")

        countryInfoNL.should.be.an.instanceOf(Object)

        countryInfoNL.should.have.property("code")
        countryInfoNL.code.should.be.a("string").and.equal("NL")

        countryInfoNL.should.have.property("name")
        countryInfoNL.name.should.be.a("string").and.equal("The Netherlands")

        countryInfoNL.should.have.property("flag")
        countryInfoNL.flag.should.be.a("string").and.equal("🇳🇱")
    })
})
