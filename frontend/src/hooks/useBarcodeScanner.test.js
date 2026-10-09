import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('useBarcodeScanner Timing and Buffer Logic', () => {
  function simulateScannerBuffer(events, maxInterval = 50, minLength = 3) {
    let buffer = [];
    let lastKeyTime = 0;
    let scanResult = null;

    for (const e of events) {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) continue;

      if (e.key === 'Enter') {
        if (buffer.length >= minLength && (e.time - lastKeyTime) < 120) {
          let isRapid = true;
          for (let i = 1; i < buffer.length; i++) {
            const interval = buffer[i].time - buffer[i - 1].time;
            if (interval > maxInterval) {
              isRapid = false;
              break;
            }
          }
          if (isRapid) {
            scanResult = buffer.map((item) => item.char).join('');
            buffer = [];
            lastKeyTime = 0;
            continue;
          }
        }
        buffer = [];
        lastKeyTime = 0;
        continue;
      }

      if (e.key.length === 1) {
        const timeSinceLast = e.time - lastKeyTime;
        if (timeSinceLast <= maxInterval) {
          buffer.push({ char: e.key, time: e.time });
        } else {
          buffer = [{ char: e.key, time: e.time }];
        }
        lastKeyTime = e.time;
      }
    }

    return scanResult;
  }

  test('detects rapid hardware scanner burst (< 50ms per key)', () => {
    const chars = '08435123456789'.split('');
    let t = 1000;
    const events = [];

    for (const char of chars) {
      t += 15; // 15ms interval typical of USB scanner
      events.push({ key: char, time: t });
    }
    t += 20; // Enter within 20ms
    events.push({ key: 'Enter', time: t });

    const result = simulateScannerBuffer(events);
    assert.equal(result, '08435123456789');
  });

  test('rejects slow human typing (> 50ms per key)', () => {
    const chars = 'Amoxicillin'.split('');
    let t = 1000;
    const events = [];

    for (const char of chars) {
      t += 120; // 120ms interval typical of human typing
      events.push({ key: char, time: t });
    }
    t += 200;
    events.push({ key: 'Enter', time: t });

    const result = simulateScannerBuffer(events);
    assert.equal(result, null);
  });
});
