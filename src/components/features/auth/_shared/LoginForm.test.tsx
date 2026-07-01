import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { LoginForm } from "./LoginForm"
import { ApiError } from "@/src/lib/api-client"

const mockLogin = vi.fn()

vi.mock("@/src/context/AuthContext", () => ({
  useAuth: () => ({ isLoading: false, login: mockLogin }),
}))

vi.mock("@/src/services/auth.service", () => ({
  AuthService: { forgotPassword: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderForm(props: Partial<React.ComponentProps<typeof LoginForm>> = {}) {
  return render(
    <LoginForm
      portal="seller"
      invalidCredentialsMessage="Ungültige Anmeldedaten."
      onSuccess={vi.fn()}
      emailPlaceholder="ihre@firma.de"
      forgot={{ placeholder: "ihre@firma.de" }}
      {...props}
    />
  )
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("submits the entered credentials against the given portal", async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    const onSuccess = vi.fn()
    renderForm({ onSuccess })

    fireEvent.change(screen.getByPlaceholderText("ihre@firma.de"), {
      target: { value: "seller@example.dev" },
    })
    fireEvent.change(screen.getByPlaceholderText("Passwort"), {
      target: { value: "Secret123!" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Anmelden" }))

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith(
        { email: "seller@example.dev", password: "Secret123!" },
        "seller"
      )
    )
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it("shows the generic message on invalid credentials and does not call onSuccess", async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(401, "nope"))
    const onSuccess = vi.fn()
    renderForm({ onSuccess })

    fireEvent.change(screen.getByPlaceholderText("ihre@firma.de"), {
      target: { value: "x@y.de" },
    })
    fireEvent.change(screen.getByPlaceholderText("Passwort"), { target: { value: "wrong" } })
    fireEvent.click(screen.getByRole("button", { name: "Anmelden" }))

    expect(await screen.findByText("Ungültige Anmeldedaten.")).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it("clears the email and password fields when returning from the forgot view", () => {
    renderForm()

    const email = screen.getByPlaceholderText("ihre@firma.de") as HTMLInputElement
    const password = screen.getByPlaceholderText("Passwort") as HTMLInputElement
    fireEvent.change(email, { target: { value: "typed@example.dev" } })
    fireEvent.change(password, { target: { value: "typedPw" } })

    fireEvent.click(screen.getByRole("button", { name: "Passwort vergessen?" }))
    fireEvent.click(screen.getByRole("button", { name: /Zurück zur Anmeldung/i }))

    expect((screen.getByPlaceholderText("ihre@firma.de") as HTMLInputElement).value).toBe("")
    expect((screen.getByPlaceholderText("Passwort") as HTMLInputElement).value).toBe("")
  })

  it("surfaces the rate-limit message verbatim on 429", async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(429, "Zu viele Versuche. Bitte warten."))
    renderForm()

    fireEvent.change(screen.getByPlaceholderText("ihre@firma.de"), {
      target: { value: "x@y.de" },
    })
    fireEvent.change(screen.getByPlaceholderText("Passwort"), { target: { value: "pw" } })
    fireEvent.click(screen.getByRole("button", { name: "Anmelden" }))

    expect(await screen.findByText("Zu viele Versuche. Bitte warten.")).toBeInTheDocument()
  })

  it("toggles to the forgot-password view and back, notifying the parent", () => {
    const onViewChange = vi.fn()
    renderForm({ onViewChange })

    fireEvent.click(screen.getByRole("button", { name: "Passwort vergessen?" }))
    expect(onViewChange).toHaveBeenLastCalledWith("forgot")
    // The login submit button is gone in the forgot view.
    expect(screen.queryByRole("button", { name: "Anmelden" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Zurück zur Anmeldung/i }))
    expect(onViewChange).toHaveBeenLastCalledWith("login")
    expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument()
  })

  it("renders login header and footer slots only in the login view", () => {
    renderForm({
      loginHeader: <h1>Willkommen zurück</h1>,
      loginFooter: <a href="#">Registrieren</a>,
    })

    expect(screen.getByRole("heading", { name: "Willkommen zurück" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Registrieren" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Passwort vergessen?" }))
    expect(screen.queryByRole("heading", { name: "Willkommen zurück" })).not.toBeInTheDocument()
  })
})
