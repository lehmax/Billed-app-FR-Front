/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage";
import mockStore from "../__mocks__/store.js";
import Router from "../app/Router";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import NewBill, { isPicture } from "../containers/NewBill";
import NewBillUI from "../views/NewBillUI.js";

jest.mock("../app/store", () => mockStore);
jest.spyOn(console, "error").mockImplementation();

describe("Given I am connected as an employee", () => {
  const update = jest.spyOn(mockStore.bills(), "update");
  const create = jest.spyOn(mockStore.bills(), "create");

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
    const fileImage = new File(["test"], "test.jpg", { type: "image/jpg" });
    const fillForm = async () => {
      const expenseType = await screen.findByTestId("expense-type");
      const expenseName = screen.getByTestId("expense-name");
      const datePicker = screen.getByTestId("datepicker");
      const amount = screen.getByTestId("amount");
      const vat = screen.getByTestId("vat");
      const commentary = screen.getByTestId("commentary");
      const inputFile = screen.getByTestId("file");

      userEvent.selectOptions(expenseType, "Transports");
      userEvent.type(expenseName, "Paris - Londres");
      fireEvent.change(datePicker, { target: { value: "2024-01-04" } });
      userEvent.type(amount, "100");
      userEvent.type(vat, "20");
      userEvent.type(commentary, "Voyage d'affaire");
      userEvent.upload(inputFile, fileImage);
    };

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
      });
    });

    describe("When an error occured on upload image", () => {
      test("Then I should see error on console", async () => {
        create.mockImplementationOnce(() => {
          return Promise.reject(new Error("Erreur"));
        });

        const inputFile = await screen.findByTestId("file");
        userEvent.upload(inputFile, fileImage);

        await new Promise(process.nextTick);

        expect(create).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
      });
    });

    describe("When I upload an image in good format", () => {
      test("Then it should create a new bill and api return the uploaded file url and bill id", async () => {
        const newBill = new NewBill({
          document,
          onNavigate: (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          },
          store: mockStore,
          localStorage: window.localStorage,
        });

        const inputFile = await screen.findByTestId("file");

        userEvent.upload(inputFile, fileImage);

        await waitFor(() => {
          expect(inputFile.files.item(0)).toEqual(fileImage);
        });

        expect(newBill.fileUrl).toEqual(
          "https://localhost:3456/images/test.jpg"
        );
        expect(newBill.billId).toEqual("1234");
        expect(create).toHaveBeenCalled();
      });
    });

    describe("When I fill the form correctly", () => {
      test("Then I should be able to submit the form, and redirected to Bills page", async () => {
        await fillForm();

        userEvent.click(screen.getByText("Envoyer"));

        expect(update).toHaveBeenCalled();
        expect(await screen.findByText("Mes notes de frais")).toBeVisible();
      });
    });

    describe("when I fill the form correctly and submit, an error occurs", () => {
      test("Then I should see error on console", async () => {
        update.mockImplementationOnce(() => {
          return Promise.reject(new Error("Erreur"));
        });

        document.body.innerHTML = NewBillUI();
        window.onNavigate(ROUTES_PATH.NewBill);

        await fillForm();

        userEvent.click(screen.getByText("Envoyer"));

        expect(update).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
      });
    });
  });
});

// Unit test isPicture function
describe("Given a function to know if media type match to authorized format (only: jpg, png)", () => {
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
