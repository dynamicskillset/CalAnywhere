import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface ConfigContextValue {
  signupsEnabled: boolean;
  isConfigLoading: boolean;
}

const ConfigContext = createContext<ConfigContextValue>({
  signupsEnabled: true,
  isConfigLoading: true,
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  useEffect(() => {
    axios
      .get<{ signupsEnabled: boolean }>("/api/config")
      .then((r) => setSignupsEnabled(r.data.signupsEnabled))
      .catch(() => {
        // Default to true on error so a backend hiccup doesn't lock out signups
      })
      .finally(() => setIsConfigLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ signupsEnabled, isConfigLoading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  return useContext(ConfigContext);
}
