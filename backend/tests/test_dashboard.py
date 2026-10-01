def test_dashboard_endpoint(client, sample_data):
    res = client.get('/api/dashboard')
    assert res.status_code == 200
    data = res.get_json()

    assert data['total_medicines'] == 2
    assert data['total_boxes'] == 120  # 100 + 20
    assert data['low_stock_count'] == 1  # Ibuprofen (20 < 25)
    assert len(data['low_stock_items']) == 1
    assert data['low_stock_items'][0]['name'] == 'Ibuprofen'
