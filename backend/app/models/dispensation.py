from datetime import datetime, timezone
from app import db

class Dispensation(db.Model):
    __tablename__ = 'dispensations'

    id = db.Column(db.Integer, primary_key=True)
    dispensation_code = db.Column(db.String(50), unique=True, nullable=True, index=True)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.id'), nullable=False)
    batch_id = db.Column(db.Integer, db.ForeignKey('batches.id'), nullable=False)
    pharmacist_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    patient_name = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    dispensed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def to_dict(self):
        # Format date as '29 Sept 2026' and time as '11:05'
        dt = self.dispensed_at
        return {
            'id': self.id,
            'dispensation_code': self.dispensation_code,
            'medicine_id': self.medicine_id,
            'medicine_name': f"{self.medicine.name} {self.medicine.strength}" if self.medicine else 'Unknown',
            'medicine_base_name': self.medicine.name if self.medicine else '',
            'medicine_strength': self.medicine.strength if self.medicine else '',
            'batch_id': self.batch_id,
            'batch_number': self.batch.batch_number if self.batch else 'Unknown',
            'quantity': self.quantity,
            'unit': self.medicine.unit if self.medicine else 'boxes',
            'pharmacist_id': self.pharmacist_id,
            'pharmacist_name': self.pharmacist.name if self.pharmacist else 'Unknown',
            'patient_name': self.patient_name,
            'notes': self.notes,
            'dispensed_at': dt.isoformat() if dt else None,
            'formatted_date': dt.strftime('%d %b %Y') if dt else '',
            'formatted_time': dt.strftime('%H:%M') if dt else '',
            'formatted_full': dt.strftime('%d %b %Y %H:%M') if dt else ''
        }
