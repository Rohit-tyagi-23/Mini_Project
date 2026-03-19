"""
Compatibility wrapper for backend/models.py.
"""

import importlib.util as _ilu
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_MODELS_PATH = os.path.join(BASE_DIR, 'backend', 'models.py')

_spec = _ilu.spec_from_file_location('backend_models_module', BACKEND_MODELS_PATH)
_backend_models = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_backend_models)

for _name in dir(_backend_models):
    if _name.startswith('__') and _name not in ('__all__',):
        continue
    globals()[_name] = getattr(_backend_models, _name)

__all__ = getattr(_backend_models, '__all__', [n for n in globals() if not n.startswith('_')])
