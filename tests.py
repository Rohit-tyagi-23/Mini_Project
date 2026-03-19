"""
Compatibility wrapper for scripts/tests.py.
"""

import importlib.util as _ilu
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPT_TESTS_PATH = os.path.join(BASE_DIR, 'scripts', 'tests.py')

_spec = _ilu.spec_from_file_location('script_tests_module', SCRIPT_TESTS_PATH)
_script_tests = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_script_tests)

if __name__ == '__main__':
    _script_tests.unittest.main()
