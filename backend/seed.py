import os
from datetime import datetime, date, timezone
from app import create_app, db
from app.models.user import User
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.medicine import Medicine
from app.models.batch import Batch
from app.models.dispensation import Dispensation
from app.models.stock_movement import StockMovement

def seed_database():
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    with app.app_context():
        print("Clearing existing data...")
        # Clear in reverse order of foreign keys
        StockMovement.query.delete()
        Dispensation.query.delete()
        Batch.query.delete()
        Medicine.query.delete()
        Supplier.query.delete()
        Category.query.delete()
        User.query.delete()
        db.session.commit()

        print("Seeding Users (Pharmacists)...")
        sarah = User(
            name='Dr. Sarah Chen',
            role='Pharmacist',
            email='sarah.chen@pharmaflow.local',
            initials='SC',
            is_active=True
        )
        james = User(
            name='Dr. James Park',
            role='Pharmacist',
            email='james.park@pharmaflow.local',
            initials='JP',
            is_active=True
        )
        db.session.add_all([sarah, james])
        db.session.flush()

        print("Seeding Categories...")
        cat_antibiotics = Category(name='Antibiotics', description='Antibacterial and antimicrobial medications')
        cat_analgesics = Category(name='Analgesics', description='Pain relief medications')
        cat_antiinflam = Category(name='Anti-inflammatory', description='Nonsteroidal anti-inflammatory drugs (NSAIDs)')
        db.session.add_all([cat_antibiotics, cat_analgesics, cat_antiinflam])
        db.session.flush()

        print("Seeding Suppliers...")
        sup_medpharma = Supplier(
            name='MedPharma Logistics',
            contact_person='David Miller',
            email='orders@medpharma.com',
            phone='+1 (555) 345-6789',
            address='100 Healthcare Blvd, Suite 400'
        )
        sup_apothecary = Supplier(
            name='Apothecary Direct Wholesale',
            contact_person='Elena Rostova',
            email='supply@apothecarydirect.com',
            phone='+1 (555) 789-0123',
            address='450 Science Park Way'
        )
        db.session.add_all([sup_medpharma, sup_apothecary])
        db.session.flush()

        print("Seeding Medicines...")
        # Exactly from Figma:
        # Amoxicillin 500 mg, Paracetamol 500 mg, Ibuprofen 400 mg
        med_amoxicillin = Medicine(
            name='Amoxicillin',
            strength='500 mg',
            unit='boxes',
            min_stock_level=25,
            gtin='08435123456789',
            barcode='08435123456789',
            category_id=cat_antibiotics.id,
            description='Broad-spectrum penicillin-type antibiotic used to treat bacterial infections.'
        )
        med_paracetamol = Medicine(
            name='Paracetamol',
            strength='500 mg',
            unit='boxes',
            min_stock_level=25,
            gtin='01234567890128',
            barcode='01234567890128',
            category_id=cat_analgesics.id,
            description='Common pain reliever and fever reducer for mild to moderate symptoms.'
        )
        med_ibuprofen = Medicine(
            name='Ibuprofen',
            strength='400 mg',
            unit='boxes',
            min_stock_level=25,
            gtin='07640123456789',
            barcode='07640123456789',
            category_id=cat_antiinflam.id,
            description='NSAID used for relieving pain, reducing inflammation, and lowering fever.'
        )
        db.session.add_all([med_amoxicillin, med_paracetamol, med_ibuprofen])
        db.session.flush()

        print("Seeding Batches...")
        # Amoxicillin has 2 batches totaling 150 boxes:
        # Batch AMX001: 100 boxes (initial 103), exp 30 Jun 2027
        # Batch AMX002: 50 boxes, exp 15 Sep 2027
        batch_amx001 = Batch(
            batch_number='AMX001',
            medicine_id=med_amoxicillin.id,
            supplier_id=sup_medpharma.id,
            quantity=100,
            initial_quantity=103,
            unit_price=12.50,
            expiry_date=date(2027, 6, 30),
            received_date=date(2026, 8, 1),
            status='active'
        )
        batch_amx002 = Batch(
            batch_number='AMX002',
            medicine_id=med_amoxicillin.id,
            supplier_id=sup_medpharma.id,
            quantity=50,
            initial_quantity=50,
            unit_price=12.50,
            expiry_date=date(2027, 9, 15),
            received_date=date(2026, 9, 1),
            status='active'
        )

        # Paracetamol has 1 batch with 80 boxes (initial 85), exp 31 Dec 2028:
        batch_pcm004 = Batch(
            batch_number='PCM004',
            medicine_id=med_paracetamol.id,
            supplier_id=sup_apothecary.id,
            quantity=80,
            initial_quantity=85,
            unit_price=6.00,
            expiry_date=date(2028, 12, 31),
            received_date=date(2026, 7, 15),
            status='active'
        )

        # Ibuprofen has 1 batch with 20 boxes (initial 23), exp 31 Jul 2027 (Low stock: 20 < min 25!):
        batch_ibu023 = Batch(
            batch_number='IBU023',
            medicine_id=med_ibuprofen.id,
            supplier_id=sup_medpharma.id,
            quantity=20,
            initial_quantity=23,
            unit_price=8.50,
            expiry_date=date(2027, 7, 31),
            received_date=date(2026, 6, 10),
            status='active'
        )

        db.session.add_all([batch_amx001, batch_amx002, batch_pcm004, batch_ibu023])
        db.session.flush()

        print("Seeding Dispensations (History matching Figma screens)...")
        # 1. 28 Sept 2026 14:22 - Ibuprofen 400 mg, IBU023, 3 boxes, Dr. James Park
        disp_1 = Dispensation(
            dispensation_code='DSP-20260928-001',
            medicine_id=med_ibuprofen.id,
            batch_id=batch_ibu023.id,
            pharmacist_id=james.id,
            quantity=3,
            dispensed_at=datetime(2026, 9, 28, 14, 22, 0, tzinfo=timezone.utc),
            patient_name='Walk-in Patient',
            notes='Post-injury pain relief'
        )
        # 2. 29 Sept 2026 08:15 - Amoxicillin 500 mg, AMX001, 2 boxes, Dr. Sarah Chen
        disp_2 = Dispensation(
            dispensation_code='DSP-20260929-001',
            medicine_id=med_amoxicillin.id,
            batch_id=batch_amx001.id,
            pharmacist_id=sarah.id,
            quantity=2,
            dispensed_at=datetime(2026, 9, 29, 8, 15, 0, tzinfo=timezone.utc),
            patient_name='Prescription #4812',
            notes='Ear infection treatment course'
        )
        # 3. 29 Sept 2026 09:40 - Paracetamol 500 mg, PCM004, 5 boxes, Dr. Sarah Chen
        disp_3 = Dispensation(
            dispensation_code='DSP-20260929-002',
            medicine_id=med_paracetamol.id,
            batch_id=batch_pcm004.id,
            pharmacist_id=sarah.id,
            quantity=5,
            dispensed_at=datetime(2026, 9, 29, 9, 40, 0, tzinfo=timezone.utc),
            patient_name='Clinic Order',
            notes='Monthly primary care clinic stock replenishment'
        )
        # 4. 29 Sept 2026 11:05 - Amoxicillin 500 mg, AMX001, 1 boxes, Dr. James Park
        disp_4 = Dispensation(
            dispensation_code='DSP-20260929-003',
            medicine_id=med_amoxicillin.id,
            batch_id=batch_amx001.id,
            pharmacist_id=james.id,
            quantity=1,
            dispensed_at=datetime(2026, 9, 29, 11, 5, 0, tzinfo=timezone.utc),
            patient_name='Prescription #4820',
            notes='Dental abscess course'
        )
        db.session.add_all([disp_1, disp_2, disp_3, disp_4])

        # Seeding Initial Stock movements
        m1 = StockMovement(batch_id=batch_amx001.id, movement_type='RECEIVE', quantity_change=103, balance_after=103, reference='Initial shipment')
        m2 = StockMovement(batch_id=batch_amx002.id, movement_type='RECEIVE', quantity_change=50, balance_after=50, reference='Restock shipment')
        m3 = StockMovement(batch_id=batch_pcm004.id, movement_type='RECEIVE', quantity_change=85, balance_after=85, reference='Initial shipment')
        m4 = StockMovement(batch_id=batch_ibu023.id, movement_type='RECEIVE', quantity_change=23, balance_after=23, reference='Initial shipment')
        db.session.add_all([m1, m2, m3, m4])

        db.session.commit()
        print("Database seeded successfully with authentic Figma data!")
        print(f"Total Medicines: {Medicine.query.count()} (Total stock: {sum(m.total_stock for m in Medicine.query.all())} boxes)")
        print(f"Total Batches: {Batch.query.count()}")
        print(f"Total Dispensations: {Dispensation.query.count()}")

if __name__ == '__main__':
    seed_database()
