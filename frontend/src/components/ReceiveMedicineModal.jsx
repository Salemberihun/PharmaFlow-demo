import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ReceiveMedicineModal({ isOpen, onClose, onSuccess, existingMedicines = [] }) {
  const [isNewMedicine, setIsNewMedicine] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getSuppliers().then(res => setSuppliers(res.suppliers || [])).catch(() => {});
      setError('');
      if (existingMedicines.length > 0 && !selectedMedicineId) {
        setSelectedMedicineId(existingMedicines[0].id);
      }
    }
  }, [isOpen, existingMedicines]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!batchNumber.trim()) {
      setError('Batch number is required');
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      setError('Please enter a valid positive quantity');
      return;
    }
    if (!expiryDate) {
      setError('Expiry date is required');
      return;
    }

    const payload = {
      batch_number: batchNumber.trim().toUpperCase(),
      quantity: parseInt(quantity),
      expiry_date: expiryDate,
      unit_price: unitPrice ? parseFloat(unitPrice) : null,
      supplier_id: supplierId ? parseInt(supplierId) : null,
    };

    if (isNewMedicine) {
      if (!name.trim() || !strength.trim()) {
        setError('Medicine name and strength are required');
        return;
      }
      payload.medicine_name = name.trim();
      payload.strength = strength.trim();
    } else {
      if (!selectedMedicineId) {
        setError('Please select a medicine');
        return;
      }
      payload.medicine_id = parseInt(selectedMedicineId);
    }

    try {
      setLoading(true);
      await api.receiveBatch(payload);
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to receive medicine');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Receive Medicine Batch</h2>
            <p className="text-xs text-slate-500">Record inbound inventory batch into stock</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsNewMedicine(false)}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                !isNewMedicine ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Existing Medicine
            </button>
            <button
              type="button"
              onClick={() => setIsNewMedicine(true)}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                isNewMedicine ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              + New Medicine
            </button>
          </div>

          {!isNewMedicine ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SELECT MEDICINE</label>
              <select
                value={selectedMedicineId}
                onChange={(e) => setSelectedMedicineId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
              >
                {existingMedicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.strength}) — Current: {m.total_stock} {m.unit}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">MEDICINE NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Ciprofloxacin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">STRENGTH</label>
                <input
                  type="text"
                  placeholder="e.g. 250 mg"
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* Batch & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">BATCH NUMBER</label>
              <input
                type="text"
                placeholder="e.g. AMX003"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">QUANTITY (BOXES)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Expiry Date & Unit Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">EXPIRY DATE</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UNIT PRICE ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 12.50"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">SUPPLIER (OPTIONAL)</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Receiving...' : 'Add to Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
