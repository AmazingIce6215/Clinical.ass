import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@/components/app-shell";
import { LandingActions } from "@/components/landing/landing-actions";
import DashboardPage from "@/app/dashboard/page";
import HomePage from "@/app/page";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLogout = jest.fn();
const mockGoAnonymous = jest.fn();
let mockPathname = "/dashboard";
let mockSession: { userId: string; firstName: string; email?: string; createdAt: number } | null = {
  userId: "guest-test",
  firstName: "",
  createdAt: 1,
};

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    session: mockSession,
    ready: true,
    logout: mockLogout,
    goAnonymous: mockGoAnonymous,
  }),
}));

describe("workspace entry and navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPathname = "/dashboard";
    mockSession = { userId: "guest-test", firstName: "", createdAt: 1 };
    jest.clearAllMocks();
  });

  test("creates a guest session before opening the dashboard", async () => {
    const user = userEvent.setup();
    mockSession = null;

    render(<LandingActions />);
    await user.click(screen.getByRole("button", { name: "Try as guest" }));

    expect(mockGoAnonymous).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    expect(screen.getByRole("link", { name: "Sign in or create account" })).toHaveAttribute("href", "/sign-in");
  });

  test("marks the current module and provides workspace breadcrumbs", () => {
    mockPathname = "/teaching";

    render(
      <AppShell title="Teaching bank">
        <h1>Teaching workspace</h1>
      </AppShell>,
    );

    expect(screen.getAllByRole("link", { name: "Teaching bank" }).some((link) => link.getAttribute("aria-current") === "page")).toBe(true);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent("OverviewTeaching bank");
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
  });

  test("renders a useful dashboard without decorative canvas content", () => {
    const { container } = render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Your clinical toolkit" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Core encounter tools" })).toBeInTheDocument();
    expect(screen.getByText("Educational use only", { selector: "p" })).toBeInTheDocument();
    expect(container.querySelector("canvas")).toBeNull();
  });

  test("presents the core clinical tools without apologetic product copy", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Think clearly. See more. Present with confidence." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Clinical reasoning" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Image diagnosis" })).toBeInTheDocument();
    expect(screen.queryByText(/independent modules/i)).not.toBeInTheDocument();
  });
});
