"""Initial schema: users, categories, suppliers, medicines, batches, dispensations, stock_movements

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-29 19:55:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # 1. Users Table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='Pharmacist'),
        sa.Column('email', sa.String(length=120), nullable=True),
        sa.Column('initials', sa.String(length=5), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # 2. Categories Table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 3. Suppliers Table
    op.create_table(
        'suppliers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('contact_person', sa.String(length=100), nullable=True),
        sa.Column('email', sa.String(length=120), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 4. Medicines Table
    op.create_table(
        'medicines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('strength', sa.String(length=50), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=False, server_default='boxes'),
        sa.Column('min_stock_level', sa.Integer(), nullable=False, server_default='25'),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_medicines_name'), 'medicines', ['name'], unique=False)

    # 5. Batches Table
    op.create_table(
        'batches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('batch_number', sa.String(length=50), nullable=False),
        sa.Column('medicine_id', sa.Integer(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('initial_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('expiry_date', sa.Date(), nullable=False),
        sa.Column('received_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['medicine_id'], ['medicines.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_batches_batch_number'), 'batches', ['batch_number'], unique=True)
    op.create_index(op.f('ix_batches_expiry_date'), 'batches', ['expiry_date'], unique=False)

    # 6. Dispensations Table
    op.create_table(
        'dispensations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('dispensation_code', sa.String(length=50), nullable=True),
        sa.Column('medicine_id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('pharmacist_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('patient_name', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('dispensed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ),
        sa.ForeignKeyConstraint(['medicine_id'], ['medicines.id'], ),
        sa.ForeignKeyConstraint(['pharmacist_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dispensations_dispensation_code'), 'dispensations', ['dispensation_code'], unique=True)
    op.create_index(op.f('ix_dispensations_dispensed_at'), 'dispensations', ['dispensed_at'], unique=False)

    # 7. Stock Movements Table
    op.create_table(
        'stock_movements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('movement_type', sa.String(length=20), nullable=False),
        sa.Column('quantity_change', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('reference', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('stock_movements')
    op.drop_index(op.f('ix_dispensations_dispensed_at'), table_name='dispensations')
    op.drop_index(op.f('ix_dispensations_dispensation_code'), table_name='dispensations')
    op.drop_table('dispensations')
    op.drop_index(op.f('ix_batches_expiry_date'), table_name='batches')
    op.drop_index(op.f('ix_batches_batch_number'), table_name='batches')
    op.drop_table('batches')
    op.drop_index(op.f('ix_medicines_name'), table_name='medicines')
    op.drop_table('medicines')
    op.drop_table('suppliers')
    op.drop_table('categories')
    op.drop_table('users')
