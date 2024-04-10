/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage";
import mockStore from "../__mocks__/store.js";
import Router from "../app/Router";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import NewBill, { isPicture } from "../containers/NewBill";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
      })
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    Router();
  });

  describe("When I am on NewBill Page", () => {
    const update = jest.spyOn(mockStore.bills(), "update");
    const create = jest.spyOn(mockStore.bills(), "create");

    test("Then I should see the form", async () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      expect(
        await screen.findByText("Envoyer une note de frais")
      ).toBeVisible();
    });

    describe("When I upload a receipt in an unauthorized format", () => {
      test("Then I should see an error message", async () => {
        const inputFile = screen.getByTestId("file");

        const fileDocument = new File(["fail"], "fail.pdf", {
          type: "document/pdf",
        });

        await userEvent.upload(inputFile, fileDocument);

        expect(inputFile.files.item(0)).toEqual(fileDocument);
        expect(
          await screen.findByText("Le format du fichier n'est pas valide")
        ).toBeVisible();
        expect(create).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
      });
    });

    describe("When I fill the form correctly", () => {
      test("Then I should be able to submit the form", async () => {
        const newBill = new NewBill({
          document,
          onNavigate: (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          },
          store: mockStore,
          localStorage: window.localStorage,
        });

        const expenseType = screen.getByTestId("expense-type");
        const expenseName = screen.getByTestId("expense-name");
        const datePicker = screen.getByTestId("datepicker");
        const amount = screen.getByTestId("amount");
        const vat = screen.getByTestId("vat");
        const commentary = screen.getByTestId("commentary");
        const inputFile = screen.getByTestId("file");

        const fileImage = new File(["test"], "test.jpg", {
          type: "image/jpg",
        });

        userEvent.selectOptions(expenseType, "Transports");
        userEvent.type(expenseName, "Paris - Londres");
        fireEvent.change(datePicker, { target: { value: "2024-01-04" } });
        userEvent.type(amount, "100");
        userEvent.type(vat, "20");
        userEvent.type(commentary, "Voyage d'affaire");
        await userEvent.upload(inputFile, fileImage);

        // create Bill
        expect(inputFile.files.item(0)).toEqual(fileImage);
        expect(create).toHaveBeenCalled();
        expect(newBill.fileUrl).toEqual(
          "https://localhost:3456/images/test.jpg"
        );
        expect(newBill.billId).toEqual("1234");

        await userEvent.click(screen.getByText("Envoyer"));

        // update Bill
        expect(update).toHaveBeenCalled();
        expect(await screen.findByText("Mes notes de frais")).toBeVisible(); // await submit event
      });
    });
  });
});

// Unit test isPicture function
describe("Given a function to know if media type match to authorised format (only: jpg, png)", () => {
  describe("When I test a jpg format", () => {
    test("Then it return true", () => {
      expect(isPicture("image/jpg")).toBeTruthy();
      expect(isPicture("image/jpeg")).toBeTruthy();
    });
  });

  describe("When I test a png format", () => {
    test("Then it return true", () => {
      expect(isPicture("image/png")).toBeTruthy();
    });
  });

  describe("When I test a non authorized format", () => {
    test("Then it return false", () => {
      expect(isPicture("document/pdf")).toBeFalsy();
    });
  });
});
