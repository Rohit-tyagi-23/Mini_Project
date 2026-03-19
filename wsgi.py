"""
Compatibility wrapper for scripts/wsgi.py.
"""

import importlib.util as _ilu
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPT_WSGI_PATH = os.path.join(BASE_DIR, 'scripts', 'wsgi.py')

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

_spec = _ilu.spec_from_file_location('script_wsgi_module', SCRIPT_WSGI_PATH)
_script_wsgi = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_script_wsgi)

app = _script_wsgi.app

if __name__ == '__main__':
    app.run()
