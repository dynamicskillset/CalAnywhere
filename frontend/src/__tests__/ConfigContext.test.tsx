import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import axios from "axios";
import { ConfigProvider, useConfig } from "../contexts/ConfigContext";

vi.mock("axios");
const mockGet = axios.get as ReturnType<typeof vi.fn>;

function TestConsumer() {
  const { signupsEnabled, isConfigLoading } = useConfig();
  return (
    <div>
      <span data-testid="loading">{String(isConfigLoading)}</span>
      <span data-testid="signups">{String(signupsEnabled)}</span>
    </div>
  );
}

describe("ConfigContext", () => {
  it("defaults to signupsEnabled=true and isConfigLoading=true before fetch resolves", () => {
    // Never resolves
    mockGet.mockReturnValue(new Promise(() => {}));

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("signups").textContent).toBe("true");
  });

  it("sets signupsEnabled=true and isConfigLoading=false after a true response", async () => {
    mockGet.mockResolvedValue({ data: { signupsEnabled: true } });

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("signups").textContent).toBe("true");
  });

  it("sets signupsEnabled=false when the server returns false", async () => {
    mockGet.mockResolvedValue({ data: { signupsEnabled: false } });

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("signups").textContent).toBe("false");
  });

  it("fails open (signupsEnabled=true) when the API call errors", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("signups").textContent).toBe("true");
  });
});
