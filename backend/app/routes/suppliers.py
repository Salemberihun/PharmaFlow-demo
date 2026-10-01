from flask import Blueprint, request, jsonify
from app import db
from app.models.supplier import Supplier

suppliers_bp = Blueprint('suppliers', __name__)

@suppliers_bp.route('', methods=['GET'])
def get_suppliers():
    suppliers = Supplier.query.order_by(Supplier.name.asc()).all()
    return jsonify({
        'total': len(suppliers),
        'suppliers': [s.to_dict() for s in suppliers]
    }), 200

@suppliers_bp.route('', methods=['POST'])
def create_supplier():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': True, 'message': 'Supplier name is required'}), 400

    existing = Supplier.query.filter_by(name=name).first()
    if existing:
        return jsonify({'error': True, 'message': 'Supplier already exists'}), 409

    supp = Supplier(
        name=name,
        contact_person=data.get('contact_person'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address')
    )
    db.session.add(supp)
    db.session.commit()
    return jsonify(supp.to_dict()), 201
