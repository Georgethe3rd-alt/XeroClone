#!/bin/bash
set -e

echo "=== PayCraft Deploy ==="

DEPLOY_DIR="/root/wipayroll"
REPO="https://github.com/Georgethe3rd-alt/XeroClone.git"
BRANCH="claude/smb-payroll-saas-fQOwu"
APP_DIR="$DEPLOY_DIR/apps/web"

cd "$DEPLOY_DIR"

# Pull latest code
if [ -d ".git" ]; then
  echo "Pulling latest..."
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  echo "Cloning repo..."
  git clone --branch "$BRANCH" --depth 1 "$REPO" .
fi

cd "$APP_DIR"

# Stop existing containers
docker compose down 2>/dev/null || true

# Build and start
echo "Building..."
docker compose build --no-cache

echo "Starting..."
docker compose up -d

# Wait for DB to be ready
echo "Waiting for database..."
sleep 8

# Run migrations
echo "Running migrations..."
docker compose exec -T app sh -c 'DATABASE_URL=$DATABASE_URL npx prisma migrate deploy --schema=./prisma/schema.prisma' 2>/dev/null || \
docker run --rm --network wipayroll_default \
  -e DATABASE_URL=postgresql://paycraft:paycraft_secure_2026@wipayroll-db:5432/paycraft_prod \
  --entrypoint sh \
  wipayroll-app -c "npx prisma migrate deploy"

# Seed demo data
echo "Seeding demo data..."
docker compose exec -T app sh -c '
  node -e "
const { Pool } = require(\"pg\");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\"SELECT COUNT(*) FROM \\\"User\\\"\").then(r => {
  if (r.rows[0].count === \"0\") {
    console.log(\"Empty DB, will seed via bun\");
    process.exit(1);
  } else {
    console.log(\"DB already seeded (\"+r.rows[0].count+\" users)\");
    process.exit(0);
  }
}).catch(() => process.exit(1));
"' 2>/dev/null || echo "Seed check failed, DB may need seeding manually"

echo ""
echo "=== Deploy complete! ==="
echo "App: http://187.77.217.138:3005"
echo "Login: admin@techvault.com.au / paycraft123"
echo ""
echo "To seed demo data:"
echo "  cd $APP_DIR && DATABASE_URL=postgresql://paycraft:paycraft_secure_2026@localhost:5433/paycraft_prod bun run prisma/seed.ts"
