import { getCountryInfo } from "../main/transformations/station"
import { suite, test, expect } from "@peregrine/test-with-decorators"

@suite
class CountryInfoTests {
    @test
    public countryInfoShouldThrowErrorWhenCountryCodeIsUnknown(): void {
        expect(getCountryInfo.bind("abcdef")).to.throw(Error)
    }

    @test
    public countryInfoShouldReturnProperObjectWhenCountryCodeIsValid(): void {
        // Arrange
        const countryObject = {
            code: "NL",
            name: "The Netherlands",
            flag: "🇳🇱"
        }

        // Act
        const countryInfo = getCountryInfo(countryObject.code)

        // Assert
        expect(countryInfo).to.be.an.instanceOf(Object)

        expect(countryInfo).to.have.property("code")
        expect(countryInfo.code).to.be.a("string").and.equal("NL")

        expect(countryInfo).to.have.property("name")
        expect(countryInfo.name).to.be.a("string").and.equal("The Netherlands")

        expect(countryInfo).to.have.property("flag")
        expect(countryInfo.flag).to.be.a("string").and.equal("🇳🇱")
    }

    @test
    public countryInfoShouldReturnProperObjectWhenCountryCodeIsValidAndLanguageIsSetProperly(): void {
        // Arrange
        const countryObject = {
            code: "NL",
            name: "Nederland",
            flag: "🇳🇱"
        }

        // Act
        const countryInfo = getCountryInfo(countryObject.code, "nl")

        // Assert
        expect(countryInfo).to.be.an.instanceOf(Object)

        expect(countryInfo).to.have.property("code")
        expect(countryInfo.code).to.be.a("string").and.equal("NL")

        expect(countryInfo).to.have.property("name")
        expect(countryInfo.name).to.be.a("string").and.equal("Nederland")

        expect(countryInfo).to.have.property("flag")
        expect(countryInfo.flag).to.be.a("string").and.equal("🇳🇱")
    }

    @test
    public countryInfoShouldFallbackToEnglishIfLanguageIsInvalidOrNotAvailable(): void {
        // Arrange
        const countryObject = {
            code: "NL",
            name: "The Netherlands",
            flag: "🇳🇱"
        }

        // Act
        const countryInfo = getCountryInfo(countryObject.code, "abcdef")

        // Assert
        expect(countryInfo).to.be.an.instanceOf(Object)

        expect(countryInfo).to.have.property("code")
        expect(countryInfo.code).to.be.a("string").and.equal("NL")

        expect(countryInfo).to.have.property("name")
        expect(countryInfo.name).to.be.a("string").and.equal("The Netherlands")

        expect(countryInfo).to.have.property("flag")
        expect(countryInfo.flag).to.be.a("string").and.equal("🇳🇱")
    }
}
