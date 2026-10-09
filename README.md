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

Local setup uses Docker S3Mock, so the Media section works without cloud credentials. For a deployed environment, replace the local values for `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY` with an S3-compatible bucket (such as Cloudflare R2). Use the **Media** admin section to upload files, edit captions and display order, and choose which items appear in the recipient gallery. Gallery files are delivered through authenticated app routes. A standalone music player, voice/photo responses, additional settings/security pages, and draft preview still need implementation. S3Mock is for local development only; use real object storage for deployment.

## Database commands

- `npm.cmd run db:push` applies the current Prisma schema to the configured database.
- `npm.cmd run db:seed` creates the initial admin and recipient if they do not already exist.
- `npm.cmd run db:setup` runs both commands.

For deployments, provide a managed PostgreSQL database and strong secrets through the host's environment settings. Use HTTPS and apply schema changes as part of deployment. The included Compose credentials and database port are for local development only.
