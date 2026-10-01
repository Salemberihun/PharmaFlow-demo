from flask import Blueprint, request, jsonify
from datetime import datetime, date, timedelta
from app import db
from app.models.dispensation import Dispensation
from app.models.medicine import Medicine
from app.models.batch import Batch

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/daily', methods=['GET'])
def get_daily_report():
    date_param = request.args.get('date', '').strip()
    if date_param:
        try:
            target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            target_date = date.today()
    else:
        # Default to today; if no transactions today, find the latest day with transactions
        target_date = date.today()
        latest = Dispensation.query.order_by(Dispensation.dispensed_at.desc()).first()
        if latest and Dispensation.query.filter(db.func.date(Dispensation.dispensed_at) == target_date).count() == 0:
            target_date = latest.dispensed_at.date()

    dispensations = Dispensation.query.filter(
        db.func.date(Dispensation.dispensed_at) == target_date
    ).order_by(Dispensation.dispensed_at.asc()).all()

    total_boxes = sum(d.quantity for d in dispensations)
    total_tx = len(dispensations)

    return jsonify({
        'date': target_date.isoformat(),
        'date_formatted': target_date.strftime('%d %B %Y'),
        'total_transactions': total_tx,
        'total_boxes': total_boxes,
        'items': [
            {
                'id': d.id,
                'time': d.dispensed_at.strftime('%H:%M') if d.dispensed_at else '',
                'medicine': f"{d.medicine.name} {d.medicine.strength}" if d.medicine else 'Unknown',
                'batch': d.batch.batch_number if d.batch else '',
                'qty': d.quantity,
                'unit': d.medicine.unit if d.medicine else 'boxes',
                'pharmacist': d.pharmacist.name if d.pharmacist else 'Staff'
            }
            for d in dispensations
        ]
    }), 200

@reports_bp.route('/inventory', methods=['GET'])
def get_inventory_report():
    medicines = Medicine.query.order_by(Medicine.name.asc()).all()
    report_items = []
    total_valuation = 0.0

    for m in medicines:
        batches = [b for b in m.batches if b.quantity > 0]
        med_value = sum(float(b.unit_price or 0) * b.quantity for b in batches)
        total_valuation += med_value
        report_items.append({
            'id': m.id,
            'name': m.name,
            'strength': m.strength,
            'category': m.category.name if m.category else 'General',
            'total_stock': m.total_stock,
            'unit': m.unit,
            'batches_count': len(batches),
            'earliest_expiry': m.earliest_expiry.strftime('%d %b %Y') if m.earliest_expiry else None,
            'status': m.status,
            'estimated_value': round(med_value, 2)
        })

    return jsonify({
        'total_medicines': len(medicines),
        'total_stock_boxes': sum(m.total_stock for m in medicines),
        'total_valuation': round(total_valuation, 2),
        'items': report_items
    }), 200

@reports_bp.route('/expiring', methods=['GET'])
def get_expiring_report():
    days_window = request.args.get('days', default=180, type=int)
    today = date.today()
    target_date = today + timedelta(days=days_window)

    batches = Batch.query.filter(
        Batch.quantity > 0,
        Batch.expiry_date != None,
        Batch.expiry_date <= target_date
    ).order_by(Batch.expiry_date.asc()).all()

    items = []
    for b in batches:
        days_left = (b.expiry_date - today).days
        urgency = 'critical' if days_left <= 30 else 'high' if days_left <= 60 else 'medium' if days_left <= 90 else 'warning'
        items.append({
            'batch_id': b.id,
            'batch_number': b.batch_number,
            'medicine_name': f"{b.medicine.name} {b.medicine.strength}" if b.medicine else 'Unknown',
            'quantity': b.quantity,
            'unit': b.medicine.unit if b.medicine else 'boxes',
            'expiry_date': b.expiry_date.strftime('%d %b %Y'),
            'days_remaining': days_left,
            'urgency': urgency
        })

    return jsonify({
        'window_days': days_window,
        'total_batches': len(items),
        'batches': items
    }), 200
