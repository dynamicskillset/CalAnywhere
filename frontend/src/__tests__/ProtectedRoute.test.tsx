import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import { ProtectedRoute } from "../components/ProtectedRoute";
import * as AuthContextModule from "../contexts/AuthContext";

vi.mock("../contexts/AuthContext");

const mockUseAuth = AuthContextModule.useAuth as ReturnType<typeof vi.fn>;

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Secret content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/signin" element={<div>Sign in page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state while the session check is in progress", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

    renderRoute();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });

  it("redirects to /signin when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    renderRoute();

    expect(screen.getByText("Sign in page")).toBeInTheDocument();
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    renderRoute();

    expect(screen.getByText("Secret content")).toBeInTheDocument();
    expect(screen.queryByText("Sign in page")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
