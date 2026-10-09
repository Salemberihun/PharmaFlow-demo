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
            (Medicine.generic_name.ilike(search_pattern)) |
            (Medicine.brand_name.ilike(search_pattern)) |
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
    generic_name = data.get('generic_name', '').strip()
    brand_name = data.get('brand_name', '').strip()
    name = data.get('name', '').strip() or brand_name or generic_name
    strength = data.get('strength', '').strip()
    number_of_strips = data.get('number_of_strips')

    if not name or not strength:
        return jsonify({
            'error': True,
            'message': 'Medicine name (or generic/brand name) and strength are required'
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

    strips_val = None
    if number_of_strips is not None and str(number_of_strips).strip() != '':
        try:
            strips_val = int(number_of_strips)
        except (ValueError, TypeError):
            pass

    medicine = Medicine(
        name=name,
        generic_name=generic_name or None,
        brand_name=brand_name or None,
        strength=strength,
        unit=data.get('unit', 'boxes').strip() or 'boxes',
        min_stock_level=int(data.get('min_stock_level', 25)),
        number_of_strips=strips_val,
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
    if 'generic_name' in data:
        med.generic_name = data['generic_name'].strip() if data['generic_name'] else None
    if 'brand_name' in data:
        med.brand_name = data['brand_name'].strip() if data['brand_name'] else None
    if 'strength' in data and data['strength'].strip():
        med.strength = data['strength'].strip()
    if 'number_of_strips' in data:
        try:
            med.number_of_strips = int(data['number_of_strips']) if data['number_of_strips'] is not None else None
        except (ValueError, TypeError):
            pass
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
