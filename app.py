"""
Compatibility launcher for the backend app module.
Keeps `python app.py` working after moving source files into `backend/`.
"""

import importlib.util as _ilu
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

_spec = _ilu.spec_from_file_location('backend_app_module', os.path.join(BACKEND_DIR, 'app.py'))
_backend_app = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_backend_app)

# Re-export common symbols used by scripts and tooling.
create_app = _backend_app.create_app
app = _backend_app.app
db = _backend_app.db
User = _backend_app.User
Location = _backend_app.Location
SalesRecord = _backend_app.SalesRecord
Forecast = _backend_app.Forecast
AlertPreference = _backend_app.AlertPreference
AlertHistory = _backend_app.AlertHistory
IngredientMaster = _backend_app.IngredientMaster

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
