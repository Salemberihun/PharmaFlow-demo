def test_get_medicines_empty(client, db_session):
    response = client.get('/api/medicines')
    assert response.status_code == 200
    data = response.get_json()
    assert data['total'] == 0
    assert data['medicines'] == []

def test_create_and_get_medicine(client, sample_data):
    # Test creating new medicine
    payload = {
        'name': 'Paracetamol',
        'strength': '500 mg',
        'unit': 'boxes',
        'min_stock_level': 25,
        'description': 'Analgesic tablet'
    }
    create_res = client.post('/api/medicines', json=payload)
    assert create_res.status_code == 201
    created_data = create_res.get_json()
    assert created_data['name'] == 'Paracetamol'
    assert created_data['strength'] == '500 mg'
    med_id = created_data['id']

    # Test retrieving single medicine
    get_res = client.get(f'/api/medicines/{med_id}')
    assert get_res.status_code == 200
    assert get_res.get_json()['name'] == 'Paracetamol'

def test_create_duplicate_medicine_conflict(client, sample_data):
    # Amoxicillin 500 mg already exists in sample_data
    payload = {'name': 'Amoxicillin', 'strength': '500 mg'}
    res = client.post('/api/medicines', json=payload)
    assert res.status_code == 409

def test_create_medicine_missing_fields_validation(client, db_session):
    res = client.post('/api/medicines', json={'name': 'Aspirin'})
    assert res.status_code == 400
    data = res.get_json()
    assert 'required' in data['message']

def test_update_medicine(client, sample_data):
    med_id = sample_data['medicines'][0].id
    res = client.put(f'/api/medicines/{med_id}', json={'min_stock_level': 50})
    assert res.status_code == 200
    assert res.get_json()['min_stock_level'] == 50

def test_delete_medicine(client, sample_data):
    med_id = sample_data['medicines'][0].id
    res = client.delete(f'/api/medicines/{med_id}')
    assert res.status_code == 200

    # Ensure 404 on subsequent get
    get_res = client.get(f'/api/medicines/{med_id}')
    assert get_res.status_code == 404

def test_search_medicines(client, sample_data):
    res = client.get('/api/medicines?search=amox')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] == 1
    assert data['medicines'][0]['name'] == 'Amoxicillin'

def test_filter_medicines_by_status(client, sample_data):
    # Ibuprofen has 20 boxes < min_stock_level 25 -> Low Stock
    res = client.get('/api/medicines?status=low_stock')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] == 1
    assert data['medicines'][0]['name'] == 'Ibuprofen'

def test_get_medicine_by_gtin(client, sample_data):
    # Update sample medicine with gtin
    med_id = sample_data['medicines'][0].id
    client.put(f'/api/medicines/{med_id}', json={'gtin': '08435123456789'})

    # Search with exact GTIN
    res = client.get('/api/medicines?gtin=08435123456789')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] == 1
    assert data['medicines'][0]['id'] == med_id

    # Search with unpadded GTIN
    res_unpadded = client.get('/api/medicines?gtin=8435123456789')
    assert res_unpadded.status_code == 200
    assert res_unpadded.get_json()['total'] == 1

def test_create_medicine_with_gtin(client, db_session):
    payload = {
        'name': 'Cefixime',
        'strength': '200 mg',
        'gtin': '01234567899999',
        'barcode': '01234567899999'
    }
    res = client.post('/api/medicines', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data['gtin'] == '01234567899999'
    assert data['barcode'] == '01234567899999'
