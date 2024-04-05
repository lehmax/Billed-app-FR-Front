import { isPicture } from "../containers/NewBill";

/**
 * @jest-environment jsdom
 */

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {});
  });
});

describe("Given a function to know if media type match to authorised format (only: jpg, png)", () => {
  describe("When I test a jpg format", () => {
    it("Should return true", () => {
      expect(isPicture("image/jpg")).toBeTruthy();
      expect(isPicture("image/jpeg")).toBeTruthy();
    });
  });

  describe("When I test a png format", () => {
    it("Should return true", () => {
      expect(isPicture("image/png")).toBeTruthy();
    });
  });

  describe("When I test a wrong format for picture ", () => {
    it("Should return false", () => {
      expect(isPicture("document/pdf")).toBeFalsy();
    });
  });
});
