def test_reports_inventory(client, sample_data):
    res = client.get('/api/reports/inventory')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total_medicines'] == 2
    assert data['total_stock_boxes'] == 120

def test_reports_daily(client, sample_data):
    res = client.get('/api/reports/daily')
    assert res.status_code == 200
    data = res.get_json()
    assert 'total_transactions' in data
    assert 'total_boxes' in data
    assert 'items' in data

def test_reports_expiring(client, sample_data):
    res = client.get('/api/reports/expiring?days=365')
    assert res.status_code == 200
    data = res.get_json()
    assert 'batches' in data
