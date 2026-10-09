#!/usr/bin/env bash
# One-time setup. Needs Node 20+ and Docker (or your own Postgres: edit DATABASE_URL in .env first).
set -e
if [ ! -f .env ]; then
  PW=$(openssl rand -base64 18 | tr -d '/+=')
  cat > .env <<ENV
DATABASE_URL="postgresql://precious:precious@localhost:5432/precious18"
SESSION_SECRET="$(openssl rand -base64 48)"
RECIPIENT_COOKIE_SECRET="$(openssl rand -base64 48)"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="$PW"
S3_ENDPOINT=""
S3_BUCKET=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
ENV
  echo "Admin login: admin@example.com / $PW  (saved in .env)"
fi
npm install
command -v docker >/dev/null && docker compose up -d && sleep 5
npx prisma db push
npx prisma db seed
echo "Done. Run: npm run dev  then open http://localhost:3000 and /admin/login"
