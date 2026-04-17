# Nexus — IoT cold-storage telemetry simulator

Express API that simulates smart cold-storage telemetry and control. A Lovable (or other) dashboard can call it over HTTPS; during local development you typically expose it with [ngrok](https://ngrok.com/).

## Project structure

```
.
├── package.json
├── package-lock.json
├── index.js                 # HTTP server: /telemetry, /state, /control
└── simulation/              # Simulation logic (no HTTP)
    ├── stateEngine.js       # Door/cooling state (buttons only; no auto cycle)
    ├── sensors.js           # Temperature, humidity, power, load
    ├── derived.js           # Risk level and efficiency score
    └── events.js            # Random event messages
```

`node_modules/` is created by `npm install` and is not committed.

## Prerequisites

- **Node.js** 18 or newer (`node -v`)
- **npm** (`npm -v`)
- **Optional:** ngrok account + CLI, to expose localhost to Lovable

## Setup

From the repository root:

```powershell
cd nexus
npm install
npm start
```

The API listens on `http://localhost:5000` by default (`PORT` in `.env` overrides).

## Expose to the internet (for Lovable)

In a second terminal, after the API is running:

```powershell
ngrok http 5000
```

ngrok prints a public HTTPS URL like:

```text
https://YOUR-SUBDOMAIN.ngrok-free.dev
```

Keep both processes running (Node API + ngrok) while you use Lovable.

## Link to give to Lovable

Paste this as the **API base URL** in your Lovable project settings:

```text
https://YOUR-SUBDOMAIN.ngrok-free.dev
```

- Use **HTTPS** (ngrok provides this).
- **No trailing slash.**
- Replace `YOUR-SUBDOMAIN` with the host ngrok shows (yours will differ).
- The app should call `GET /telemetry` and `POST /control` on that host.

Example full endpoints (do not paste these as the “base” if the UI asks only for the root):

- `https://YOUR-SUBDOMAIN.ngrok-free.dev/telemetry`
- `https://YOUR-SUBDOMAIN.ngrok-free.dev/control`

## Verify (after `npm start`)

**Local** (curl on Windows; use your real port if you changed `PORT`):

```powershell
curl.exe -s -H "ngrok-skip-browser-warning: true" http://127.0.0.1:5000/telemetry
curl.exe -s -X OPTIONS -i http://127.0.0.1:5000/telemetry
curl.exe -s -X OPTIONS -i http://127.0.0.1:5000/control
curl.exe -s -X POST http://127.0.0.1:5000/control -H "Content-Type: application/json" -d "{\"action\":\"TOGGLE_COOLING\"}"
```

**PowerShell** (recommended for POST JSON; `curl -d` can mangle quotes in PS):

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:5000/control" -Method POST -ContentType "application/json" -Body '{"action":"TOGGLE_COOLING"}'
```

**Through ngrok** (replace the host):

```powershell
curl.exe -s -H "ngrok-skip-browser-warning: true" https://YOUR-SUBDOMAIN.ngrok-free.dev/telemetry
```

**Expected:**

- `GET /telemetry` returns JSON with `temperature`, `humidity`, `door_open`, `cooling_on`, `power_usage`, `load_percentage`, `risk_level`, `efficiency_score`, `events`.
- `OPTIONS /telemetry` and `OPTIONS /control` return `200` with CORS headers.
- `POST /control` returns: `{"success":true}`.

## Control and state

- `door_open` and `cooling_on` are set only via `POST /control`. There is no automatic scenario cycling.
- **Buttons:** `{ "action": "TOGGLE_COOLING" }` or `{ "action": "TOGGLE_DOOR" }`.
- **Optional sync** (e.g. match the dashboard after load): send both booleans with no action: `{ "door_open": false, "cooling_on": true }`.
- **Default** at server start: door closed, cooling on. `GET /telemetry` reflects that state plus simulated sensors/events.

## Troubleshooting

- **Port already in use:** stop the old Node process or set `PORT=5001` in `.env`.
- **Lovable shows “Failed to fetch”:** ensure ngrok and the API are running; open the ngrok URL once in a browser if you see the ngrok warning page; the API also sends `ngrok-skip-browser-warning` on responses.
