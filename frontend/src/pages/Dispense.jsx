import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function Dispense({ onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pharmacists, setPharmacists] = useState([]);
  const [selectedPharmacistId, setSelectedPharmacistId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  // Load pharmacists on mount
  useEffect(() => {
    api.getUsers()
      .then((res) => {
        const users = res.users || [];
        setPharmacists(users);
        if (users.length > 0) setSelectedPharmacistId(users[0].id);
      })
      .catch(console.error);
  }, []);

  // Search medicines dynamically
  useEffect(() => {
    if (!searchTerm.trim()) {
      setMedicines([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.getMedicines({ search: searchTerm.trim(), include_batches: true });
        setMedicines(res.medicines || []);
      } catch (err) {
        console.error(err);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // When medicine is selected, load its batches
  const handleSelectMedicine = async (med) => {
    setSelectedMedicine(med);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.getBatches({ medicine_id: med.id, active_only: 'true' });
      const bList = res.batches || [];
      setBatches(bList);
      if (bList.length > 0) {
        setSelectedBatchId(bList[0].id); // Select FEFO (first expiring)
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!selectedMedicine) {
      setError('Please select a medicine');
      return;
    }

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setError('Please enter a valid positive quantity');
      return;
    }

    const activeBatch = batches.find((b) => b.id === parseInt(selectedBatchId));
    if (activeBatch && qty > activeBatch.quantity) {
      setError(`Quantity exceeds batch available stock (${activeBatch.quantity} boxes available)`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.dispenseMedicine({
        medicine_id: selectedMedicine.id,
        batch_id: selectedBatchId ? parseInt(selectedBatchId) : null,
        quantity: qty,
        pharmacist_id: selectedPharmacistId ? parseInt(selectedPharmacistId) : null,
        patient_name: patientName.trim(),
        notes: notes.trim(),
      });
      setLoading(false);
      setSuccessMessage({
        text: `Successfully dispensed ${qty} ${selectedMedicine.unit} of ${selectedMedicine.name} ${selectedMedicine.strength}`,
        details: res.dispensation,
      });

      // Reset form
      setQuantity('');
      setPatientName('');
      setNotes('');
      // Reload batches
      handleSelectMedicine(selectedMedicine);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Dispensing failed');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dispense Medicine</h1>
        <p className="text-sm text-slate-500 mt-0.5">Search, select batch, and confirm dispensing</p>
      </div>

      {/* Main Dispensing Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Find Medicine
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or strength..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-teal-500 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Search Results Dropdown List */}
        {searchTerm.trim() && (
          <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {medicines.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center">
                No matching medicines found for "{searchTerm}".
              </div>
            ) : (
              medicines.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => handleSelectMedicine(med)}
                  className={`w-full flex items-center justify-between p-3.5 text-left transition-colors ${
                    selectedMedicine?.id === med.id
                      ? 'bg-teal-50/70 border-l-4 border-l-teal-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="text-sm font-semibold text-slate-900">{med.name}</span>
                    <span className="text-xs text-slate-500 ml-2">({med.total_stock} {med.unit} available)</span>
                  </div>
                  <span className="text-sm text-slate-600 font-medium">{med.strength}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Selected Medicine Dispensing Form */}
        {selectedMedicine && (
          <form onSubmit={handleDispense} className="pt-4 border-t border-slate-100 space-y-4">
            <div className="p-4 bg-teal-50/50 rounded-lg border border-teal-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">SELECTED MEDICINE</p>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedMedicine.name} <span className="text-slate-600 font-normal">{selectedMedicine.strength}</span>
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Available Stock</span>
                <p className="text-base font-bold text-teal-700">{selectedMedicine.total_stock} {selectedMedicine.unit}</p>
              </div>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{successMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('history')}
                  className="font-bold underline hover:text-emerald-900 inline-flex items-center gap-1"
                >
                  View History <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Batch & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  BATCH (FEFO RECOMMENDATION)
                </label>
                {batches.length === 0 ? (
                  <p className="text-xs text-red-500 py-2">No active batches available with stock.</p>
                ) : (
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batch_number} — {b.quantity} boxes (Exp: {b.expiry_date})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  QUANTITY TO DISPENSE ({selectedMedicine.unit.toUpperCase()})
                </label>
                <input
                  type="number"
                  min="1"
                  max={batches.find((b) => b.id === parseInt(selectedBatchId))?.quantity || selectedMedicine.total_stock}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Pharmacist & Patient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  DISPENSING PHARMACIST
                </label>
                <select
                  value={selectedPharmacistId}
                  onChange={(e) => setSelectedPharmacistId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                >
                  {pharmacists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PATIENT / RX REF (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Walk-in or RX #1234"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Confirm Dispense Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading || selectedMedicine.total_stock === 0}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Processing...' : 'Confirm Dispensing'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
