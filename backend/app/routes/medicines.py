from flask import Blueprint, request, jsonify
from app import db
from app.models.medicine import Medicine
from app.models.batch import Batch

medicines_bp = Blueprint('medicines', __name__)

@medicines_bp.route('', methods=['GET'])
def get_medicines():
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '').strip().lower()
    include_batches = request.args.get('include_batches', 'false').lower() == 'true'

    query = Medicine.query

    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            (Medicine.name.ilike(search_pattern)) |
            (Medicine.strength.ilike(search_pattern))
        )

    medicines = query.order_by(Medicine.name.asc()).all()

    result = []
    for med in medicines:
        med_dict = med.to_dict(include_batches=include_batches)
        if status_filter:
            if status_filter == 'low_stock' and med.status != 'Low Stock':
                continue
            elif status_filter == 'in_stock' and med.status != 'In Stock':
                continue
            elif status_filter == 'out_of_stock' and med.status != 'Out of Stock':
                continue
        result.append(med_dict)

    return jsonify({
        'total': len(result),
        'medicines': result
    }), 200

@medicines_bp.route('/<int:medicine_id>', methods=['GET'])
def get_medicine(medicine_id):
    med = Medicine.query.get_or_404(medicine_id, description=f'Medicine with id {medicine_id} not found')
    return jsonify(med.to_dict(include_batches=True)), 200

@medicines_bp.route('', methods=['POST'])
def create_medicine():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    strength = data.get('strength', '').strip()

    if not name or not strength:
        return jsonify({
            'error': True,
            'message': 'Medicine name and strength are required'
        }), 400

    existing = Medicine.query.filter(
        Medicine.name.ilike(name),
        Medicine.strength.ilike(strength)
    ).first()
    if existing:
        return jsonify({
            'error': True,
            'message': f'Medicine "{name} {strength}" already exists'
        }), 409

    medicine = Medicine(
        name=name,
        strength=strength,
        unit=data.get('unit', 'boxes').strip() or 'boxes',
        min_stock_level=int(data.get('min_stock_level', 25)),
        category_id=data.get('category_id'),
        description=data.get('description')
    )

    db.session.add(medicine)
    db.session.commit()

    return jsonify(medicine.to_dict()), 201

@medicines_bp.route('/<int:medicine_id>', methods=['PUT', 'PATCH'])
def update_medicine(medicine_id):
    med = Medicine.query.get_or_404(medicine_id, description=f'Medicine with id {medicine_id} not found')
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        med.name = data['name'].strip()
    if 'strength' in data and data['strength'].strip():
        med.strength = data['strength'].strip()
    if 'unit' in data and data['unit'].strip():
        med.unit = data['unit'].strip()
    if 'min_stock_level' in data:
        try:
            med.min_stock_level = max(0, int(data['min_stock_level']))
        except ValueError:
            return jsonify({'error': True, 'message': 'Invalid min_stock_level'}), 400
    if 'category_id' in data:
        med.category_id = data['category_id']
    if 'description' in data:
        med.description = data['description']

    db.session.commit()
    return jsonify(med.to_dict(include_batches=True)), 200

@medicines_bp.route('/<int:medicine_id>', methods=['DELETE'])
def delete_medicine(medicine_id):
    med = Medicine.query.get_or_404(medicine_id, description=f'Medicine with id {medicine_id} not found')
    db.session.delete(med)
    db.session.commit()
    return jsonify({'success': True, 'message': f'Medicine {medicine_id} deleted'}), 200
