import { render, screen, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import * as authService from "../services/auth";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

vi.mock("../services/auth");

const mockGetMe = authService.getMe as ReturnType<typeof vi.fn>;
const mockSignout = authService.signout as ReturnType<typeof vi.fn>;

function TestConsumer() {
  const { session, isLoading, isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="emoji">{session?.emojiId ?? "none"}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  it("starts loading and unauthenticated", () => {
    mockGetMe.mockReturnValue(new Promise(() => {}));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
  });

  it("sets session and isAuthenticated after successful getMe", async () => {
    mockGetMe.mockResolvedValue({ emojiId: "🐶🍕🚀" });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("emoji").textContent).toBe("🐶🍕🚀");
  });

  it("stays unauthenticated when getMe throws (no active session)", async () => {
    mockGetMe.mockRejectedValue(new Error("401"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("emoji").textContent).toBe("none");
  });

  it("clears session on logout", async () => {
    mockGetMe.mockResolvedValue({ emojiId: "🐶🍕🚀" });
    mockSignout.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Logout" }).click();
    });

    expect(mockSignout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("emoji").textContent).toBe("none");
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    // Suppress the React error boundary console noise
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider"
    );
    spy.mockRestore();
  });
});
