def test_dispense_medicine_success(client, sample_data):
    med_id = sample_data['medicines'][0].id
    batch_id = sample_data['batches'][0].id
    user_id = sample_data['user'].id

    payload = {
        'medicine_id': med_id,
        'batch_id': batch_id,
        'quantity': 5,
        'pharmacist_id': user_id,
        'patient_name': 'John Doe',
        'notes': 'Test dispensation'
    }
    res = client.post('/api/dispensing', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert data['remaining_batch_stock'] == 95  # 100 - 5 = 95

def test_dispense_insufficient_stock(client, sample_data):
    med_id = sample_data['medicines'][1].id  # Ibuprofen (20 boxes)
    batch_id = sample_data['batches'][1].id

    payload = {
        'medicine_id': med_id,
        'batch_id': batch_id,
        'quantity': 30  # more than 20
    }
    res = client.post('/api/dispensing', json=payload)
    assert res.status_code == 400
    assert 'Insufficient' in res.get_json()['message']

def test_dispensing_history_filter(client, sample_data):
    med_id = sample_data['medicines'][0].id
    batch_id = sample_data['batches'][0].id
    user_id = sample_data['user'].id

    # Create a dispensation
    client.post('/api/dispensing', json={
        'medicine_id': med_id,
        'batch_id': batch_id,
        'quantity': 2,
        'pharmacist_id': user_id
    })

    # Retrieve history
    res = client.get('/api/dispensing')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] == 1
    assert data['transactions'][0]['quantity'] == 2

    # Filter with query
    search_res = client.get('/api/dispensing?search=Amoxicillin')
    assert search_res.status_code == 200
    assert search_res.get_json()['total'] == 1

    search_empty = client.get('/api/dispensing?search=NonExistent')
    assert search_empty.status_code == 200
    assert search_empty.get_json()['total'] == 0
