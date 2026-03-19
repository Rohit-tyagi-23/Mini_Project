"""
Compatibility wrapper for backend/alerts.py.
"""

import importlib.util as _ilu
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ALERTS_PATH = os.path.join(BASE_DIR, 'backend', 'alerts.py')

_spec = _ilu.spec_from_file_location('backend_alerts_module', BACKEND_ALERTS_PATH)
_backend_alerts = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_backend_alerts)

for _name in dir(_backend_alerts):
    if _name.startswith('__') and _name not in ('__all__',):
        continue
    globals()[_name] = getattr(_backend_alerts, _name)

__all__ = getattr(_backend_alerts, '__all__', [n for n in globals() if not n.startswith('_')])
