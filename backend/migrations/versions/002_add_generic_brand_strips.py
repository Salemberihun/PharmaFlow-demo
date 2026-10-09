"""Add generic_name, brand_name, number_of_strips to medicines and batches

Revision ID: 002_add_generic_brand_strips
Revises: 001_initial_schema
Create Date: 2026-10-07 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_generic_brand_strips'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add columns to medicines
    op.add_column('medicines', sa.Column('generic_name', sa.String(length=150), nullable=True))
    op.add_column('medicines', sa.Column('brand_name', sa.String(length=150), nullable=True))
    op.add_column('medicines', sa.Column('number_of_strips', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_medicines_generic_name'), 'medicines', ['generic_name'], unique=False)
    op.create_index(op.f('ix_medicines_brand_name'), 'medicines', ['brand_name'], unique=False)

    # 2. Add column to batches
    op.add_column('batches', sa.Column('number_of_strips', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('batches', 'number_of_strips')
    op.drop_index(op.f('ix_medicines_brand_name'), table_name='medicines')
    op.drop_index(op.f('ix_medicines_generic_name'), table_name='medicines')
    op.drop_column('medicines', 'number_of_strips')
    op.drop_column('medicines', 'brand_name')
    op.drop_column('medicines', 'generic_name')
