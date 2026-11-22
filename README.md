# Precious 18

A private birthday experience with a recipient journey and a password-protected admin area. The app uses Next.js, PostgreSQL, and Prisma.

## Requirements

- Node.js 20 or later
- Docker Desktop with Docker Compose

## Local development on Windows

From this project directory, open PowerShell and run:

```powershell
.\setup.ps1
npm.cmd run dev
```

The setup script creates `.env` with fresh session secrets and an admin password, starts PostgreSQL and local S3Mock storage, creates the database tables, and seeds the initial admin and recipient. Keep the printed admin password; it is stored in `.env` as well.

Open [http://localhost:3000](http://localhost:3000) for the recipient page and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the admin area. The seeded recipient birthday is 23 November 2008.

To stop the local services, run `docker compose stop db s3mock`. To start them again, run `docker compose up -d db s3mock`. PostgreSQL and uploaded media persist in the `pgdata` and `s3data` volumes. The local S3Mock endpoint is `http://localhost:9090`; it is intended for development only.

## Run the full stack in Docker

Create `.env` first by running `.\setup.ps1` once, or copy `.env.example` to `.env` and replace both secrets and the admin password. Then run:

```powershell
docker compose up --build
```

Compose waits for PostgreSQL, syncs the Prisma schema, seeds the initial admin account, and starts the site on port 3000. Visit the same two URLs above. Press Ctrl+C to stop; `docker compose down` stops and removes the containers but keeps database data. `docker compose down -v` also deletes the database volume.

## Admin workflow

Sign in and add messages, memories, wishes, reasons, gifts, chapter titles, and media. New content starts as a draft. Publish individual items, then publish the experience from the dashboard. The recipient page only shows published content. Set the experience to maintenance while preparing it.

## Media storage

Local setup uses Docker S3Mock, so the Media section works without cloud credentials. For a deployed environment, replace the local values for `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY` with an S3-compatible bucket. Supabase Storage works with this application: create a private `precious-media` bucket, enable its S3 protocol, then use the endpoint, region, and server-only access-key pair shown in **Storage → S3 Configuration**. Use the direct storage endpoint (`https://<project-ref>.storage.supabase.co/storage/v1/s3`) when it is available. Use the **Media** admin section to upload files, edit captions and display order, and choose which items appear in the recipient gallery. Gallery files are delivered through authenticated app routes. Uploads are currently limited to 4 MB to fit Vercel's request body limit. S3Mock is for local development only; use real object storage for deployment.

## Deploy to Vercel

This project is linked to a Vercel project locally. To deploy it:

1. Create a managed PostgreSQL database and an S3-compatible object storage bucket. Do not use the Docker PostgreSQL or S3Mock services in production.
2. Add these variables in Vercel **Project Settings → Environment Variables**. Use separate databases for Production and Preview environments.
   - `DATABASE_URL`: PostgreSQL connection string for that environment.
   - `SESSION_SECRET` and `RECIPIENT_COOKIE_SECRET`: two different random secrets, each at least 32 characters.
   - `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`: production bucket endpoint, region, name, and private credentials.
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the initial administrator credentials; use a password of at least 12 characters.
3. Keep the framework preset as **Next.js**. The included `vercel.json` sets the build command to `npm run vercel-build`, which applies checked-in Prisma migrations before building.
4. Deploy once. Then seed the new database once with the initial admin and recipient records by running `npm run db:seed` from a trusted terminal with that environment's `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` set. Do not commit or share these values.

The initial migration assumes a new, empty hosted database. If the hosted database already contains tables created with `prisma db push`, baseline it before using this migration workflow; do not deploy the initial migration against that database as-is. For local Docker development, continue using `npm run db:push`.

Vercel's function request and response body limit is 4.5 MB, so the media upload route accepts files up to 4 MB to leave room for multipart form data. Larger media needs direct-to-bucket signed uploads.

## Database commands

- `npm.cmd run db:push` applies the current Prisma schema to the configured database.
- `npm.cmd run db:seed` creates the initial admin and recipient if they do not already exist.
- `npm.cmd run db:setup` runs both commands.
- `npm.cmd run db:migrate:deploy` applies checked-in migrations to a deployment database.

For deployments, provide a managed PostgreSQL database and strong secrets through the host's environment settings. Use HTTPS and apply schema changes as part of deployment. The included Compose credentials and database port are for local development only.

## Launch checklist

1. In Vercel, set `DATABASE_URL`, `SESSION_SECRET`, `RECIPIENT_COOKIE_SECRET` and, for photos/audio/video, the five `S3_*` values. With Supabase, use the **Session pooler** connection string (port 5432) because Vercel cannot reach the direct database host over IPv4.
2. Deploy. The build runs `prisma migrate deploy`, so a missing or wrong `DATABASE_URL` fails the build at that step.
3. Seed once from a trusted terminal: set `DATABASE_URL`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters), then run `npm run db:seed`. The seed resets the admin password every time it runs, so do not run it again unless you mean to.
4. Sign in at `/admin/login`. Write the closing message under **Settings**, add the letter, memories, wishes, reasons, gifts and chapters, and **Publish** each item. Only published items are shown.
5. On the dashboard choose **Publish experience**. Until then she sees "Your story is being prepared."
6. Test as her: open `/`, enter the birthday as DD/MM/YYYY, and click through to the end. Use **Pause experience** if you need to hide it again.

