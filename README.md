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

Cloud additions are licensed under the [Business Source License 1.1](LICENSE) (BSL-1.1). You can read the code, fork it, and use it for non-production purposes. Each release automatically converts to AGPL-3.0 three years after publication, at which point it becomes fully open source. The `backend/` and `frontend/` directories remain AGPL-3.0, inherited from upstream.

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

See [LICENSE](LICENSE) for full terms.

---

Built by [Dynamic Skillset](https://dynamicskillset.com).
