import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseBarcode, formatGS1Date } from './barcodeParser.js';

describe('formatGS1Date', () => {
  test('formats standard YYMMDD date', () => {
    assert.equal(formatGS1Date('270630'), '2027-06-30');
    assert.equal(formatGS1Date('281231'), '2028-12-31');
    assert.equal(formatGS1Date('260515'), '2026-05-15');
  });

  test('handles GS1 day 00 as last day of month', () => {
    // Non-leap year February (2027) -> 28 days
    assert.equal(formatGS1Date('270200'), '2027-02-28');
    // Leap year February (2028) -> 29 days
    assert.equal(formatGS1Date('280200'), '2028-02-29');
    // April has 30 days
    assert.equal(formatGS1Date('270400'), '2027-04-30');
    // December has 31 days
    assert.equal(formatGS1Date('271200'), '2027-12-31');
  });

  test('returns null for invalid dates', () => {
    assert.equal(formatGS1Date(''), null);
    assert.equal(formatGS1Date(null), null);
    assert.equal(formatGS1Date('123'), null);
    assert.equal(formatGS1Date('271330'), null); // Month 13 is invalid
  });
});

describe('parseBarcode - 2D GS1 DataMatrix', () => {
  test('parses standard bracketed GS1 DataMatrix', () => {
    const input = '(01)08435123456789(17)270630(10)AMX003';
    const result = parseBarcode(input);

    assert.equal(result.gtin, '08435123456789');
    assert.equal(result.batchNumber, 'AMX003');
    assert.equal(result.expiryDate, '2027-06-30');
    assert.equal(result.is2D, true);
  });

  test('parses bracketed GS1 DataMatrix with different AI order', () => {
    const input = '(01)01234567890128(10)PCM-LOT99(17)281231';
    const result = parseBarcode(input);

    assert.equal(result.gtin, '01234567890128');
    assert.equal(result.batchNumber, 'PCM-LOT99');
    assert.equal(result.expiryDate, '2028-12-31');
    assert.equal(result.is2D, true);
  });

  test('strips symbology prefix ]d2, ]Q3, ]C1', () => {
    const input = ']d2(01)08435123456789(17)270630(10)AMX003';
    const result = parseBarcode(input);

    assert.equal(result.gtin, '08435123456789');
    assert.equal(result.batchNumber, 'AMX003');
    assert.equal(result.expiryDate, '2027-06-30');
    assert.equal(result.is2D, true);
  });

  test('parses raw GS1 element string without parentheses', () => {
    const input = '01084351234567891727063010AMX003';
    const result = parseBarcode(input);

    assert.equal(result.gtin, '08435123456789');
    assert.equal(result.batchNumber, 'AMX003');
    assert.equal(result.expiryDate, '2027-06-30');
    assert.equal(result.is2D, true);
  });

  test('parses raw GS1 element string with GS (\\x1d) separator', () => {
    const input = '010843512345678910LOT-ABC-123\x1d17270630';
    const result = parseBarcode(input);

    assert.equal(result.gtin, '08435123456789');
    assert.equal(result.batchNumber, 'LOT-ABC-123');
    assert.equal(result.expiryDate, '2027-06-30');
    assert.equal(result.is2D, true);
  });
});

describe('parseBarcode - 1D Barcodes', () => {
  test('parses EAN-13 barcode as direct GTIN', () => {
    const result = parseBarcode('5012345678900');
    assert.equal(result.gtin, '5012345678900');
    assert.equal(result.batchNumber, null);
    assert.equal(result.expiryDate, null);
    assert.equal(result.is2D, false);
  });

  test('parses UPC-A barcode as direct GTIN', () => {
    const result = parseBarcode('012345678905');
    assert.equal(result.gtin, '012345678905');
    assert.equal(result.is2D, false);
  });

  test('parses GTIN-14 barcode as direct GTIN', () => {
    const result = parseBarcode('05012345678900');
    assert.equal(result.gtin, '05012345678900');
    assert.equal(result.is2D, false);
  });

  test('handles null or empty inputs gracefully', () => {
    assert.equal(parseBarcode(null).gtin, null);
    assert.equal(parseBarcode('').gtin, null);
  });
});
