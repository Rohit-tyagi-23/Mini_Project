#!/usr/bin/env python
"""
Database initialization and migration script
Run this once after setting up the application

Usage:
    python init_db.py                    # Initialize SQLite database
    python init_db.py --seed-data        # Initialize with sample data
    python init_db.py --reset            # Delete and recreate tables
    python init_db.py --migrate          # Run migrations (if exists)
"""

import os
import sys
import argparse
import importlib.util as _ilu
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, PROJECT_ROOT)

_spec = _ilu.spec_from_file_location('project_app_module', os.path.join(PROJECT_ROOT, 'app.py'))
_project_app = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_project_app)

app = _project_app.app
db = _project_app.db
User = _project_app.User
Location = _project_app.Location
SalesRecord = _project_app.SalesRecord
Forecast = _project_app.Forecast
AlertPreference = _project_app.AlertPreference
AlertHistory = _project_app.AlertHistory
IngredientMaster = _project_app.IngredientMaster


def init_database():
    """Initialize database tables"""
    print("🔄 Initializing database...")
    with app.app_context():
        db.create_all()
        print("✓ Database tables created successfully")


def seed_sample_data():
    """Add sample data for testing"""
    print("\n📊 Adding sample data...")
    with app.app_context():
        # Check if demo user already exists
        demo_user = User.query.filter_by(email='demo@restaurant.com').first()
        if demo_user:
            print("ℹ Demo user already exists, skipping seed data")
            return
        
        # Create demo user
        demo_user = User(
            email='demo@restaurant.com',
            first_name='Demo',
            last_name='Manager',
            restaurant_name='Demo Restaurant'
        )
        demo_user.set_password('DemoGuest123!')
        db.session.add(demo_user)
        db.session.flush()
        
        # Add location
        location = Location(
            user_id=demo_user.id,
            country='US',
            city='New York',
            latitude=40.7128,
            longitude=-74.0060
        )
        location.set_units({
            'weight': 'lbs',
            'volume': 'fl oz',
            'currency': 'USD'
        })
        db.session.add(location)
        
        # Add alert preferences
        alert_prefs = AlertPreference(
            user_id=demo_user.id,
            email_enabled=True,
            email_address='demo@restaurant.com',
            sms_enabled=False,
            threshold_percentage=25
        )
        db.session.add(alert_prefs)
        
        # Add sample ingredients
        ingredients_data = [
            {'name': 'Tomato', 'uom': 'lbs', 'current_stock': 50.5, 'reorder_point': 145.5},
            {'name': 'Mozzarella', 'uom': 'lbs', 'current_stock': 30.2, 'reorder_point': 100.0},
            {'name': 'Olive Oil', 'uom': 'fl oz', 'current_stock': 200.0, 'reorder_point': 500.0},
            {'name': 'Basil', 'uom': 'lbs', 'current_stock': 5.0, 'reorder_point': 15.0},
            {'name': 'Garlic', 'uom': 'lbs', 'current_stock': 20.0, 'reorder_point': 50.0},
        ]
        
        for ing_data in ingredients_data:
            ingredient = IngredientMaster(
                user_id=demo_user.id,
                ingredient=ing_data['name'],
                unit_of_measure=ing_data['uom'],
                current_stock=ing_data['current_stock'],
                reorder_point=ing_data['reorder_point']
            )
            db.session.add(ingredient)
        
        db.session.flush()
        
        # Add sample sales records (last 30 days)
        sales_data = [
            {'ingredient': 'Tomato', 'quantity': 50.5},
            {'ingredient': 'Tomato', 'quantity': 48.3},
            {'ingredient': 'Tomato', 'quantity': 52.1},
            {'ingredient': 'Mozzarella', 'quantity': 30.2},
            {'ingredient': 'Mozzarella', 'quantity': 31.5},
            {'ingredient': 'Mozzarella', 'quantity': 29.8},
            {'ingredient': 'Olive Oil', 'quantity': 25.0},
            {'ingredient': 'Olive Oil', 'quantity': 22.3},
            {'ingredient': 'Basil', 'quantity': 3.5},
            {'ingredient': 'Basil', 'quantity': 4.2},
            {'ingredient': 'Garlic', 'quantity': 15.0},
            {'ingredient': 'Garlic', 'quantity': 14.5},
        ]
        
        base_date = datetime.utcnow().date()
        for i, sale_data in enumerate(sales_data):
            sale_record = SalesRecord(
                user_id=demo_user.id,
                ingredient=sale_data['ingredient'],
                quantity_sold=sale_data['quantity'],
                sale_date=base_date - timedelta(days=30 - (i * 2))
            )
            db.session.add(sale_record)
        
        db.session.commit()
        print("✓ Sample data added successfully")
        print(f"  - Demo user: demo@restaurant.com / DemoGuest123!")
        print(f"  - Ingredients: {len(ingredients_data)}")
        print(f"  - Sales records: {len(sales_data)}")


