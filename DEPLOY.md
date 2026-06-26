# Deployment Guide — Motowarehouse Insurance App

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Railway)
- **File Storage**: Cloudflare R2
- **Auth**: NextAuth.js (credentials)
- **Deployment**: Railway

---

## Step 1: Set Up Cloudflare R2

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2**
2. Create a bucket named `motowarehouse-insurance`
3. Enable **Public Access** on the bucket (so uploaded images can be viewed)
4. Copy the **Public Bucket URL** (looks like `https://pub-xxxx.r2.dev`)
5. Go to **Manage R2 API Tokens** → Create token with:
   - Permissions: `Object Read & Write`
   - Scope: your bucket
6. Copy: Account ID, Access Key ID, Secret Access Key

---

## Step 2: Deploy to Railway

1. Push this folder to a GitHub repository
2. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** service from Railway's plugin marketplace
4. Set the following **Environment Variables** on your app service:

```
DATABASE_URL          = (Railway provides this automatically from Postgres plugin)
NEXTAUTH_SECRET       = (run: openssl rand -base64 32)
NEXTAUTH_URL          = https://your-app.up.railway.app
ADMIN_USERNAME        = admin
ADMIN_PASSWORD        = (choose a strong password)
R2_ACCOUNT_ID         = (from Cloudflare)
R2_ACCESS_KEY_ID      = (from Cloudflare)
R2_SECRET_ACCESS_KEY  = (from Cloudflare)
R2_BUCKET_NAME        = motowarehouse-insurance
R2_PUBLIC_URL         = https://pub-xxxx.r2.dev
```

5. Railway will build automatically. The `railway.json` config runs:
   - `npx prisma migrate deploy` (creates DB tables)
   - `next start` (starts the app)

---

## Step 3: First Login

Open your Railway URL and log in with:
- Username: the `ADMIN_USERNAME` you set
- Password: the `ADMIN_PASSWORD` you set

---

## Local Development

```bash
cd insurance-app
npm install

# Create .env from template
cp .env.example .env
# Fill in your values

# Set up database
npx prisma db push

# Run dev server
npm run dev
```

Open http://localhost:3000

---

## Adding More Users (Future)

Currently, auth is a single admin user (environment variables).
To add multi-user support, add a `User` model to Prisma and switch to
database-backed credentials — the architecture is already prepared for this.
