"""Add gtin and barcode to medicines

Revision ID: 003_add_gtin_barcode
Revises: 002_add_generic_brand_strips
Create Date: 2026-10-09 08:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_gtin_barcode'
down_revision = '002_add_generic_brand_strips'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('medicines', sa.Column('gtin', sa.String(length=50), nullable=True))
    op.add_column('medicines', sa.Column('barcode', sa.String(length=50), nullable=True))
    op.create_index(op.f('ix_medicines_gtin'), 'medicines', ['gtin'], unique=False)
    op.create_index(op.f('ix_medicines_barcode'), 'medicines', ['barcode'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_medicines_barcode'), table_name='medicines')
    op.drop_index(op.f('ix_medicines_gtin'), table_name='medicines')
    op.drop_column('medicines', 'barcode')
    op.drop_column('medicines', 'gtin')
