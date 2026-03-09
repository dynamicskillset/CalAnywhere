import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { pagesRouter } from "./routes/pages";
import { createAuthRouter } from "./auth";
import { createDashboardRouter } from "./routes/dashboard";
import { createAdminRouter } from "./routes/admin";
import { initDatabase, getPool } from "./db/client";
import { runMigrations } from "./db/migrate";
import { initStores } from "./store";

const app = express();
const port = process.env.PORT || 4000;

app.set('trust proxy', 1);

// Basic security headers (CSP disabled — frontend is served separately)
app.use(helmet({
  contentSecurityPolicy: false
}));

// CORS: allow all in development, restrict via env in production
const allowedOrigin =
  process.env.ALLOWED_ORIGIN && process.env.ALLOWED_ORIGIN !== "*"
    ? process.env.ALLOWED_ORIGIN
    : "*";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * GET /api/config — public endpoint consumed by the frontend on load.
 * Returns feature flags that affect UI rendering (e.g. signupsEnabled).
 */
app.get("/api/config", async (_req, res) => {
  const pool = getPool();
  let signupsEnabled = true;
  if (pool) {
    try {
      const { rows } = await pool.query(
        "SELECT value FROM system_settings WHERE key = 'signups_enabled'"
      );
      if (rows.length > 0) signupsEnabled = rows[0].value !== "false";
    } catch {
      // DB not ready — default to open
    }
  }
  res.json({ signupsEnabled });
});

app.use("/api/pages", pagesRouter);

async function start() {
  try {
    const hasDb = await initDatabase();
    if (hasDb) {
      await runMigrations();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Database initialisation failed:", err);
    // eslint-disable-next-line no-console
    console.log("Falling back to ephemeral in-memory mode.");
  }

  // Auth routes — only available when a database is connected
  const pool = getPool();
  if (pool) {
    app.use("/api/auth", createAuthRouter(pool));
    app.use("/api/dashboard", createDashboardRouter(pool));
    app.use("/api/admin", createAdminRouter(pool));
  }

  // 404 handler must come after all route registrations
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  initStores();

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`CalAnywhere backend listening on port ${port}`);
  });
}

start();
