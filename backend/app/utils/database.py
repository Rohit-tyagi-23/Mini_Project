"""Database utility functions."""
from sqlalchemy import inspect, text


def ensure_database_schema(db):
    """
    Create tables and apply lightweight schema upgrades.
    Production systems should use Alembic migrations instead.
    """
    db.create_all()

    try:
        inspector = inspect(db.engine)
        if 'users' in inspector.get_table_names():
            columns = {column['name'] for column in inspector.get_columns('users')}
            if 'role' not in columns:
                db.session.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'manager'"))
                db.session.commit()

            db.session.execute(text("UPDATE users SET role = 'manager' WHERE role IS NULL OR role = ''"))
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Schema upgrade warning: {e}")
