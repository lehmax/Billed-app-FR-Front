import { localStorageMock } from "../__mocks__/localStorage";
import Router from "../app/Router";
import { ROUTES_PATH } from "../constants/routes";
import { isPicture } from "../containers/NewBill";

jest.mock("../app/store", () => mockStore);

/**
 * @jest-environment jsdom
 */

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeAll(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      Router();

      window.onNavigate(ROUTES_PATH.NewBill);
    });

    test("Then I should see the form", async () => {});

    describe("When I fill the form correctly", () => {
      test("Then I should be able to submit the form", async () => {});
    });

    describe("when I upload a receipt in an unauthorized format", () => {
      test("Then I should see an error message", async () => {});
    });
  });
});

// Unit test isPicture function
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
