from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
def get_users():
    users = User.query.filter_by(is_active=True).order_by(User.name.asc()).all()
    return jsonify({
        'total': len(users),
        'users': [u.to_dict() for u in users]
    }), 200

@users_bp.route('', methods=['POST'])
def create_user():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': True, 'message': 'User name is required'}), 400

    role = data.get('role', 'Pharmacist').strip()
    email = data.get('email', '').strip() or None
    initials = data.get('initials', '').strip() or None

    user = User(name=name, role=role, email=email, initials=initials)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201
