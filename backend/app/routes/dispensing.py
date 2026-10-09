from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from app import db
from app.models.medicine import Medicine
from app.models.batch import Batch
from app.models.user import User
from app.models.dispensation import Dispensation
from app.models.stock_movement import StockMovement

dispensing_bp = Blueprint('dispensing', __name__)

@dispensing_bp.route('', methods=['GET'])
def get_dispensing_history():
    search = request.args.get('search', '').strip()
    date_str = request.args.get('date', '').strip()

    query = Dispensation.query.join(Medicine).join(Batch).join(User)

    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            (Medicine.name.ilike(search_pattern)) |
            (Medicine.generic_name.ilike(search_pattern)) |
            (Medicine.brand_name.ilike(search_pattern)) |
            (Medicine.strength.ilike(search_pattern)) |
            (Batch.batch_number.ilike(search_pattern)) |
            (User.name.ilike(search_pattern))
        )

    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter(db.func.date(Dispensation.dispensed_at) == target_date)
        except ValueError:
            pass

    records = query.order_by(Dispensation.dispensed_at.desc()).all()

    return jsonify({
        'total': len(records),
        'transactions': [r.to_dict() for r in records]
    }), 200

@dispensing_bp.route('', methods=['POST'])
def dispense_medicine():
    data = request.get_json() or {}

    medicine_id = data.get('medicine_id')
    batch_id = data.get('batch_id')
    quantity = data.get('quantity')
    pharmacist_id = data.get('pharmacist_id')
    patient_name = data.get('patient_name', '').strip()
    notes = data.get('notes', '').strip()

    if not medicine_id:
        return jsonify({'error': True, 'message': 'Medicine ID is required'}), 400

    if not quantity or int(quantity) <= 0:
        return jsonify({'error': True, 'message': 'Quantity must be a positive number'}), 400
    quantity = int(quantity)

    medicine = Medicine.query.get_or_404(medicine_id, description=f'Medicine {medicine_id} not found')

    # If no batch_id specified, pick the best active batch using FEFO (First-Expired, First-Out)
    if not batch_id:
        active_batch = Batch.query.filter(
            Batch.medicine_id == medicine_id,
            Batch.quantity >= quantity,
            Batch.status == 'active'
        ).order_by(Batch.expiry_date.asc()).first()

        if not active_batch:
            # Check if total stock is insufficient
            if medicine.total_stock < quantity:
                return jsonify({
                    'error': True,
                    'message': f'Insufficient total stock for {medicine.name}. Available: {medicine.total_stock} {medicine.unit}, requested: {quantity}'
                }), 400
            else:
                return jsonify({
                    'error': True,
                    'message': f'No single batch has {quantity} {medicine.unit}. Please specify a batch.'
                }), 400
        batch = active_batch
    else:
        batch = Batch.query.get_or_404(batch_id, description=f'Batch {batch_id} not found')
        if batch.medicine_id != medicine.id:
            return jsonify({'error': True, 'message': 'Specified batch does not belong to this medicine'}), 400

        if batch.quantity < quantity:
            return jsonify({
                'error': True,
                'message': f'Insufficient stock in batch {batch.batch_number}. Available: {batch.quantity} {medicine.unit}, requested: {quantity}'
            }), 400

    # Resolve pharmacist
    if not pharmacist_id:
        pharmacist = User.query.filter_by(is_active=True).first()
        if not pharmacist:
            pharmacist = User(name='Dr. Sarah Chen', role='Pharmacist', initials='SC')
            db.session.add(pharmacist)
            db.session.flush()
        pharmacist_id = pharmacist.id
    else:
        pharmacist = User.query.get_or_404(pharmacist_id, description=f'Pharmacist {pharmacist_id} not found')

    # Generate dispensation code
    timestamp_str = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')
    dispensation_code = f"DSP-{timestamp_str}-{medicine.id}"

    dispensation = Dispensation(
        dispensation_code=dispensation_code,
        medicine_id=medicine.id,
        batch_id=batch.id,
        pharmacist_id=pharmacist_id,
        quantity=quantity,
        patient_name=patient_name or None,
        notes=notes or None,
        dispensed_at=datetime.now(timezone.utc)
    )
    db.session.add(dispensation)

    # Deduct stock
    batch.quantity -= quantity
    if batch.quantity == 0:
        batch.status = 'depleted'

    # Audit movement
    movement = StockMovement(
        batch_id=batch.id,
        movement_type='DISPENSE',
        quantity_change=-quantity,
        balance_after=batch.quantity,
        reference=f'Dispensed {quantity} {medicine.unit}'
    )
    db.session.add(movement)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Successfully dispensed {quantity} {medicine.unit} of {medicine.name}',
        'dispensation': dispensation.to_dict(),
        'remaining_batch_stock': batch.quantity,
        'remaining_total_stock': medicine.total_stock
    }), 201
