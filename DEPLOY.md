# Deploying Kreston CRM (free, ~3 days, Render + Neon)

This app needs a long-running Node server (custom `server.ts` + Socket.io),
a background email poller, and a persistent Postgres database. That rules out
Vercel/Netlify. We use **Render** (app) + **Neon** (Postgres) free tiers.

---

## 1. Create the database (Neon)

1. Go to https://neon.tech → sign up (free, no credit card).
2. Create a project (any name, pick the region closest to your users).
3. Copy the **connection string**. It looks like:
   `postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`
4. Keep this — it's your `DATABASE_URL`.

## 2. Load the schema + demo data (run once, from your laptop)

From the `kreston-crm` folder, point at Neon and push the schema + seed:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
npx prisma db push        # creates all tables on Neon
npm run db:seed           # loads demo users + data
```

(You only repeat `db push` if you later change `prisma/schema.prisma`.)

## 3. Create the web service (Render)

1. Go to https://render.com → sign up → connect your GitHub.
2. **New → Web Service** → pick the `aleksiljs1/CRM-App` repo.
3. Render auto-detects `render.yaml`. Set **Root Directory** to `kreston-crm`
   (the app is in a subfolder of the repo).
4. Plan: **Free**.
5. When prompted, fill in the environment variables (values from your local
   `.env`, except the two marked):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your Neon string from step 1 |
   | `NEXTAUTH_SECRET` | any long random string |
   | `NEXTAUTH_URL` | **leave blank for now**, fill after first deploy (step 4) |
   | `GEMINI_API_KEY` | from your local `.env` |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | from your local `.env` |
   | `SMTP_PASS` | from your local `.env` (Gmail app password) |

6. Click **Create Web Service**. First build takes a few minutes.

## 4. Set the public URL

1. After the first deploy, Render gives you a URL like
   `https://kreston-crm.onrender.com`.
2. Set `NEXTAUTH_URL` to exactly that URL (Environment tab) and save →
   triggers a redeploy. **Login won't work until this is set correctly.**

## 5. Done

Visit the URL and log in with a seeded account (see `prisma/seed.ts` for
credentials).

---

## Making code changes during the 3 days

Just push to `master`:

```powershell
git add -A
git commit -m "your change"
git push
```

Render auto-deploys every push (~2–4 min). No SSH, no manual steps.
**Exception:** if a change edits `prisma/schema.prisma`, re-run step 2's
`npx prisma db push` against Neon (with `$env:DATABASE_URL` set) so the cloud
DB matches.

## Things to know

- **Cold start:** the free Render service sleeps after ~15 min of no traffic.
  The next visit takes ~40s to wake. Open the URL a minute before your demo to
  warm it up. While asleep, the email poller is paused (resumes on wake).
- **Gemini:** works in the live demo as long as `GEMINI_API_KEY` is set in
  Render (step 3).
- **Secrets:** your local `.env` is gitignored and is NOT on GitHub. Secrets
  live only in Render's Environment tab.
