"""
Compatibility wrapper for backend/model.py.
"""

import importlib.util as _ilu
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_MODEL_PATH = os.path.join(BASE_DIR, 'backend', 'model.py')

_spec = _ilu.spec_from_file_location('backend_model_module', BACKEND_MODEL_PATH)
_backend_model = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_backend_model)

for _name in dir(_backend_model):
    if _name.startswith('__') and _name not in ('__all__',):
        continue
    globals()[_name] = getattr(_backend_model, _name)

__all__ = getattr(_backend_model, '__all__', [n for n in globals() if not n.startswith('_')])
