from datetime import datetime, timezone
from app import db

class Medicine(db.Model):
    __tablename__ = 'medicines'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    generic_name = db.Column(db.String(150), nullable=True, index=True)
    brand_name = db.Column(db.String(150), nullable=True, index=True)
    strength = db.Column(db.String(50), nullable=False)
    unit = db.Column(db.String(50), default='boxes', nullable=False)
    min_stock_level = db.Column(db.Integer, default=25, nullable=False)
    number_of_strips = db.Column(db.Integer, nullable=True)
    gtin = db.Column(db.String(50), nullable=True, index=True)
    barcode = db.Column(db.String(50), nullable=True, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    batches = db.relationship('Batch', backref='medicine', lazy=True, cascade='all, delete-orphan')
    dispensations = db.relationship('Dispensation', backref='medicine', lazy=True)

    @property
    def total_stock(self):
        return sum(b.quantity for b in self.batches if b.quantity > 0)

    @property
    def batch_count(self):
        return sum(1 for b in self.batches if b.quantity > 0)

    @property
    def earliest_expiry(self):
        active_batches = [b for b in self.batches if b.quantity > 0 and b.expiry_date]
        if not active_batches:
            return None
        return min(b.expiry_date for b in active_batches)

    @property
    def status(self):
        stock = self.total_stock
        if stock == 0:
            return 'Out of Stock'
        elif stock < self.min_stock_level:
            return 'Low Stock'
        return 'In Stock'

    def to_dict(self, include_batches=False):
        earliest_exp = self.earliest_expiry
        data = {
            'id': self.id,
            'name': self.name,
            'generic_name': self.generic_name,
            'brand_name': self.brand_name,
            'strength': self.strength,
            'unit': self.unit,
            'min_stock_level': self.min_stock_level,
            'number_of_strips': self.number_of_strips,
            'gtin': self.gtin,
            'barcode': self.barcode,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'description': self.description,
            'total_stock': self.total_stock,
            'batch_count': self.batch_count,
            'earliest_expiry': earliest_exp.strftime('%d %b %Y') if earliest_exp else None,
            'earliest_expiry_iso': earliest_exp.isoformat() if earliest_exp else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_batches:
            data['batches'] = [b.to_dict() for b in sorted(self.batches, key=lambda x: (x.expiry_date or datetime.max.date()))]
        return data
