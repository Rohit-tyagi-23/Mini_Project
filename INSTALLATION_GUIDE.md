# Installation & Setup Guide

Complete step-by-step instructions for setting up Restaurant Inventory AI locally or in production.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Local Development Setup](#local-development-setup)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Database Initialization](#database-initialization)
6. [Email & SMS Setup](#email--sms-setup)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: Windows, macOS, or Linux
- **Python**: 3.10 or higher
- **RAM**: 2GB (4GB+ recommended)
- **Disk**: 500MB free space
- **Internet**: Required for OAuth and Twilio (optional)

### Dependencies Overview
- **Framework**: Flask 3.0+
- **Data Processing**: Pandas, NumPy, scikit-learn
- **ML Models**: TensorFlow/Keras, Prophet, statsmodels
- **Communications**: Flask-Mail, Twilio
- **Environment**: Python-dotenv

---

## Local Development Setup

### Step 1: Clone/Download Project

```bash
# If from GitHub
git clone https://github.com/your-org/restaurant-inventory-ai.git
cd restaurant-inventory-ai

# Or if you have the zip file
unzip restaurant-inventory-ai.zip
cd restaurant-inventory-ai
```

### Step 2: Create Python Virtual Environment

#### Windows (PowerShell/CMD)
```powershell
# Using venv (built-in)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Or using conda (if installed)
conda create -n resto_ai python=3.11
conda activate resto_ai
```

#### macOS/Linux
```bash
# Using venv
python3 -m venv venv
source venv/bin/activate

# Or using conda
conda create -n resto_ai python=3.11
conda activate resto_ai
```

**Verify activation:**
```bash
python --version  # Should be 3.10+
which python      # Should show venv path
```

### Step 3: Install Dependencies

```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Install all required packages
pip install -r requirements.txt
```

**Installation time:** 5-15 minutes (depends on internet speed and TensorFlow availability)

**Expected packages installed:**
- flask (web framework)
- pandas, numpy (data processing)
- scikit-learn (ML utilities)
- prophet, statsmodels (time series)
- tensorflow, keras (deep learning)
- flask-mail (email)
- twilio (SMS)
- python-dotenv (configuration)

### Step 4: Verify Installation

```bash
# Test core imports
python -c "import flask, pandas, prophet, tensorflow; print('✓ All imports successful')"

# Or run a quick test
python -c "
from model import forecast_demand
print('✓ Model module loaded successfully')
"
```

---

## Configuration

### Step 1: Create Environment File

Copy the example and customize:

```bash
# Create .env from template
cp .env.example .env

# Or create manually (see below)
```

### Step 2: Edit .env File

Create/edit `c:\Restaurant\inventory_ai_project\.env`:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-change-in-production
APP_HOST=0.0.0.0
APP_PORT=5000

# Email Configuration (Gmail example)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=noreply@restaurantai.com

# SMS Configuration (Twilio - optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1-555-0100

# OAuth Configuration (optional - future feature)
GOOGLE_CLIENT_ID=your-google-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret

# Database (for future production)
DATABASE_URL=postgresql://user:pass@localhost/resto_db
REDIS_URL=redis://localhost:6379/0
```

### Step 3: Gmail Setup (for Email Alerts)

**Option A: Gmail App Password (Recommended)**

1. Enable 2-Factor Authentication on Google Account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer"
4. Copy the generated 16-character password
5. Add to .env:
```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

**Option B: Custom SMTP Server**

```env
MAIL_SERVER=smtp.your-server.com
MAIL_PORT=587
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
```

### Step 4: Twilio Setup (for SMS - Optional)

1. Create account at [twilio.com](https://www.twilio.com)
2. Verify phone number
3. Get credentials from dashboard
4. Add to .env:
```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1-555-0100
```

---

## Running the Application

### Development Server

```bash
# Activate virtual environment (if not already)
# Windows
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

# Start Flask development server
python app.py
```

**Expected output:**
```
WARNING in app.run_werkzeug: This is a development server. Do not use it in production. Use a production WSGI server instead.
 * Running on http://0.0.0.0:5000/ (Press CTRL+C to quit)
 * Restarting with reloader
 * Debugger is active!
```

**Access the app:**
- Open browser: `http://localhost:5000`
- Landing page should load

### Troubleshooting Startup Issues

**Port 5000 already in use:**
```bash
# Windows - find process using port
netstat -ano | findstr :5000

# Kill process
taskkill /PID <process-id> /F

# Or change port in app.py:
# app.run(debug=True, host='0.0.0.0', port=5001)
```

**Module import errors:**
```bash
# Reinstall specific package
pip install --force-reinstall tensorflow

# Or install minimal ML stack
pip install flask pandas numpy
```

---

## Database Initialization

### Current Setup (In-Memory)

The application uses an in-memory user database defined in `app.py`:

```python
users_db = {
    "demo@restaurant.com": {
        "password": "demo123",
        "name": "Demo Manager",
        "restaurant": "Demo Restaurant",
        "location": {"country": "US"},
        "units": {"weight": "lbs", "volume": "fl oz", "currency": "USD"},
        "alert_preferences": {}
    }
}
```

**Default test credentials:**
- Email: `demo@restaurant.com`
- Password: `demo123`

### Sales Data Format

Sample `data/sales_data.csv`:
```csv
date,ingredient,quantity_sold
2024-01-01,Tomato,50.5
2024-01-01,Mozzarella,30.2
2024-01-02,Tomato,48.3
2024-01-02,Mozzarella,31.5
```

**Required columns:**
- `date`: YYYY-MM-DD format
- `ingredient`: String (ingredient name)
- `quantity_sold`: Float (daily quantity)

**To add test data:**
```bash
# Simply edit data/sales_data.csv
# Or test via dashboard: Add Sale Records
```

### Production Database Setup (Recommended)

Replace in-memory database with PostgreSQL:

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    restaurant VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create location table
CREATE TABLE locations (
    user_id INTEGER PRIMARY KEY,
    country VARCHAR(5),
    city VARCHAR(100),
    latitude FLOAT,
    longitude FLOAT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create sales history table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    ingredient VARCHAR(100),
    quantity_sold FLOAT,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX (user_id, date)
);

-- Create alert preferences table
CREATE TABLE alert_preferences (
    user_id INTEGER PRIMARY KEY,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    threshold_percentage INTEGER DEFAULT 25,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Update app.py for PostgreSQL:**
```python
from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
db.init_app(app)
```

See [ARCHITECTURE.md](ARCHITECTURE.md#scalability--future-architecture) for more details.

---

## Email & SMS Setup

### Test Email Configuration

```python
# In app.py or test script
from flask import Flask
from flask_mail import Mail, Message

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'
app.config['MAIL_PASSWORD'] = 'your-app-password'

mail = Mail(app)

# Send test email
with app.app_context():
    msg = Message(
        'Test Alert',
        recipients=['recipient@example.com'],
        body='This is a test email'
    )
    mail.send(msg)
```

### Test SMS Configuration

```python
from twilio.rest import Client

account_sid = "your-account-sid"
auth_token = "your-auth-token"
client = Client(account_sid, auth_token)

# Send test SMS
message = client.messages.create(
    body="Test SMS from Restaurant AI",
    from_="+1-555-0100",
    to="+1-555-0123"
)
print(f"SMS sent: {message.sid}")
```

### Verify via Dashboard

1. Log in with demo credentials
2. Go to Settings → Alert Preferences
3. Toggle Email/SMS
4. Click "Test Email" or "Test SMS"
5. Check your inbox/phone

---

## Production Deployment

### Option 1: Gunicorn (Linux/macOS)

```bash
# Install Gunicorn
pip install gunicorn

# Run with 4 workers
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Or with configuration file (gunicorn.conf.py)
gunicorn --config gunicorn.conf.py app:app
```

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
ENV FLASK_ENV=production

EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

Build and run:
```bash
# Build image
docker build -t restaurant-ai:latest .

# Run container
docker run -p 5000:5000 \
  -e MAIL_USERNAME=your@email.com \
  -e MAIL_PASSWORD=your-app-password \
  --name resto-ai \
  restaurant-ai:latest

# Docker Compose
docker-compose up -d
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      FLASK_ENV: production
      MAIL_SERVER: smtp.gmail.com
      MAIL_PORT: 587
      MAIL_USERNAME: ${MAIL_USERNAME}
      MAIL_PASSWORD: ${MAIL_PASSWORD}
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: resto_db
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
```

### Option 3: Cloud Platforms

#### Heroku
```bash
# Install Heroku CLI
# Create Procfile
web: gunicorn app:app

# Deploy
heroku create restaurant-inventory-ai
heroku config:set MAIL_USERNAME=your@email.com
heroku config:set MAIL_PASSWORD=your-password
git push heroku main
```

#### AWS EC2
```bash
# Launch Ubuntu instance
# SSH into instance
ssh -i key.pem ec2-user@instance-ip

# Install dependencies
sudo apt update && sudo apt install python3-pip python3-venv

# Clone and setup
git clone <repo>
cd restaurant-inventory-ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run with systemd service
sudo nano /etc/systemd/system/resto-ai.service
```

### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /app/static/;
        expires 30d;
    }
}
```

---

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| FLASK_ENV | No | development | Set to "production" for deployments |
| FLASK_DEBUG | No | True | Disable in production |
| SECRET_KEY | Yes | your-secret | Change from default |
| MAIL_SERVER | For alerts | smtp.gmail.com | Email service SMTP |
| MAIL_USERNAME | For alerts | user@gmail.com | Email service login |
| MAIL_PASSWORD | For alerts | xxxx-xxxx | Gmail app password |
| TWILIO_ACCOUNT_SID | For SMS | AC... | Twilio dashboard |
| TWILIO_AUTH_TOKEN | For SMS | ... | Twilio dashboard |
| TWILIO_PHONE_NUMBER | For SMS | +1-555-0100 | Your Twilio number |
| DATABASE_URL | For prod DB | postgresql://... | Production database |
| REDIS_URL | For caching | redis://localhost | Cache backend |

---

## Verification Checklist

After setup, verify:

- [ ] Virtual environment activated
- [ ] All packages installed (`pip list`)
- [ ] .env file created with credentials
- [ ] Flask server starts without errors
- [ ] Can access http://localhost:5000
- [ ] Can log in with demo credentials
- [ ] Dashboard loads with sample data
- [ ] Can submit a forecast request
- [ ] ML model returns predictions
- [ ] Alert preferences accessible
- [ ] Test email/SMS sends (if configured)

---

## Troubleshooting

### Common Issues

#### 1. TensorFlow/Keras Installation Fails
```bash
# Solution 1: Install CPU version
pip install tensorflow-cpu

# Solution 2: Use conda instead
conda install tensorflow

# Solution 3: Skip LSTM (use other models)
# Edit model.py, set LSTM_AVAILABLE = False
```

#### 2. Prophet Installation Issues
```bash
# Windows - may need build tools
pip install --upgrade pystan
pip install prophet

# Or use conda
conda install -c conda-forge prophet
```

#### 3. "ModuleNotFoundError: No module named 'sklearn'"
```bash
# Reinstall scikit-learn
pip install --force-reinstall scikit-learn
```

#### 4. Email Not Sending
```bash
# Check credentials (copy from .env)
# Test SMTP connection
python -c "
import smtplib
smtp = smtplib.SMTP_SSL('smtp.gmail.com', 587)
smtp.login('your@email.com', 'app-password')
print('✓ Connection successful')
"

# Common causes:
# - Wrong app password (not Gmail password)
# - 2FA not enabled
# - Less secure apps setting disabled
```

#### 5. Port 5000 Already in Use
```bash
# Windows
netstat -ano | find "5000"
taskkill /PID <pid> /F

# macOS/Linux
lsof -i :5000
kill -9 <pid>

# Or change port in app.py
app.run(debug=True, port=5001)
```

#### 6. "Insufficient data for forecasting"
```bash
# Add more sample data to data/sales_data.csv
# Need at least 10 records per ingredient
# 20+ records for LSTM model
```

#### 7. Forecast Returns Zero Confidence
```bash
# Check data format in CSV
# Ensure date is YYYY-MM-DD
# Ensure quantity_sold is numeric (not text)
# Check for duplicate or missing values
```

---

## Next Steps

1. **Review Documentation:**
   - [README.md](README.md) - Feature overview
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design
   - [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
   - [FEATURES_GUIDE.md](FEATURES_GUIDE.md) - Feature walkthrough

2. **Configure for Your Use:**
   - Update sample data in `data/sales_data.csv`
   - Add users to `users_db` in `app.py`
   - Configure email/SMS alerts
   - Customize unit standards for your region

3. **Deploy to Production:**
   - Use Gunicorn or Docker
   - Set up database (PostgreSQL)
   - Add HTTPS/SSL certificates
   - Configure domain and reverse proxy

4. **Monitor & Maintain:**
   - Check logs regularly
   - Monitor API performance
   - Update dependencies monthly
   - Backup user data and configurations

---

## Support

For issues not covered here:
- Check browser console: F12 → Console
- Review server terminal output
- Check environment variables: `pip show -f <package>`
- Review code comments in `app.py` and `model.py`
