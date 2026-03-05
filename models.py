"""
Database models for Restaurant Inventory AI
Using SQLAlchemy ORM for both SQLite and PostgreSQL support
"""

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json

db = SQLAlchemy()


class User(db.Model):
    """User account model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), unique=True, index=True)  # E.164 format: +1-555-0123
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    restaurant_name = db.Column(db.String(255))
    role = db.Column(db.String(20), default='manager', nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    location = db.relationship('Location', backref='user', uselist=False, cascade='all, delete-orphan')
    sales_records = db.relationship('SalesRecord', backref='user', cascade='all, delete-orphan')
    forecasts = db.relationship('Forecast', backref='user', cascade='all, delete-orphan')
    alert_preferences = db.relationship('AlertPreference', backref='user', uselist=False, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def get_full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.get_full_name(),
            'restaurant': self.restaurant_name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'location': self.location.to_dict() if self.location else None,
            'units': json.loads(self.location.units_json) if self.location and self.location.units_json else {}
        }
    
    def __repr__(self):
        return f'<User {self.email}>'


class Location(db.Model):
    """User location and unit preferences"""
    __tablename__ = 'locations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    country = db.Column(db.String(5))  # ISO 3166-1 alpha-2 code
    city = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    units_json = db.Column(db.Text)  # JSON: {weight, volume, currency}
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'country': self.country,
            'city': self.city,
            'latitude': self.latitude,
            'longitude': self.longitude
        }
    
    def get_units(self):
        """Parse units from JSON"""
        return json.loads(self.units_json) if self.units_json else {}
    
    def set_units(self, units_dict):
        """Store units as JSON"""
        self.units_json = json.dumps(units_dict)
    
    def __repr__(self):
        return f'<Location {self.country}/{self.city}>'


class SalesRecord(db.Model):
    """Individual sales record"""
    __tablename__ = 'sales_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    ingredient = db.Column(db.String(255), nullable=False, index=True)
    quantity_sold = db.Column(db.Float, nullable=False)
    sale_date = db.Column(db.Date, nullable=False, index=True)
    notes = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    db.Index('idx_user_ingredient_date', 'user_id', 'ingredient', 'sale_date')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'ingredient': self.ingredient,
            'quantity_sold': self.quantity_sold,
            'date': self.sale_date.isoformat(),
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<SalesRecord {self.ingredient} {self.quantity_sold}>'


class Forecast(db.Model):
    """Saved forecast results"""
    __tablename__ = 'forecasts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    ingredient = db.Column(db.String(255), nullable=False, index=True)
    forecast_days = db.Column(db.Integer, default=7)
    model_used = db.Column(db.String(50))  # Prophet, ARIMA, LSTM, etc
    confidence = db.Column(db.Float)  # 0.0-1.0
    
    # Predictions stored as JSON for flexibility
    daily_predictions_json = db.Column(db.Text)  # [{day: 1, quantity: 50.2, ...}]
    confidence_intervals_json = db.Column(db.Text)  # {upper: [...], lower: [...]}
    
    # Error metrics
    rmse = db.Column(db.Float)
    mae = db.Column(db.Float)
    
    # Optimization results
    reorder_point = db.Column(db.Float)
    safety_stock = db.Column(db.Float)
    recommended_order_qty = db.Column(db.Float)
    weekly_total = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    expires_at = db.Column(db.DateTime)  # TTL: forecasts expire after 24 hours
    
    db.Index('idx_user_ingredient_created', 'user_id', 'ingredient', 'created_at')
    
    def get_daily_predictions(self):
        """Parse daily predictions from JSON"""
        return json.loads(self.daily_predictions_json) if self.daily_predictions_json else []
    
    def set_daily_predictions(self, predictions):
        """Store daily predictions as JSON"""
        self.daily_predictions_json = json.dumps(predictions)
    
    def get_confidence_intervals(self):
        """Parse confidence intervals from JSON"""
        return json.loads(self.confidence_intervals_json) if self.confidence_intervals_json else {}
    
    def set_confidence_intervals(self, intervals):
        """Store confidence intervals as JSON"""
        self.confidence_intervals_json = json.dumps(intervals)
    
    def is_expired(self):
        """Check if forecast has expired"""
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return True
        return False
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'ingredient': self.ingredient,
            'model_used': self.model_used,
            'confidence': self.confidence,
            'daily_predictions': self.get_daily_predictions(),
            'confidence_intervals': self.get_confidence_intervals(),
            'error_metrics': {
                'rmse': self.rmse,
                'mae': self.mae
            },
            'inventory_optimization': {
                'reorder_point': self.reorder_point,
                'safety_stock': self.safety_stock,
                'recommended_order_qty': self.recommended_order_qty,
                'weekly_total': self.weekly_total
            },
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Forecast {self.ingredient} {self.model_used}>'


class AlertPreference(db.Model):
    """User alert notification preferences"""
    __tablename__ = 'alert_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    
    # Channel preferences
    email_enabled = db.Column(db.Boolean, default=True)
    email_address = db.Column(db.String(255))
    sms_enabled = db.Column(db.Boolean, default=False)
    phone_number = db.Column(db.String(20))  # E.164 format: +1-555-0123
    
    # Alert settings
    threshold_percentage = db.Column(db.Integer, default=25)  # Alert at 25% of reorder point
    reorder_point_auto_calculate = db.Column(db.Boolean, default=True)
    
    # Contact info
    contact_name = db.Column(db.String(100))
    contact_email_backup = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'email': {
                'enabled': self.email_enabled,
                'email_address': self.email_address
            },
            'sms': {
                'enabled': self.sms_enabled,
                'phone_number': self.phone_number
            },
            'threshold_percentage': self.threshold_percentage,
            'reorder_point_auto_calculate': self.reorder_point_auto_calculate,
            'contact_name': self.contact_name
        }
    
    def __repr__(self):
        return f'<AlertPreference user_id={self.user_id}>'


class AlertHistory(db.Model):
    """Audit trail of sent alerts"""
    __tablename__ = 'alert_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    ingredient = db.Column(db.String(255), nullable=False)
    alert_type = db.Column(db.String(50))  # 'low_stock', 'reorder_reminder', etc
    channel = db.Column(db.String(50))  # 'email', 'sms', 'dashboard'
    
    # Alert details
    current_stock = db.Column(db.Float)
    reorder_point = db.Column(db.Float)
    status = db.Column(db.String(20), default='sent')  # 'sent', 'failed', 'bounced'
    error_message = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    db.Index('idx_user_ingredient_created', 'user_id', 'ingredient', 'created_at')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'ingredient': self.ingredient,
            'alert_type': self.alert_type,
            'channel': self.channel,
            'current_stock': self.current_stock,
            'reorder_point': self.reorder_point,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<AlertHistory {self.ingredient} {self.channel}>'


class IngredientMaster(db.Model):
    """Master list of ingredients for a user"""
    __tablename__ = 'ingredient_master'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    ingredient = db.Column(db.String(255), nullable=False)
    
    # Ingredient metadata
    unit_of_measure = db.Column(db.String(50))  # 'lbs', 'kg', 'pieces', etc
    current_stock = db.Column(db.Float)
    reorder_point = db.Column(db.Float)
    supplier = db.Column(db.String(255))
    supplier_lead_time_days = db.Column(db.Integer)
    cost_per_unit = db.Column(db.Float)
    
    # Tracking
    last_reorder_date = db.Column(db.Date)
    last_forecast_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    db.Index('idx_user_ingredient', 'user_id', 'ingredient', unique=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'ingredient': self.ingredient,
            'unit_of_measure': self.unit_of_measure,
            'current_stock': self.current_stock,
            'reorder_point': self.reorder_point,
            'supplier': self.supplier,
            'supplier_lead_time_days': self.supplier_lead_time_days,
            'cost_per_unit': self.cost_per_unit,
            'last_reorder_date': self.last_reorder_date.isoformat() if self.last_reorder_date else None,
            'last_forecast_date': self.last_forecast_date.isoformat() if self.last_forecast_date else None
        }
    
    def __repr__(self):
        return f'<IngredientMaster {self.ingredient}>'
