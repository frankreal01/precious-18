$ErrorActionPreference = "Stop"

if (-not (Test-Path .env)) {
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $adminBytes = New-Object byte[] 24
  $sessionBytes = New-Object byte[] 48
  $recipientBytes = New-Object byte[] 48
  $rng.GetBytes($adminBytes)
  $rng.GetBytes($sessionBytes)
  $rng.GetBytes($recipientBytes)
  $rng.Dispose()
  $adminPassword = [Convert]::ToBase64String($adminBytes).Replace("/", "x").Replace("+", "y").Replace("=", "")
  $sessionSecret = [Convert]::ToBase64String($sessionBytes)
  $recipientSecret = [Convert]::ToBase64String($recipientBytes)
  @"
DATABASE_URL="postgresql://precious:precious@localhost:5432/precious18"
SESSION_SECRET="$sessionSecret"
RECIPIENT_COOKIE_SECRET="$recipientSecret"
S3_ENDPOINT=""
S3_BUCKET=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="$adminPassword"
"@ | Set-Content -Encoding utf8 .env
  Write-Host "Created .env. Admin login: admin@example.com / $adminPassword"
} else {
  Write-Host "Using existing .env credentials."
}

docker compose up -d db
npm.cmd install
npm.cmd run db:setup
Write-Host "Setup complete. Start the site with: npm.cmd run dev"
Write-Host "Open http://localhost:3000 and http://localhost:3000/admin/login"
