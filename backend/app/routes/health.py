from flask import Blueprint, jsonify
from datetime import datetime, timezone
from app import db

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    db_status = 'connected'
    try:
        db.session.execute(db.text('SELECT 1'))
    except Exception as e:
        db_status = f'error: {str(e)}'

    return jsonify({
        'status': 'ok' if 'error' not in db_status else 'degraded',
        'application': 'PharmaFlow API',
        'database': db_status,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }), 200
