from datetime import datetime, timezone, date
from app import db

class Batch(db.Model):
    __tablename__ = 'batches'

    id = db.Column(db.Integer, primary_key=True)
    batch_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.id', ondelete='CASCADE'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    initial_quantity = db.Column(db.Integer, nullable=False, default=0)
    number_of_strips = db.Column(db.Integer, nullable=True)
    unit_price = db.Column(db.Numeric(10, 2), nullable=True)
    expiry_date = db.Column(db.Date, nullable=False, index=True)
    received_date = db.Column(db.Date, default=lambda: date.today(), nullable=False)
    status = db.Column(db.String(20), default='active', nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    dispensations = db.relationship('Dispensation', backref='batch', lazy=True)
    movements = db.relationship('StockMovement', backref='batch', lazy=True, cascade='all, delete-orphan')

    @property
    def is_expired(self):
        if not self.expiry_date:
            return False
        return self.expiry_date < date.today()

    @property
    def is_expiring_soon(self):
        if not self.expiry_date:
            return False
        days = (self.expiry_date - date.today()).days
        return 0 <= days <= 180  # within 6 months (~180 days)

    def to_dict(self):
        return {
            'id': self.id,
            'batch_number': self.batch_number,
            'medicine_id': self.medicine_id,
            'medicine_name': self.medicine.name if self.medicine else None,
            'medicine_generic_name': self.medicine.generic_name if self.medicine else None,
            'medicine_brand_name': self.medicine.brand_name if self.medicine else None,
            'medicine_strength': self.medicine.strength if self.medicine else None,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'quantity': self.quantity,
            'initial_quantity': self.initial_quantity,
            'number_of_strips': self.number_of_strips,
            'unit_price': float(self.unit_price) if self.unit_price is not None else None,
            'expiry_date': self.expiry_date.strftime('%d %b %Y') if self.expiry_date else None,
            'expiry_date_iso': self.expiry_date.isoformat() if self.expiry_date else None,
            'received_date': self.received_date.isoformat() if self.received_date else None,
            'status': self.status,
            'is_expired': self.is_expired,
            'is_expiring_soon': self.is_expiring_soon,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
