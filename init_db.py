"""
Compatibility wrapper for scripts/init_db.py.
"""

import importlib.util as _ilu
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPT_INIT_DB_PATH = os.path.join(BASE_DIR, 'scripts', 'init_db.py')

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

_spec = _ilu.spec_from_file_location('script_init_db_module', SCRIPT_INIT_DB_PATH)
_script_init_db = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_script_init_db)

if __name__ == '__main__':
    _script_init_db.main()
