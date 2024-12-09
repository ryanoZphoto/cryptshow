#!/bin/bash

echo "🚀 Setting up Token Showcase Platform..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/token_showcase

# Helius RPC endpoint
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Email Configuration (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
SMTP_FROM=Your Name <your@email.com>

# Server Configuration
PORT=3000
EOL
    echo "⚠️ Please update .env with your database, Helius API, and SendGrid credentials"
fi

# Create database
echo "🗄️ Setting up database..."
psql -U postgres -c "CREATE DATABASE token_showcase;" || true

# Run database migrations
echo "Running database migrations..."
for migration in src/db/migrations/*.sql; do
    echo "Applying migration: $migration"
    psql -U postgres -d token_showcase -f "$migration"
done

# Create public directory
mkdir -p public
cp -r src/public/* public/

echo "✅ Setup complete! Next steps:"
echo "1. Update .env with your credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Access the queue status page at http://localhost:3000/queue-status.html"
echo "4. Access the admin dashboard at http://localhost:3000/admin-dashboard.html"

echo "📧 Notification System:"
echo "1. Set up a SendGrid account at https://sendgrid.com"
echo "2. Create an API key with email sending permissions"
echo "3. Verify your sender email address"
echo "4. Update SMTP_* variables in .env"

echo "🔍 Testing:"
echo "Run 'npm test' to execute the test suite" 