from datetime import datetime, timezone
from app import db

class StockMovement(db.Model):
    __tablename__ = 'stock_movements'

    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey('batches.id', ondelete='CASCADE'), nullable=False)
    movement_type = db.Column(db.String(20), nullable=False)  # 'RECEIVE', 'DISPENSE', 'ADJUSTMENT'
    quantity_change = db.Column(db.Integer, nullable=False)   # e.g. +50, -2
    balance_after = db.Column(db.Integer, nullable=False)
    reference = db.Column(db.String(100), nullable=True)     # e.g. 'Dispensation #3' or 'Initial Stock'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'batch_id': self.batch_id,
            'batch_number': self.batch.batch_number if self.batch else None,
            'movement_type': self.movement_type,
            'quantity_change': self.quantity_change,
            'balance_after': self.balance_after,
            'reference': self.reference,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
