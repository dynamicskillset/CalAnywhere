import axios from "axios";

export interface AdminStats {
  users: number;
  pages: number;
  activePages: number;
}

export async function adminLogin(username: string, password: string): Promise<void> {
  await axios.post("/api/admin/login", { username, password });
}

export async function adminLogout(): Promise<void> {
  await axios.post("/api/admin/logout");
}

export async function checkAdminSession(): Promise<void> {
  await axios.get("/api/admin/me");
}

export async function getAdminStats(): Promise<AdminStats> {
  const r = await axios.get<AdminStats>("/api/admin/stats");
  return r.data;
}

export async function getAdminSettings(): Promise<Record<string, string>> {
  const r = await axios.get<{ settings: Record<string, string> }>("/api/admin/settings");
  return r.data.settings;
}

export async function patchAdminSettings(updates: Record<string, string>): Promise<void> {
  await axios.patch("/api/admin/settings", updates);
}
