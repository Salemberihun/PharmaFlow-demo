import pytest
import os
from datetime import date, datetime, timezone
from app import create_app, db
from app.models.user import User
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.medicine import Medicine
from app.models.batch import Batch
from app.models.dispensation import Dispensation

@pytest.fixture(scope='session')
def app():
    os.environ['FLASK_ENV'] = 'testing'
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    return app.test_client()

@pytest.fixture(scope='function')
def db_session(app):
    with app.app_context():
        # Clear tables before each test
        for table in reversed(db.metadata.sorted_tables):
            db.session.execute(table.delete())
        db.session.commit()
        yield db.session
        db.session.rollback()

@pytest.fixture(scope='function')
def sample_data(app, db_session):
    user = User(name='Dr. Sarah Chen', role='Pharmacist', email='sarah.chen@pharmaflow.local', initials='SC')
    cat = Category(name='Antibiotics', description='Antibacterial drugs')
    sup = Supplier(name='MedPharma Logistics', contact_person='David Miller', email='orders@medpharma.com')
    db.session.add_all([user, cat, sup])
    db.session.commit()

    med1 = Medicine(name='Amoxicillin', strength='500 mg', unit='boxes', min_stock_level=25, category_id=cat.id)
    med2 = Medicine(name='Ibuprofen', strength='400 mg', unit='boxes', min_stock_level=25, category_id=cat.id)
    db.session.add_all([med1, med2])
    db.session.commit()

    batch1 = Batch(batch_number='AMX001', medicine_id=med1.id, supplier_id=sup.id, quantity=100, initial_quantity=100, expiry_date=date(2027, 6, 30))
    batch2 = Batch(batch_number='IBU023', medicine_id=med2.id, supplier_id=sup.id, quantity=20, initial_quantity=20, expiry_date=date(2027, 7, 31))
    db.session.add_all([batch1, batch2])
    db.session.commit()

    return {
        'user': user,
        'category': cat,
        'supplier': sup,
        'medicines': [med1, med2],
        'batches': [batch1, batch2]
    }
