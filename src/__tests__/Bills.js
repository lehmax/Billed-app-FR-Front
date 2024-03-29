/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import "@testing-library/jest-dom"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"

import userEvent from "@testing-library/user-event"
import router from "../app/Router.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import BillsUI from "../views/BillsUI.js"

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock })
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    )

    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
  })

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId("icon-window"))
      const windowIcon = screen.getByTestId("icon-window")
      expect(windowIcon).toHaveClass("active-icon")
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML)
      const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then I should be able to click on the eye icon to see modal of image attachment", async () => {
      document.body.innerHTML = BillsUI({ data: bills })

      const bill = new Bills({
        document,
        onNavigate: null,
        store: null,
        localStorage: window.localStorage,
      })

      const handleClickIconEye = jest.fn(bill.handleClickIconEye)
      const eyeIcon = screen.getAllByTestId("icon-eye")[0]
      eyeIcon.addEventListener("click", handleClickIconEye)
      userEvent.click(eyeIcon)
      expect(handleClickIconEye).toHaveBeenCalled()

      await waitFor(() => screen.getByTestId("modaleFile"))
      expect(screen.getByTestId("modaleFile")).toBeTruthy()
    })

    test("Then I click on the new bill button, it should redirect me to the new bill page", async () => {
      document.body.innerHTML = BillsUI({ data: bills })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const handleClickNewBill = jest.fn(newBill.handleClickNewBill)
      const newBillBtn = screen.getByTestId("btn-new-bill")
      newBillBtn.addEventListener("click", handleClickNewBill)
      userEvent.click(newBillBtn)
      expect(handleClickNewBill).toHaveBeenCalled()

      await waitFor(() => screen.getByTestId("form-new-bill"))
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })
  })
})