def reset_database():
    """Delete all tables and recreate"""
    print("\n⚠️  RESETTING DATABASE...")
    response = input("This will delete all data. Type 'YES' to confirm: ")
    
    if response != 'YES':
        print("Reset cancelled")
        return
    
    with app.app_context():
        db.drop_all()
        print("✓ All tables dropped")
        
        db.create_all()
        print("✓ Database tables recreated")
        
        print("\n📊 Would you like to seed sample data? (y/n): ", end='')
        if input().lower() == 'y':
            seed_sample_data()


def show_database_info():
    """Display database information"""
    print("\n📊 DATABASE INFORMATION")
    print("=" * 50)
    
    db_url = os.getenv('DATABASE_URL', 'sqlite:///restaurant_ai.db')
    print(f"Database URL: {db_url}")
    
    if db_url.startswith('sqlite'):
        db_file = db_url.replace('sqlite:///', '')
        if os.path.exists(db_file):
            size = os.path.getsize(db_file)
            print(f"Database file: {db_file}")
            print(f"File size: {size} bytes ({size / 1024:.2f} KB)")
        else:
            print(f"Database file not found: {db_file}")
    
    with app.app_context():
        try:
            # Count records
            user_count = User.query.count()
            sales_count = SalesRecord.query.count()
            forecast_count = Forecast.query.count()
            alert_count = AlertHistory.query.count()
            ingredient_count = IngredientMaster.query.count()
            
            print("\n📈 TABLE STATISTICS:")
            print(f"  Users: {user_count}")
            print(f"  Sales Records: {sales_count}")
            print(f"  Forecasts: {forecast_count}")
            print(f"  Alert History: {alert_count}")
            print(f"  Ingredients: {ingredient_count}")
            
            if user_count > 0:
                print("\n👥 USERS:")
                users = User.query.all()
                for user in users:
                    location = user.location
                    loc_str = f"{location.country}/{location.city}" if location else "No location"
                    print(f"  - {user.email} ({user.restaurant_name}) - {loc_str}")
        
        except Exception as e:
            print(f"Error reading database: {e}")
            print("Database may not be initialized yet")


def check_database():
    """Check database connectivity"""
    print("\n🔍 Checking database connectivity...")
    with app.app_context():
        try:
            # Try a simple query
            result = db.session.execute(db.text('SELECT 1'))
            print("✓ Database connection successful")
            show_database_info()
            return True
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            return False


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description='Database initialization and management for Restaurant Inventory AI'
    )
    parser.add_argument(
        '--init',
        action='store_true',
        help='Initialize database tables'
    )
    parser.add_argument(
        '--seed-data',
        action='store_true',
        help='Add sample data after initialization'
    )
    parser.add_argument(
        '--reset',
        action='store_true',
        help='Delete and recreate all tables'
    )
    parser.add_argument(
        '--check',
        action='store_true',
        help='Check database connectivity and show info'
    )
    parser.add_argument(
        '--info',
        action='store_true',
        help='Show database information'
    )
    
    args = parser.parse_args()
    
    # Default action if no arguments
    if not any([args.init, args.seed_data, args.reset, args.check, args.info]):
        print("🚀 RESTAURANT INVENTORY AI - Database Setup\n")
        print("Select an option:")
        print("  1. Initialize database")
        print("  2. Reset database (delete all data)")
        print("  3. Check database")
        print("  4. Exit\n")
        
        choice = input("Enter your choice (1-4): ").strip()
        
        if choice == '1':
            init_database()
            print("\n✅ Would you like to seed sample data? (y/n): ", end='')
            if input().lower() == 'y':
                seed_sample_data()
        elif choice == '2':
            reset_database()
        elif choice == '3':
            check_database()
        elif choice != '4':
            print("Invalid choice")
    else:
        # Process command-line arguments
        if args.init:
            init_database()
            if args.seed_data:
                seed_sample_data()
        
        if args.reset:
            reset_database()
        
        if args.check or args.info:
            check_database()
    
    print("\n✨ Done!")


if __name__ == '__main__':
    main()
