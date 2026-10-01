from app.models.medicine import Medicine
from app.models.batch import Batch
from app.models.category import Category
from app.models.supplier import Supplier

def test_relationships_and_cascades(app, db_session, sample_data):
    med = sample_data['medicines'][0]
    batches = med.batches
    assert len(batches) == 1
    assert batches[0].batch_number == 'AMX001'

    # Verify category relationship
    assert med.category.name == 'Antibiotics'
    assert med in sample_data['category'].medicines

    # Verify supplier relationship
    assert batches[0].supplier.name == 'MedPharma Logistics'
