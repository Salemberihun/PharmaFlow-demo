/**
 * Utility for parsing GS1 DataMatrix (2D) and standard 1D barcodes.
 * 
 * Supports:
 * - GS1 DataMatrix with parentheses: e.g. (01)08435123456789(17)270630(10)AMX003
 * - Raw GS1 Element Strings: e.g. 01084351234567891727063010AMX003 or with GS (\x1d)
 * - Symbology identifiers: e.g. ]d2, ]Q3, ]C1
 * - Standard 1D barcodes: EAN-13, UPC-A, GTIN-14, EAN-8, Code 128
 */

/**
 * Converts GS1 YYMMDD format to form date format (YYYY-MM-DD).
 * GS1 standard specifies:
 * - If DD is 00, it represents the last day of the given month.
 * - Century rule: years 00-49 map to 2000-2049 (pharma expiry dates are in future).
 *
 * @param {string} yymmdd - 6-digit GS1 date string
 * @returns {string|null} - Formatted ISO date string YYYY-MM-DD or null if invalid
 */
export function formatGS1Date(yymmdd) {
  if (!yymmdd || !/^\d{6}$/.test(yymmdd)) {
    return null;
  }

  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  let dd = parseInt(yymmdd.slice(4, 6), 10);

  if (mm < 1 || mm > 12) {
    return null;
  }

  // GS1 century rule: pharmaceutical expiry dates
  const fullYear = yy >= 70 ? 1900 + yy : 2000 + yy;

  // In GS1, DD = '00' indicates the last calendar day of the month
  const daysInMonth = new Date(fullYear, mm, 0).getDate();
  if (dd === 0 || dd > daysInMonth) {
    dd = daysInMonth;
  }

  const mmStr = String(mm).padStart(2, '0');
  const ddStr = String(dd).padStart(2, '0');

  return `${fullYear}-${mmStr}-${ddStr}`;
}

/**
 * Parses raw barcode / GS1 DataMatrix strings.
 *
 * @param {string} rawInput - Scanned raw barcode string
 * @returns {{
 *   gtin: string|null,
 *   batchNumber: string|null,
 *   expiryDate: string|null,
 *   rawExpiry: string|null,
 *   serialNumber: string|null,
 *   is2D: boolean,
 *   raw: string
 * }}
 */
export function parseBarcode(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      gtin: null,
      batchNumber: null,
      expiryDate: null,
      rawExpiry: null,
      serialNumber: null,
      is2D: false,
      raw: ''
    };
  }

  const trimmed = rawInput.trim();
  // Strip ISO/IEC symbology prefixes (e.g. ]d2 for GS1 DataMatrix, ]Q3 for GS1 QR, ]C1 for GS1-128)
  const cleanInput = trimmed.replace(/^\][a-zA-Z0-9]{2}/, '');

  let gtin = null;
  let batchNumber = null;
  let rawExpiry = null;
  let serialNumber = null;
  let is2D = false;

  // 1. Try Bracketed GS1 Format: e.g. (01)08435123456789(17)270630(10)AMX003
  if (cleanInput.includes('(') && cleanInput.includes(')')) {
    const aiRegex = /\((\d{2,4})\)([^\(\x1d]+)/g;
    let match;
    while ((match = aiRegex.exec(cleanInput)) !== null) {
      const ai = match[1];
      const val = match[2].trim();

      if (ai === '01') {
        gtin = val;
        is2D = true;
      } else if (ai === '17') {
        rawExpiry = val.slice(0, 6);
        is2D = true;
      } else if (ai === '10') {
        batchNumber = val;
        is2D = true;
      } else if (ai === '21') {
        serialNumber = val;
        is2D = true;
      }
    }
  }

  // 2. Try Raw GS1 Element String (with or without GS \x1d separator)
  if (!gtin && (cleanInput.startsWith('01') || cleanInput.includes('\x1d') || cleanInput.includes('\u001d'))) {
    // Normalise ASCII 29 group separator
    const gs = '\x1d';
    const normalized = cleanInput.replace(/[\u001d]/g, gs);
    let idx = 0;
    const len = normalized.length;

    while (idx < len) {
      // Skip group separators
      if (normalized[idx] === gs) {
        idx++;
        continue;
      }

      // Check AI 01: GTIN (Fixed 14 numeric digits)
      if (normalized.startsWith('01', idx) && idx + 16 <= len) {
        const potentialGtin = normalized.slice(idx + 2, idx + 16);
        if (/^\d{14}$/.test(potentialGtin)) {
          gtin = potentialGtin;
          is2D = true;
          idx += 16;
          continue;
        }
      }

      // Check AI 17: Expiration date (Fixed 6 numeric digits: YYMMDD)
      if (normalized.startsWith('17', idx) && idx + 8 <= len) {
        const potentialDate = normalized.slice(idx + 2, idx + 8);
        if (/^\d{6}$/.test(potentialDate)) {
          rawExpiry = potentialDate;
          is2D = true;
          idx += 8;
          continue;
        }
      }

      // Check AI 10: Batch / Lot number (Variable length up to 20 alphanumeric chars)
      if (normalized.startsWith('10', idx)) {
        is2D = true;
        const start = idx + 2;
        let end = normalized.indexOf(gs, start);

        if (end === -1) {
          // If no GS separator, check if subsequent string contains another known AI pattern
          // e.g. 17 followed by 6 digits or 21 followed by serial
          const remaining = normalized.slice(start);
          const ai17Match = remaining.match(/^(.*?)17(\d{6})(.*)$/);
          if (ai17Match) {
            batchNumber = ai17Match[1];
            rawExpiry = ai17Match[2];
            idx = start + batchNumber.length + 8;
            continue;
          } else {
            end = Math.min(len, start + 20);
          }
        }

        batchNumber = normalized.slice(start, end);
        idx = end < len && normalized[end] === gs ? end + 1 : end;
        continue;
      }

      // Check AI 21: Serial number (Variable length up to 20 chars)
      if (normalized.startsWith('21', idx)) {
        is2D = true;
        const start = idx + 2;
        let end = normalized.indexOf(gs, start);
        if (end === -1) {
          end = Math.min(len, start + 20);
        }
        serialNumber = normalized.slice(start, end);
        idx = end < len && normalized[end] === gs ? end + 1 : end;
        continue;
      }

      // If unrecognized AI at this position, advance to next separator or end
      const nextGs = normalized.indexOf(gs, idx);
      if (nextGs !== -1) {
        idx = nextGs + 1;
      } else {
        break;
      }
    }
  }

  // 3. Fallback: Standard 1D Barcodes (EAN-13, UPC-A, GTIN-14, EAN-8 or direct ID)
  if (!gtin) {
    const numericOnly = cleanInput.replace(/[-\s]/g, '');
    if (/^\d{8,14}$/.test(numericOnly)) {
      gtin = numericOnly;
      is2D = false;
    } else {
      // General barcode string fallback
      gtin = cleanInput;
      is2D = false;
    }
  }

  const expiryDate = rawExpiry ? formatGS1Date(rawExpiry) : null;

  return {
    gtin,
    batchNumber: batchNumber ? batchNumber.trim().toUpperCase() : null,
    expiryDate,
    rawExpiry,
    serialNumber: serialNumber ? serialNumber.trim() : null,
    is2D,
    raw: trimmed
  };
}
