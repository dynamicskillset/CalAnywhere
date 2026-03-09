import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkAdminSession,
  adminLogout,
  getAdminStats,
  getAdminSettings,
  patchAdminSettings,
  type AdminStats,
} from "../services/admin";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.title = "Admin dashboard — CalAnywhere";

    checkAdminSession().catch(() => navigate("/admin/login", { replace: true }));

    Promise.all([getAdminStats(), getAdminSettings()])
      .then(([s, cfg]) => {
        setStats(s);
        setSettings(cfg);
      })
      .catch(() => setLoadError("Could not load dashboard data."));
  }, [navigate]);

  const handleSignupsToggle = async (enabled: boolean) => {
    setSaveError(null);
    setIsSaving(true);
    try {
      await patchAdminSettings({ signups_enabled: enabled ? "true" : "false" });
      setSettings((prev) => ({ ...prev, signups_enabled: enabled ? "true" : "false" }));
    } catch {
      setSaveError("Could not update setting. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate("/admin/login", { replace: true });
  };

  const signupsEnabled = settings.signups_enabled !== "false";

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10"
    >
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          Admin dashboard
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-content-muted hover:text-content"
        >
          Sign out
        </button>
      </header>

      {loadError && (
        <div className="alert-error mb-6" role="alert">
          {loadError}
        </div>
      )}

      {/* Stats */}
      <section className="mb-6" aria-label="System stats">
        <h2 className="mb-3 text-sm font-semibold text-content">Overview</h2>
        {stats ? (
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Users" value={stats.users} />
            <StatCard label="Total pages" value={stats.pages} />
            <StatCard label="Active pages" value={stats.activePages} />
          </div>
        ) : (
          !loadError && (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton mb-2 h-7 w-12" />
                  <div className="skeleton h-3 w-20" />
                </div>
              ))}
            </div>
          )
        )}
      </section>

      {/* Feature flags */}
      <section className="card space-y-5" aria-label="Feature flags">
        <h2 className="text-sm font-semibold text-content">Feature flags</h2>

        {saveError && (
          <div className="alert-error" role="alert">
            {saveError}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-content">New signups</p>
            <p className="text-xs text-content-muted">
              When off, the sign-up flow is hidden and new accounts cannot be
              created. Existing users are unaffected.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={signupsEnabled}
            disabled={isSaving || !stats}
            onClick={() => handleSignupsToggle(!signupsEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${
              signupsEnabled ? "bg-accent" : "bg-surface-overlay"
            }`}
            aria-label={signupsEnabled ? "Disable new signups" : "Enable new signups"}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                signupsEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Placeholder row for future premium flags */}
        <p className="text-xs text-content-subtle">
          Additional feature flags will appear here.
        </p>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <p className="text-2xl font-semibold tabular-nums text-content">{value}</p>
      <p className="mt-1 text-xs text-content-muted">{label}</p>
    </div>
  );
}
