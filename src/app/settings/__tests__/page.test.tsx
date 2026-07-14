import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "../page";

const mockRefresh = jest.fn();
const mockResetPin = jest.fn();
const mockUpdatePassword = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme: jest.fn() }),
}));

jest.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    session: {
      userId: "user-1",
      firstName: "Alex",
      email: "alex@example.com",
      createdAt: 1,
      accountType: "hosted",
    },
    refresh: mockRefresh,
    resetPin: mockResetPin,
    updatePassword: mockUpdatePassword,
  }),
}));

jest.mock("@/lib/auth", () => ({
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

describe("SettingsPage account persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefresh.mockResolvedValue(undefined);
    mockResetPin.mockResolvedValue(null);
    mockUpdatePassword.mockResolvedValue(null);
    mockUpdateProfile.mockResolvedValue({});
    window.history.replaceState({}, "", "/settings");
  });

  it("verifies and reports a hosted profile sync", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const name = screen.getByRole("textbox", { name: "Display name" });
    await user.clear(name);
    await user.type(name, "Jamie Student");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(mockUpdateProfile).toHaveBeenCalledWith({ first_name: "Jamie Student" });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/synced to your Wardly account/i)).toBeInTheDocument();
  });

  it("shows the recovery form and submits a confirmed new password", async () => {
    window.history.replaceState({}, "", "/settings?password-reset=1");
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.type(screen.getByLabelText("New password"), "new-password-123");
    await user.type(screen.getByLabelText("Confirm new password"), "new-password-123");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(mockUpdatePassword).toHaveBeenCalledWith("new-password-123");
    expect(await screen.findByText("Password updated")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/settings");
    expect(window.location.search).toBe("");
  });
});
