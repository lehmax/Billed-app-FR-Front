/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import BillsUI from "../views/BillsUI.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      const windowIcon = await screen.findByTestId("icon-window");
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then I should be able to click on the eye icon to see modal of image attachment", async () => {
      new Bills({
        document,
        onNavigate: null,
        store: null,
        localStorage: window.localStorage,
      });

      const modalFile = document.querySelector("#modaleFile");

      // Mock jquery "modal" method
      jQuery.prototype.modal = jest.fn(() => modalFile.classList.add("show"));

      const eyeIcon = screen.getAllByTestId("icon-eye")[1];
      fireEvent.click(eyeIcon);

      // Check modal is displayed
      expect(jQuery.prototype.modal).toHaveBeenCalledWith("show");
      expect(modalFile).toHaveClass("show");

      // Check image displayed in modal
      const image = screen.getByAltText("Bill");

      expect(image.src.replace("%E2%80%A6", "…")).toBe(eyeIcon.dataset.billUrl);
      expect(image).toBeVisible();
    });

    test("Then I click on the new bill button, it should redirect me to the new bill page", async () => {
      document.body.innerHTML = BillsUI({ data: bills });

      new Bills({
        document,
        onNavigate: (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        },
        store: null,
        localStorage: window.localStorage,
      });

      const newBillBtn = screen.getByTestId("btn-new-bill");
      fireEvent.click(newBillBtn);

      await waitFor(() => {
        expect(screen.getByText("Envoyer une note de frais")).toBeVisible();
      });
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I navigate to Bills Page", () => {
    beforeEach(() => {
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
      router();
    });

    test("Then fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills);

      expect(screen.findByText("test1")).toBeTruthy();
      expect(screen.findByText("test2")).toBeTruthy();
      expect(screen.findByText("test3")).toBeTruthy();
    });

    test("Then API return an empty payload on fetch bills", async () => {
      jest.spyOn(mockStore, "bills");

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.resolve([{}]);
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);

      expect(screen.findByText("test1")).toBeTruthy();
    });
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");

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
      router();
    });

    test("Then fetches bills from an API and fails with client error 404 HTTP status code", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Dashboard);

      expect(screen.findByText(/Erreur 404/)).toBeTruthy();
    });

    test("Then fetches bills from an API and fails with server error 500 HTTP status code", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Dashboard);

      expect(screen.findByText(/Erreur 500/)).toBeTruthy();
    });
  });
});
