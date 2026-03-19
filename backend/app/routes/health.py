"""
Health check and monitoring endpoints for production orchestration.
Used by load balancers, Kubernetes, Docker Swarm, etc.
"""
from flask import jsonify, current_app
from app.routes import health_bp
from app.extensions import db
import psutil
import time


start_time = time.time()


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Basic health check endpoint.
    Returns 200 OK if service is running.
    """
    return jsonify({
        'status': 'healthy',
        'service': 'restaurant-ai',
        'timestamp': time.time()
    }), 200


@health_bp.route('/health/ready', methods=['GET'])
def readiness_check():
    """
    Readiness probe for Kubernetes/orchestration.
    Checks if application is ready to serve traffic.
    """
    checks = {
        'database': False,
        'overall': False
    }
    
    try:
        # Test database connection
        db.session.execute(db.text('SELECT 1'))
        checks['database'] = True
        checks['overall'] = True
    except Exception as e:
        current_app.logger.error(f'Readiness check failed: {e}')
        checks['overall'] = False
    
    status_code = 200 if checks['overall'] else 503
    return jsonify({
        'status': 'ready' if checks['overall'] else 'not_ready',
        'checks': checks
    }), status_code


@health_bp.route('/health/live', methods=['GET'])
def liveness_check():
    """
    Liveness probe for Kubernetes/orchestration.
    Simple check that process is alive.
    """
    return jsonify({
        'status': 'alive',
        'uptime_seconds': time.time() - start_time
    }), 200


@health_bp.route('/metrics', methods=['GET'])
def metrics():
    """
    Basic metrics endpoint for monitoring.
    In production, use Prometheus or similar.
    """
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return jsonify({
            'system': {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_available_mb': memory.available / (1024 * 1024),
                'disk_percent': disk.percent
            },
            'application': {
                'uptime_seconds': time.time() - start_time,
                'environment': current_app.config.get('ENV', 'production')
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f'Metrics collection failed: {e}')
        return jsonify({'error': 'Metrics unavailable'}), 500
