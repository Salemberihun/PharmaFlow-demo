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
    medicine_name = data.get('medicine_name', '').strip()
    strength = data.get('strength', '').strip()
    quantity = data.get('quantity')
    expiry_date_str = data.get('expiry_date', '').strip()
    supplier_id = data.get('supplier_id')
    unit_price = data.get('unit_price')

    if not batch_number:
        return jsonify({'error': True, 'message': 'Batch number is required'}), 400

    if not quantity or int(quantity) <= 0:
        return jsonify({'error': True, 'message': 'Valid quantity (>0) is required'}), 400
    quantity = int(quantity)

    if not expiry_date_str:
        return jsonify({'error': True, 'message': 'Expiry date is required'}), 400

    try:
        expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': True, 'message': 'Invalid expiry_date format, expected YYYY-MM-DD'}), 400

    # Resolve or create medicine if medicine_name was provided
    if not medicine_id:
        if not medicine_name or not strength:
            return jsonify({'error': True, 'message': 'Either medicine_id or both medicine_name and strength must be provided'}), 400
        
        medicine = Medicine.query.filter(
            Medicine.name.ilike(medicine_name),
            Medicine.strength.ilike(strength)
        ).first()

        if not medicine:
            medicine = Medicine(
                name=medicine_name,
                strength=strength,
                unit=data.get('unit', 'boxes') or 'boxes',
                min_stock_level=int(data.get('min_stock_level', 25))
            )
            db.session.add(medicine)
            db.session.flush()
        medicine_id = medicine.id
    else:
        medicine = Medicine.query.get_or_404(medicine_id, description=f'Medicine {medicine_id} not found')

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
