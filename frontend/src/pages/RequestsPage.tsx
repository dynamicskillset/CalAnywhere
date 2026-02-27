import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  listRequests,
  type AppointmentRequest,
} from "../services/dashboard";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const startTime = start.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date}, ${startTime}\u2013${endTime}`;
}

export function RequestsPage() {
  const { id } = useParams<{ id: string }>();

  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listRequests(id);
      setRequests(result);
    } catch {
      setError("Could not load requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    document.title = "Appointment requests - CalAnywhere";
    fetchRequests();
  }, [fetchRequests]);

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10"
    >
      <header className="mb-8">
        <Link
          to="/dashboard"
          className="text-sm text-content-muted hover:text-content"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-content">
          Appointment requests
        </h1>
        <p className="mt-2 text-sm text-content-muted">
          All meeting requests for this page, newest first.
        </p>
      </header>

      {error && (
        <div className="alert-error mb-6" role="alert">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-content-muted">Loading requests...</p>
        </div>
      )}

      {!isLoading && requests.length === 0 && !error && (
        <section className="card py-12 text-center">
          <h2 className="text-lg font-semibold text-content">
            No requests yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-content-muted">
            When someone requests a meeting through your scheduling page, it
            will appear here.
          </p>
        </section>
      )}

      {!isLoading && requests.length > 0 && (
        <ul className="space-y-4" role="list">
          {requests.map((req) => (
            <li key={req.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-content">
                    {req.requesterName}
                  </h2>
                  <p className="mt-0.5 text-sm text-content-muted">
                    {req.requesterEmail}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-content-muted">
                  {formatTimeRange(req.startTime, req.endTime)}
                </span>
              </div>

              <p className="mt-3 text-sm text-content">{req.reason}</p>

              {req.notes && (
                <p className="mt-2 text-sm text-content-subtle italic">
                  {req.notes}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-content-muted">
                <span>Requested {formatDateTime(req.createdAt)}</span>
                {req.timezone && <span>{req.timezone}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
