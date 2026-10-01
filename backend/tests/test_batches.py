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
