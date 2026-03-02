# PostgreSQL Setup Instructions for Restaurant AI Application

## Step 1: Download and Install PostgreSQL

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the latest version of PostgreSQL for Windows
   - Or use the installer from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Run the Installer:**
   - Execute the downloaded installer
   - **Important:** During installation, set a password for the PostgreSQL superuser (postgres)
   - Remember this password - you'll need it!
   - Default port: 5432 (keep this unless you have a conflict)
   - Install pgAdmin 4 (recommended for database management)

## Step 2: Create the Database

### Option A: Using pgAdmin (GUI)
1. Open pgAdmin 4
2. Connect to PostgreSQL server (enter your postgres password)
3. Right-click on "Databases" → Create → Database
4. Name: `restaurant_ai_db`
5. Click "Save"

### Option B: Using Command Line
```bash
# Open Command Prompt or PowerShell as Administrator
# Navigate to PostgreSQL bin directory (example path):
cd "C:\Program Files\PostgreSQL\16\bin"

# Create the database
psql -U postgres -c "CREATE DATABASE restaurant_ai_db;"
```

## Step 3: Update Configuration

Your `.env` file has been configured with:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/restaurant_ai_db
```

**If you used a different password during installation:**
- Open `.env` file
- Update the DATABASE_URL:
  ```
  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/restaurant_ai_db
  ```

## Step 4: Initialize Database Tables

Run the initialization script to create all tables:
```bash
python init_db.py
```

## Step 5: Restart Your Application

If your app is running, stop it (Ctrl+C) and restart:
```bash
python app.py
```

## Verification

Your app is now connected to PostgreSQL! The database includes:
- Users table
- Locations table
- Sales records table
- Forecasts table
- Alert preferences and history
- Ingredient master data

## Troubleshooting

**Connection Error:**
- Verify PostgreSQL service is running (Services → postgresql-x64-16)
- Check if password in DATABASE_URL matches your postgres user password
- Ensure port 5432 is not blocked by firewall

**Import Error (psycopg2):**
```bash
pip install psycopg2-binary
```

**Database Doesn't Exist:**
```bash
createdb -U postgres restaurant_ai_db
```
