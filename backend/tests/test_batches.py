def test_get_batches(client, sample_data):
    res = client.get('/api/batches')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] == 2

def test_receive_new_batch(client, sample_data):
    med_id = sample_data['medicines'][0].id
    payload = {
        'batch_number': 'AMX099',
        'medicine_id': med_id,
        'quantity': 50,
        'expiry_date': '2027-10-31',
        'unit_price': 14.00
    }
    res = client.post('/api/batches', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data['batch_number'] == 'AMX099'
    assert data['quantity'] == 50

def test_receive_duplicate_batch_number(client, sample_data):
    # AMX001 already exists
    med_id = sample_data['medicines'][0].id
    payload = {
        'batch_number': 'AMX001',
        'medicine_id': med_id,
        'quantity': 30,
        'expiry_date': '2027-10-31'
    }
    res = client.post('/api/batches', json=payload)
    assert res.status_code == 409

def test_receive_batch_missing_fields_validation(client, sample_data):
    res = client.post('/api/batches', json={'batch_number': 'NEW01'})
    assert res.status_code == 400

def test_receive_new_batch_with_strips(client, sample_data):
    med_id = sample_data['medicines'][0].id
    payload = {
        'batch_number': 'AMX100',
        'medicine_id': med_id,
        'quantity': 25,
        'number_of_strips': 12,
        'expiry_date': '2028-01-15',
        'unit_price': 15.50
    }
    res = client.post('/api/batches', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data['batch_number'] == 'AMX100'
    assert data['quantity'] == 25
    assert data['number_of_strips'] == 12

def test_receive_batch_with_generic_and_brand_name(client, sample_data):
    payload = {
        'batch_number': 'AZI001',
        'generic_name': 'Azithromycin',
        'brand_name': 'Zithromax',
        'strength': '250 mg',
        'quantity': 40,
        'number_of_strips': 6,
        'expiry_date': '2027-12-31',
        'unit_price': 22.00
    }
    res = client.post('/api/batches', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data['batch_number'] == 'AZI001'
    assert data['number_of_strips'] == 6
    assert data['medicine_generic_name'] == 'Azithromycin'
    assert data['medicine_brand_name'] == 'Zithromax'

    # Verify medicine was also created with generic_name, brand_name, number_of_strips
    med_res = client.get(f"/api/medicines/{data['medicine_id']}")
    assert med_res.status_code == 200
    med_data = med_res.get_json()
    assert med_data['generic_name'] == 'Azithromycin'
    assert med_data['brand_name'] == 'Zithromax'
    assert med_data['number_of_strips'] == 6
