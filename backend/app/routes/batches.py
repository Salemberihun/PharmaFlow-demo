from flask import Blueprint, request, jsonify
from datetime import datetime, date
from app import db
from app.models.medicine import Medicine
from app.models.batch import Batch
from app.models.stock_movement import StockMovement

batches_bp = Blueprint('batches', __name__)

@batches_bp.route('', methods=['GET'])
def get_batches():
    medicine_id = request.args.get('medicine_id', type=int)
    expiring_soon = request.args.get('expiring_soon', '').lower() == 'true'
    active_only = request.args.get('active_only', 'true').lower() == 'true'

    query = Batch.query

    if medicine_id:
        query = query.filter_by(medicine_id=medicine_id)
    if active_only:
        query = query.filter(Batch.quantity > 0)

    batches = query.order_by(Batch.expiry_date.asc()).all()

    if expiring_soon:
        batches = [b for b in batches if b.is_expiring_soon]

    return jsonify({
        'total': len(batches),
        'batches': [b.to_dict() for b in batches]
    }), 200

@batches_bp.route('/<int:batch_id>', methods=['GET'])
def get_batch(batch_id):
    batch = Batch.query.get_or_404(batch_id, description=f'Batch with id {batch_id} not found')
    return jsonify(batch.to_dict()), 200

@batches_bp.route('', methods=['POST'])
def receive_batch():
    data = request.get_json() or {}

    batch_number = data.get('batch_number', '').strip()
    medicine_id = data.get('medicine_id')
    generic_name = data.get('generic_name', '').strip()
    brand_name = data.get('brand_name', '').strip()
    medicine_name = data.get('medicine_name', '').strip()
    strength = data.get('strength', '').strip()
    quantity = data.get('quantity')
    number_of_strips = data.get('number_of_strips')
    expiry_date_str = data.get('expiry_date', '').strip()
    supplier_id = data.get('supplier_id')
    unit_price = data.get('unit_price')

    if not batch_number:
        return jsonify({'error': True, 'message': 'Batch number is required'}), 400

    if not quantity or int(quantity) <= 0:
        return jsonify({'error': True, 'message': 'Valid quantity (>0) is required'}), 400
    quantity = int(quantity)

    strips_val = None
    if number_of_strips is not None and str(number_of_strips).strip() != '':
        try:
            strips_val = int(number_of_strips)
            if strips_val < 0:
                return jsonify({'error': True, 'message': 'Number of strips must be non-negative'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': True, 'message': 'Invalid number of strips format'}), 400

    if not expiry_date_str:
        return jsonify({'error': True, 'message': 'Expiry date is required'}), 400

    try:
        expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': True, 'message': 'Invalid expiry_date format, expected YYYY-MM-DD'}), 400

    gtin = data.get('gtin', '').strip() if data.get('gtin') else None
    barcode = data.get('barcode', '').strip() if data.get('barcode') else None

    # Resolve or create medicine if medicine_id was not provided
    if not medicine_id:
        name_candidate = brand_name or generic_name or medicine_name
        if not name_candidate or not strength:
            return jsonify({'error': True, 'message': 'Either medicine_id or generic name/brand name and strength must be provided'}), 400

        conditions = [Medicine.name.ilike(name_candidate)]
        if generic_name:
            conditions.append(Medicine.generic_name.ilike(generic_name))
        if brand_name:
            conditions.append(Medicine.brand_name.ilike(brand_name))

        medicine = Medicine.query.filter(
            Medicine.strength.ilike(strength),
            db.or_(*conditions)
        ).first()

        if not medicine:
            medicine = Medicine(
                name=name_candidate,
                generic_name=generic_name or (medicine_name if not brand_name else None),
                brand_name=brand_name or None,
                strength=strength,
                unit=data.get('unit', 'boxes') or 'boxes',
                min_stock_level=int(data.get('min_stock_level', 25)),
                number_of_strips=strips_val,
                gtin=gtin,
                barcode=barcode
            )
            db.session.add(medicine)
            db.session.flush()
        else:
            if generic_name and not medicine.generic_name:
                medicine.generic_name = generic_name
            if brand_name and not medicine.brand_name:
                medicine.brand_name = brand_name
            if strips_val is not None and not medicine.number_of_strips:
                medicine.number_of_strips = strips_val
            if gtin and not medicine.gtin:
                medicine.gtin = gtin
            if barcode and not medicine.barcode:
                medicine.barcode = barcode
            db.session.flush()
        medicine_id = medicine.id
    else:
        medicine = Medicine.query.get_or_404(medicine_id, description=f'Medicine {medicine_id} not found')
        if strips_val is not None and not medicine.number_of_strips:
            medicine.number_of_strips = strips_val
        if gtin and not medicine.gtin:
            medicine.gtin = gtin
        if barcode and not medicine.barcode:
            medicine.barcode = barcode
        db.session.flush()

    # Check for duplicate batch number
    existing_batch = Batch.query.filter_by(batch_number=batch_number).first()
    if existing_batch:
        return jsonify({'error': True, 'message': f'Batch number "{batch_number}" already exists'}), 409

    batch = Batch(
        batch_number=batch_number,
        medicine_id=medicine_id,
        supplier_id=supplier_id,
        quantity=quantity,
        initial_quantity=quantity,
        number_of_strips=strips_val,
        unit_price=unit_price,
        expiry_date=expiry_date,
        received_date=date.today(),
        status='active'
    )
    db.session.add(batch)
    db.session.flush()

    # Log stock movement
    movement = StockMovement(
        batch_id=batch.id,
        movement_type='RECEIVE',
        quantity_change=quantity,
        balance_after=quantity,
        reference=f'Received Batch {batch_number}'
    )
    db.session.add(movement)
    db.session.commit()

    return jsonify(batch.to_dict()), 201
