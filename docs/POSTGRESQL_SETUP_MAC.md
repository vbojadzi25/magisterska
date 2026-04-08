# PostgreSQL Setup Guide for macOS

This guide covers setting up PostgreSQL on macOS for the Denar money transfer application development.

## Option 1: Homebrew Installation (Recommended)

### Prerequisites
- macOS 10.14 or later
- Homebrew package manager

### Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Install PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Add PostgreSQL to PATH (add to ~/.zshrc or ~/.bash_profile)
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Verify Installation
```bash
# Check PostgreSQL version
psql --version

# Check if service is running
brew services list | grep postgresql
```

## Option 2: Postgres.app (GUI Alternative)

### Download and Install
1. Download from: https://postgresapp.com/
2. Drag Postgres.app to Applications folder
3. Launch Postgres.app
4. Click "Initialize" to create a new server

### Add to PATH
```bash
# Add to ~/.zshrc or ~/.bash_profile
echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Database Setup for Denar

### 1. Create Databases via GUI or Command Line

**Option A: Using your PostgreSQL GUI (Recommended)**
1. Open your PostgreSQL GUI application
2. Connect to your PostgreSQL server
3. Create a new database called `denar_dev`
4. Create a new database called `denar_test`
5. Create a new user called `denar_user` with password `denar_password_2024`
6. Grant all privileges on both databases to `denar_user`

**Option B: Using Command Line**
```bash
# Connect to PostgreSQL using your GUI's credentials
psql -h localhost -U postgres

# Create user for Denar application
CREATE USER denar_user WITH PASSWORD 'denar_password_2024';

# Create development database
CREATE DATABASE denar_dev OWNER denar_user;

# Create test database
CREATE DATABASE denar_test OWNER denar_user;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE denar_dev TO denar_user;
GRANT ALL PRIVILEGES ON DATABASE denar_test TO denar_user;

# Exit psql
\q
```

**Option C: Run the provided SQL script**
```bash
# From your project root directory
psql -h localhost -U postgres -f setup-database.sql
```

### 2. Configure Environment Variables
```bash
# Navigate to API directory
cd /Users/vladimirbojadzi/dev/denar/api

# Copy environment template
cp .env.example .env

# The .env file is already configured with:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=denar_dev
DB_USER=denar_user
DB_PASSWORD=denar_password_2024
DB_DIALECT=postgres
```

### 3. Set up the Denar API
```bash
# Install dependencies
npm install

# Run database migrations (creates all tables)
npm run migrate

# Seed database with Macedonian banks data
npm run seed

# Start the development server
npm run dev
```

### 4. Test Connection
```bash
# Test connection to development database
psql -h localhost -U denar_user -d denar_dev

# If successful, you should see:
# denar_dev=>

# List tables to verify setup
\dt

# Exit
\q
```

### 5. Verify API is Running
Open your browser and go to:
- http://localhost:3000/health (should show API health status)
- http://localhost:3000/api/banks (should list Macedonian banks)

### 6. Next Steps for Development
Once everything is running:
1. Test user registration: `POST /api/auth/register`
2. Test bank account linking: `GET /api/banks/link/start/:bankId`
3. Test mock payments between users
4. When you get real TPP access, change `MOCK_BANKING_API=false` in .env

## Database Management Tools

### 1. pgAdmin (Full-featured GUI)
```bash
# Install via Homebrew
brew install --cask pgadmin4

# Or download from: https://www.pgadmin.org/download/pgadmin-4-macos/
```

**Setup pgAdmin:**
1. Launch pgAdmin
2. Add new server:
   - Name: Denar Development
   - Host: localhost
   - Port: 5432
   - Username: denar_user
   - Password: your_secure_password

### 2. TablePlus (Modern GUI - Paid)
```bash
# Install via Homebrew
brew install --cask tableplus

# Or download from: https://tableplus.com/
```

### 3. DBeaver (Free, Cross-platform)
```bash
# Install via Homebrew
brew install --cask dbeaver-community

# Or download from: https://dbeaver.io/
```

### 4. Command Line Tools
```bash
# Install PostgreSQL client tools
brew install libpq

# Add to PATH for psql command
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
```

## Denar Application Database Setup

### 1. Install Dependencies
```bash
cd /Users/vladimirbojadzi/dev/denar/api
npm install
```

### 2. Configure Sequelize
```bash
# Create .env file from example
cp .env.example .env

# Edit .env file with your database credentials
nano .env
```

### 3. Run Migrations
```bash
# Install Sequelize CLI globally
npm install -g sequelize-cli

# Generate migration files (if needed)
npx sequelize-cli migration:generate --name create-initial-schema

# Run migrations to create tables
npm run migrate
```

### 4. Seed Database (Optional)
```bash
# Create seed data
npm run seed
```

## Common PostgreSQL Commands

### Database Management
```sql
-- List all databases
\l

