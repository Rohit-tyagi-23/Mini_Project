-- PostgreSQL Setup Script for Restaurant AI Application
-- Run this script after installing PostgreSQL

-- Create the database
CREATE DATABASE restaurant_ai_db;

-- Connect to the database (you'll need to run: \c restaurant_ai_db)

-- Create a dedicated user (optional, for better security)
-- Uncomment the following lines if you want a separate user:
-- CREATE USER restaurant_ai_user WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE restaurant_ai_db TO restaurant_ai_user;

-- The tables will be created automatically by Flask-SQLAlchemy
-- when you run init_db.py or start the application for the first time
