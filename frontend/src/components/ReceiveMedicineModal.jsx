import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  AlertCircle,
  Camera,
  ScanBarcode,
  CheckCircle2,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { parseBarcode } from '../utils/barcodeParser';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import CameraScannerModal from './CameraScannerModal';

export default function ReceiveMedicineModal({
  isOpen,
  onClose,
  onSuccess,
  existingMedicines = [],
}) {
  const [isNewMedicine, setIsNewMedicine] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [numberOfStrips, setNumberOfStrips] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Barcode & scanning states
  const [scannedGtin, setScannedGtin] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scannedFeedback, setScannedFeedback] = useState(null);
  const [highlightQuantity, setHighlightQuantity] = useState(false);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  const quantityInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      api
        .getSuppliers()
        .then((res) => setSuppliers(res.suppliers || []))
        .catch(() => {});
      setError('');
      setScanMessage('');
      setScannedFeedback(null);
      setScannedGtin('');
      if (existingMedicines.length > 0) {
        setSelectedMedicineId(existingMedicines[0].id);
      }
    } else {
      setGenericName('');
      setBrandName('');
      setStrength('');
      setBatchNumber('');
      setQuantity('');
      setNumberOfStrips('');
      setExpiryDate('');
      setUnitPrice('');
      setSupplierId('');
      setError('');
      setScanMessage('');
      setScannedFeedback(null);
      setScannedGtin('');
      setIsCameraOpen(false);
      setShowSimulateMenu(false);
      setHighlightQuantity(false);
    }
  }, [isOpen, existingMedicines]);

  /**
   * Core barcode & GS1 DataMatrix scanning handler.
   * Invoked by hardware keyboard-wedge scanner, camera scanner, or manual test scan.
   */
  const handleScan = async (scannedCode) => {
    if (!scannedCode || !scannedCode.trim()) return;

    setError('');
    const parsed = parseBarcode(scannedCode);
    const gtin = parsed.gtin;
    setScannedGtin(gtin || '');

    let foundMedicine = null;

    // 1. Query database/catalog by the scanned GTIN
    if (gtin) {
      const unpadded = gtin.replace(/^0+/, '');
      const padded14 = gtin.padStart(14, '0');

      // Check existingMedicines prop first
      foundMedicine = existingMedicines.find((m) => {
        const mGtin = (m.gtin || '').toString();
        const mBarcode = (m.barcode || '').toString();
        return (
          mGtin === gtin ||
          mGtin === unpadded ||
          mGtin === padded14 ||
          mBarcode === gtin ||
          mBarcode === unpadded ||
          mBarcode === padded14
        );
      });

      // If not in local list, query API by GTIN
      if (!foundMedicine) {
        try {
          const res = await api.getMedicines({ gtin });
          if (res.medicines && res.medicines.length > 0) {
            foundMedicine = res.medicines[0];
          }
        } catch (err) {
          console.warn('Error querying medicine catalog by GTIN:', err);
        }
      }
    }

    const feedbackParts = [];

    // 2. If found, auto-fill Generic Name, Brand Name, and Strength
    if (foundMedicine) {
      const gen = foundMedicine.generic_name || foundMedicine.name || '';
      const brand = foundMedicine.brand_name || '';
      const str = foundMedicine.strength || '';

      setGenericName(gen);
      setBrandName(brand);
      setStrength(str);

      // Select in dropdown and switch to Existing Medicine mode
      setSelectedMedicineId(foundMedicine.id);
      setIsNewMedicine(false);

      const medDisplayName = brand && gen ? `${brand} (${gen})` : brand || gen;
      feedbackParts.push(`${medDisplayName} ${str}`);
    } else if (gtin) {
      // Not yet cataloged: switch to New Medicine tab to allow registration
      setIsNewMedicine(true);
      feedbackParts.push(`GTIN ${gtin}`);
    }

    // 3. If parsed from a 2D code, auto-fill Batch Number and Expiry Date
    if (parsed.batchNumber) {
      setBatchNumber(parsed.batchNumber);
      feedbackParts.push(`Batch ${parsed.batchNumber}`);
    }
    if (parsed.expiryDate) {
      setExpiryDate(parsed.expiryDate);
      feedbackParts.push(`Exp ${parsed.expiryDate}`);
    }

    // 4. Automatically jump focus to Quantity (Boxes) input field
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
        if (typeof quantityInputRef.current.select === 'function') {
          quantityInputRef.current.select();
        }
      }
    }, 120);

    // 5. Visual success indicator
    const feedbackSummary = feedbackParts.join(' · ') || 'Scan processed';
    setScannedFeedback({
      code: gtin || parsed.raw,
      summary: feedbackSummary,
      is2D: parsed.is2D,
      foundInCatalog: !!foundMedicine,
    });
    setScanMessage(`Scanned: ${feedbackSummary}`);
    setHighlightQuantity(true);

    setTimeout(() => {
      setHighlightQuantity(false);
    }, 3000);

    setTimeout(() => {
      setScanMessage('');
    }, 5000);
  };

  // Hardware scanner listener: active only when modal is open and camera modal is not active
  useBarcodeScanner({
    isOpen: isOpen && !isCameraOpen,
    onScan: handleScan,
    maxInterval: 50,
    minLength: 3,
  });

  if (!isOpen) return null;

  const selectedMedicine = existingMedicines.find(
    (m) => m.id === parseInt(selectedMedicineId)
  );

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
    if (numberOfStrips && parseInt(numberOfStrips) <= 0) {
      setError('Please enter a valid positive number of strips');
      return;
    }
    if (!expiryDate) {
      setError('Expiry date is required');
      return;
    }

    const payload = {
      batch_number: batchNumber.trim().toUpperCase(),
      quantity: parseInt(quantity),
      number_of_strips: numberOfStrips ? parseInt(numberOfStrips) : null,
      expiry_date: expiryDate,
      unit_price: unitPrice ? parseFloat(unitPrice) : null,
      supplier_id: supplierId ? parseInt(supplierId) : null,
    };

    if (isNewMedicine) {
      if (!genericName.trim() && !brandName.trim()) {
        setError('Generic name or brand name is required');
        return;
      }
      if (!strength.trim()) {
        setError('Strength is required');
        return;
      }
      payload.generic_name = genericName.trim() || null;
      payload.brand_name = brandName.trim() || null;
      payload.medicine_name = brandName.trim() || genericName.trim();
      payload.strength = strength.trim();
      if (scannedGtin) {
        payload.gtin = scannedGtin;
        payload.barcode = scannedGtin;
      }
    } else {
      if (!selectedMedicineId) {
        setError('Please select a medicine');
        return;
      }
      payload.medicine_id = parseInt(selectedMedicineId);
      if (scannedGtin) {
        payload.gtin = scannedGtin;
        payload.barcode = scannedGtin;
      }
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
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Receive Medicine Batch
              </h2>
              <p className="text-xs text-slate-500">
                Record inbound inventory batch into stock
              </p>
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
                  !isNewMedicine
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Existing Medicine
              </button>
              <button
                type="button"
                onClick={() => setIsNewMedicine(true)}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  isNewMedicine
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                + New Medicine
              </button>
            </div>

            {/* Scanning Section: Directly underneath the tab toggle */}
            <div
              className={`p-3 rounded-lg border transition-all duration-300 ${
                highlightQuantity
                  ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30'
                  : 'bg-slate-50/90 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      highlightQuantity
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white border border-slate-200 text-teal-600 shadow-2xs'
                    }`}
                  >
                    <ScanBarcode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            highlightQuantity ? 'bg-emerald-400' : 'bg-teal-400'
                          }`}
                        ></span>
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${
                            highlightQuantity ? 'bg-emerald-500' : 'bg-teal-500'
                          }`}
                        ></span>
                      </span>
                      <span
                        className={`text-xs font-medium truncate ${
                          highlightQuantity
                            ? 'text-emerald-800 font-semibold'
                            : 'text-slate-700'
                        }`}
                      >
                        {scanMessage ||
                          'Ready to scan (or click to scan with camera)'}
                      </span>
                    </div>

                    {scannedFeedback ? (
                      <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                        {scannedFeedback.summary}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        Hardware barcode scanner or camera ready · GS1 2D & 1D
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Camera Scanner Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md shadow-2xs hover:border-slate-300 transition-colors"
                    title="Scan using device camera"
                  >
                    <Camera className="w-3.5 h-3.5 text-teal-600" />
                    <span>Camera</span>
                  </button>

                  {/* Test Barcode Dropdown Menu (for rapid testing without physical scanner) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSimulateMenu(!showSimulateMenu)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                      title="Quick test barcode presets"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {showSimulateMenu && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 text-xs">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Test Barcode Presets
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleScan('(01)08435123456789(17)270630(10)AMX003');
                            setShowSimulateMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-teal-50 hover:text-teal-700 text-slate-700 flex flex-col"
                        >
                          <span className="font-semibold">Amoxicillin 500 mg (GS1 2D)</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            GTIN 08435123456789 · Exp 2027-06-30
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleScan('(01)01234567890128(17)281231(10)PCM004');
                            setShowSimulateMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-teal-50 hover:text-teal-700 text-slate-700 flex flex-col"
                        >
                          <span className="font-semibold">Paracetamol 500 mg (GS1 2D)</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            GTIN 01234567890128 · Exp 2028-12-31
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleScan('01076401234567891727073110IBU023');
                            setShowSimulateMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-teal-50 hover:text-teal-700 text-slate-700 flex flex-col"
                        >
                          <span className="font-semibold">Ibuprofen 400 mg (Raw GS1)</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            GTIN 07640123456789 · Exp 2027-07-31
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleScan('08435123456789');
                            setShowSimulateMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-teal-50 hover:text-teal-700 text-slate-700 flex flex-col border-t border-slate-100"
                        >
                          <span className="font-semibold">Standard 1D Barcode</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            EAN/UPC: 08435123456789
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Success Toast / Notification Banner */}
              {scannedFeedback && (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {scannedFeedback.foundInCatalog
                        ? 'Medicine identified & form populated!'
                        : 'Unregistered barcode — entered into new medicine form!'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    {scannedFeedback.is2D ? 'GS1 DataMatrix' : '1D Barcode'}
                  </span>
                </div>
              )}
            </div>

            {!isNewMedicine ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SELECT MEDICINE
                </label>
                <select
                  value={selectedMedicineId}
                  onChange={(e) => setSelectedMedicineId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  {existingMedicines.map((m) => {
                    const displayName =
                      m.brand_name && m.generic_name
                        ? `${m.brand_name} (${m.generic_name})`
                        : m.brand_name || m.generic_name || m.name;
                    return (
                      <option key={m.id} value={m.id}>
                        {displayName} ({m.strength}) — Current: {m.total_stock}{' '}
                        {m.unit}
                      </option>
                    );
                  })}
                </select>
                {selectedMedicine && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Generic:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {selectedMedicine.generic_name || selectedMedicine.name}
                      </span>
                    </div>
                    {selectedMedicine.brand_name && (
                      <div>
                        <span className="text-slate-400">Brand:</span>{' '}
                        <span className="font-medium text-slate-800">
                          {selectedMedicine.brand_name}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">Strength:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {selectedMedicine.strength}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GENERIC NAME
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin"
                      value={genericName}
                      onChange={(e) => setGenericName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      BRAND NAME
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxil"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    STRENGTH
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500 mg"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            {/* Batch Number & Expiry Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  BATCH NUMBER
                </label>
                <input
                  type="text"
                  placeholder="e.g. AMX003"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  EXPIRY DATE
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            {/* Quantity & Number of Strips */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>QUANTITY (BOXES)</span>
                  {highlightQuantity && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-3 h-3" /> Focus here
                    </span>
                  )}
                </label>
                <input
                  ref={quantityInputRef}
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                    highlightQuantity
                      ? 'border-emerald-500 ring-3 ring-emerald-400/30 bg-emerald-50/20'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NUMBER OF STRIPS
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 10"
                  value={numberOfStrips}
                  onChange={(e) => setNumberOfStrips(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Unit Price & Supplier */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UNIT PRICE ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 12.50"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SUPPLIER (OPTIONAL)
                </label>
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

      {/* In-Browser Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}
