from flask import Blueprint, request, jsonify
from app import db
from app.models.category import Category

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('', methods=['GET'])
def get_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    return jsonify({
        'total': len(categories),
        'categories': [c.to_dict() for c in categories]
    }), 200

@categories_bp.route('', methods=['POST'])
def create_category():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': True, 'message': 'Category name is required'}), 400

    existing = Category.query.filter_by(name=name).first()
    if existing:
        return jsonify({'error': True, 'message': 'Category already exists'}), 409

    cat = Category(name=name, description=data.get('description'))
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict()), 201
