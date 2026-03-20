"""
Compatibility shim: load Gunicorn settings from config/gunicorn.conf.py.
"""

import os
import runpy

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config", "gunicorn.conf.py")

globals().update(runpy.run_path(CONFIG_PATH))
