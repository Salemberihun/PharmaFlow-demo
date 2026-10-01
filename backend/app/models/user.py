from datetime import datetime, timezone
from app import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='Pharmacist')
    email = db.Column(db.String(120), unique=True, nullable=True)
    initials = db.Column(db.String(5), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    dispensations = db.relationship('Dispensation', backref='pharmacist', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role,
            'email': self.email,
            'initials': self.initials or ''.join([part[0] for part in self.name.replace('Dr. ', '').split() if part])[:2].upper(),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