-- Connect to a database
\c database_name

-- List all tables in current database
\dt

-- Describe a table structure
\d table_name

-- List all users
\du

-- Show current database and user
SELECT current_database(), current_user;
```

### User Management
```sql
-- Create new user
CREATE USER username WITH PASSWORD 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dbname TO username;

-- Change user password
ALTER USER username PASSWORD 'newpassword';

-- Drop user
DROP USER username;
```

### Backup and Restore
```bash
# Backup database
pg_dump -h localhost -U denar_user -d denar_dev > denar_backup.sql

# Restore database
psql -h localhost -U denar_user -d denar_dev < denar_backup.sql

# Backup with compression
pg_dump -h localhost -U denar_user -d denar_dev | gzip > denar_backup.sql.gz

# Restore from compressed backup
gunzip -c denar_backup.sql.gz | psql -h localhost -U denar_user -d denar_dev
```

## Performance and Security

### 1. Security Configuration
```sql
-- Enable SSL (in postgresql.conf)
-- ssl = on

-- Set password encryption
-- password_encryption = scram-sha-256

-- Configure authentication (in pg_hba.conf)
-- local   all   all   scram-sha-256
-- host    all   all   127.0.0.1/32   scram-sha-256
```

### 2. Performance Tuning
```sql
-- Show current settings
SHOW shared_buffers;
SHOW effective_cache_size;

-- Basic tuning (in postgresql.conf)
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
-- maintenance_work_mem = 64MB
-- checkpoint_completion_target = 0.9
```

### 3. Monitoring
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Show running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Database size
SELECT pg_size_pretty(pg_database_size('denar_dev'));
```

## Troubleshooting

### Common Issues

**1. PostgreSQL won't start:**
```bash
# Check if any PostgreSQL processes are running
ps aux | grep postgres

# Stop any existing processes
brew services stop postgresql@15

# Remove lock files
rm -f /opt/homebrew/var/postgresql@15/postmaster.pid

# Restart service
brew services start postgresql@15
```

**2. Connection refused:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Check PostgreSQL logs
tail -f /opt/homebrew/var/log/postgresql@15.log

# Verify configuration
psql -h localhost -p 5432 -U postgres -c "SELECT version();"
```

**3. Permission denied:**
```bash
# Reset PostgreSQL data directory permissions
sudo chown -R $(whoami) /opt/homebrew/var/postgresql@15/

# Initialize database if needed
initdb -D /opt/homebrew/var/postgresql@15/
```

**4. Port already in use:**
```bash
# Check what's using port 5432
lsof -i :5432

# Kill process if needed
kill -9 <PID>

# Or change PostgreSQL port in postgresql.conf
# port = 5433
```

## Development Workflow

### Daily Development
```bash
# Start PostgreSQL (if not auto-starting)
brew services start postgresql@15

# Connect to development database
psql -h localhost -U denar_user -d denar_dev

# Run your Denar API
cd /Users/vladimirbojadzi/dev/denar/api
npm run dev
```

### Database Migrations
```bash
# Create new migration
npx sequelize-cli migration:generate --name add-new-feature

# Run pending migrations
npm run migrate

# Rollback last migration
npm run migrate:undo
```

### Testing
```bash
# Run tests with test database
NODE_ENV=test npm test

# Reset test database
NODE_ENV=test npm run migrate:undo:all
NODE_ENV=test npm run migrate
```

## Alternative: SQL Server Management Studio (SSMS)

**Note**: SSMS is designed for Microsoft SQL Server, not PostgreSQL. However, if you prefer a Windows-like experience:

### Azure Data Studio (Cross-platform alternative)
```bash
# Install Azure Data Studio
brew install --cask azure-data-studio

# Install PostgreSQL extension within Azure Data Studio
# Extensions > PostgreSQL > Install
```

### Navicat (Commercial)
```bash
# Premium database management tool
brew install --cask navicat-for-postgresql

# 14-day free trial, then paid license required
```

## Recommendation for Denar

For Denar development, I recommend:

1. **PostgreSQL Installation**: Homebrew method (most reliable)
2. **GUI Tool**: pgAdmin (free, full-featured) or TablePlus (modern, paid)
3. **Development**: Use command line for daily tasks, GUI for complex queries
4. **Production**: Consider managed PostgreSQL (AWS RDS, DigitalOcean, etc.)

PostgreSQL is the better choice over SQL Server for your use case because:
- Better JSON support (for storing bank API configurations)
- Excellent performance for financial transactions
- Strong ACID compliance for money transfers
- Cost-effective (open source)
- Better integration with Node.js ecosystem

## Next Steps

1. Choose installation method (Homebrew recommended)
2. Install PostgreSQL and create databases
3. Set up your preferred GUI tool
4. Configure the Denar API with database credentials
5. Run initial migrations to create tables