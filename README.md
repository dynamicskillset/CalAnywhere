![CalAnywhere logo](https://github.com/dynamicskillset/calanywhere-cloud/blob/main/calanywhere.jpg?raw=true)

## CalAnywhere Cloud

The managed hosting platform for [CalAnywhere](https://github.com/dajbelshaw/CalAnywhere), the privacy-first scheduling tool for any calendar.

### Architecture

This repository extends the open-source CalAnywhere core with cloud features:

```
backend/          # Express + TypeScript API
  src/auth/       # Emoji ID authentication (email-free)
  src/routes/     # Pages + dashboard API
  src/db/         # PostgreSQL, migrations
frontend/         # React + Vite + TypeScript UI
  src/pages/      # Signup, signin, dashboard, scheduling
  src/components/ # EmojiPicker, NavBar, shared UI
```

### Relationship to the open-source core

The core scheduling engine lives at [dajbelshaw/CalAnywhere](https://github.com/dajbelshaw/CalAnywhere) under AGPL-3.0. Anyone can self-host it for free.

This repository adds:

- **Emoji ID accounts** — email-free auth using 3-emoji handles (e.g. 🐶🍕🚀) and iCal URL as credential
- **Dashboard** — manage scheduling pages, view appointment requests
- **Page ownership and expiry** — pages linked to user accounts with configurable expiry
- **Encrypted notification emails** — AES-256-GCM encrypted, decrypted only at send time
- **Managed hosting** — the service at calanywhere.com

No OAuth. No email collection. No passwords. iCal URLs only.

### Deploy to Render

You can deploy a fully working instance using [Render](https://render.com):

1. Fork this repo (or use it directly)
2. Go to **Render** → **New** → **Blueprint**
3. Select the repository. Render reads `render.yaml` and creates three services: **PostgreSQL**, **backend** (Node), and **frontend** (static site)
4. Fill in the environment variables when prompted:

   | Variable | Required | Value |
   |---|---|---|
   | `EMAIL_ENCRYPTION_KEY` | Yes | 64-char hex string. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `BASE_PUBLIC_URL` | Yes | Your frontend URL, e.g. `https://calanywhere-frontend.onrender.com` |
   | `MAILGUN_API_KEY` | No | Your Mailgun key (emails log to console when absent) |
   | `MAILGUN_DOMAIN` | No | Your Mailgun domain |
   | `MAILGUN_FROM_EMAIL` | No | e.g. `CalAnywhere <no-reply@example.com>` |

5. Click **Apply**. Render provisions the database, builds both services, and gives you a live URL.

> **Note:** If Render names your backend something other than `calanywhere-backend`, update the `/api/*` rewrite URL in the frontend service's **Redirects/Rewrites** settings to match.

### Docker Compose (local)

```bash
cp backend/.env.example backend/.env
# edit backend/.env with your values
docker compose up --build
```

The app will be available at `http://localhost`. Mailgun is optional for local development: emails are logged to the console when the env vars are absent.

### Syncing with upstream

```bash
git fetch upstream
git merge upstream/main
```

### Licence

- **`backend/` and `frontend/`** — [AGPL-3.0](https://github.com/dajbelshaw/CalAnywhere/blob/main/LICENSE) (inherited from upstream)
- **Cloud additions** — [BSL-1.1](LICENSE) (converts to AGPL-3.0 three years after each release)

See [LICENSE](LICENSE) for full terms.

---

Built by [Dynamic Skillset](https://dynamicskillset.com).
