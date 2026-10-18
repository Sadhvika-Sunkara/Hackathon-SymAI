# Deploying Nivasya

Backend (FastAPI + SQLite) on **Railway**, frontend (Next.js) on **Vercel**. Both free to start.

## 1. Backend on Railway

1. railway.com → **Login with GitHub** → **New Project → Deploy from GitHub repo → hackathon_MQ**
2. Click the service → **Settings → Root Directory:** `backend`
   (The start command comes from `backend/railway.json`: it seeds 60 sample rooms if needed, then starts uvicorn.)
3. Right-click the service → **Attach Volume** → mount path `/data`
4. **Variables** tab, add:

   | Name | Value |
   |---|---|
   | `DB_PATH` | `/data/campusnest.db` |
   | `OWNER_PASSWORD` | your demo owner password (username is `admin`) |
   | `SESSION_SECRET` | any long random string |
   | `ALLOWED_ORIGINS` | `*` for now, then your Vercel URL (step 3) |
   | `GOOGLE_CLIENT_ID` | leave out to use demo student sign-in |

5. **Settings → Networking → Generate Domain**. Copy it, e.g. `https://campusnest-production.up.railway.app`
6. Check: open `<railway-url>/listings` → you should see a JSON list of 60 rooms.

## 2. Frontend on Vercel

1. vercel.com → **Login with GitHub** → **Add New → Project → hackathon_MQ**
2. **Root Directory:** `frontend` (Next.js is detected automatically)
3. **Environment Variables:**
   - `NEXT_PUBLIC_API` = your Railway URL, **no trailing slash**
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = leave empty for demo sign-in
4. **Deploy** → copy the Vercel URL, e.g. `https://hackathon-mq.vercel.app`

## 3. Connect them

Back in Railway → Variables → set `ALLOWED_ORIGINS` = your Vercel URL (exact, `https://`, no trailing slash). Railway redeploys automatically.

## 4. Test like a judge

Private window, on a phone:

- [ ] Home page shows rooms; campus, women, transport and rent filters change the list
- [ ] Student demo sign-in works and opens the subleaser page
- [ ] Owner login (`admin` + your `OWNER_PASSWORD`) opens the dashboard
- [ ] Add a listing as owner → refresh → it's still there

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Can't reach the backend" / CORS error in console | `ALLOWED_ORIGINS` must exactly match the Vercel URL |
| Requests go to `undefined/...` | `NEXT_PUBLIC_API` missing in Vercel → add it and **Redeploy** (it's read at build time) |
| Railway deploy fails health check | Check Root Directory is `backend`; open Deploy Logs for the Python error |
| Listings vanish after a redeploy | Volume not mounted at `/data` or `DB_PATH` not set |
| Owner pages log you out | Normal after a backend restart with a new `SESSION_SECRET`; log in again |

## What changed for deployment

- `requirements.txt`: added `python-dotenv` (imported by `main.py`, was missing), `google-auth`, `requests`
- `main.py`: CORS origins come from `ALLOWED_ORIGINS`; owner login now returns a signed token and owner routes accept only that token (the password is no longer stored in the browser)
- `db.py`: database path comes from `DB_PATH`
- `login/page.jsx`: stores the owner token instead of the password
- Added `Procfile`, `railway.json`, `.python-version`, `.env.example` files

## Update (Sunday): Australia-wide search

- `GET /locations`: cities, universities and suburbs across Australia
- `GET /listings?near=<location id>`: homes within 50 km, sorted by distance (old `campus=` still works)
- New filters: `bedrooms=1,2,3` (multi), `bathrooms=1,2` (3 = 3+), `furnished=true|false`, `bills=true|false`
- `POST /listings/{id}/messages`: anyone can message the lease owner; owners read them in the dashboard's Messages tab
- Database: new columns (bedrooms, bathrooms, furnished, bills_included, amenities) and a messages table are added automatically on startup; existing data is kept
- Frontend: Leaflet map (OpenStreetMap tiles) — no API key needed
