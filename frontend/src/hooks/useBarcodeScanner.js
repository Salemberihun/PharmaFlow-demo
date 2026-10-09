import { useEffect, useRef } from 'react';

/**
 * Hook to listen for USB/Bluetooth hardware barcode scanner input (keyboard wedge).
 *
 * Physical scanners simulate a keyboard and transmit characters in rapid succession
 * (< 50ms between keystrokes) followed by an 'Enter' key.
 *
 * @param {Object} options
 * @param {boolean} options.isOpen - Whether the modal / listener is active
 * @param {Function} options.onScan - Callback invoked with the scanned string
 * @param {number} [options.maxInterval=50] - Max milliseconds between keystrokes to qualify as scanner
 * @param {number} [options.minLength=3] - Minimum length of scanned barcode string
 */
export function useBarcodeScanner({
  isOpen = true,
  onScan,
  maxInterval = 50,
  minLength = 3,
}) {
  const bufferRef = useRef([]);
  const lastKeyTimeRef = useRef(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!isOpen) {
      bufferRef.current = [];
      lastKeyTimeRef.current = 0;
      return;
    }

    const handleKeyDown = (e) => {
      // Ignore modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
        return;
      }

      const now = performance.now();

      if (e.key === 'Enter') {
        const buffer = bufferRef.current;
        const lastKeyTime = lastKeyTimeRef.current;

        // Check if buffer meets scanner criteria:
        // 1. At least minLength characters
        // 2. Keystrokes were rapid (< maxInterval ms apart)
        // 3. Enter key arrived quickly after the last character (< 100ms)
        if (buffer.length >= minLength && (now - lastKeyTime) < 120) {
          // Check intervals between consecutive characters in buffer
          let isRapid = true;
          for (let i = 1; i < buffer.length; i++) {
            const interval = buffer[i].time - buffer[i - 1].time;
            if (interval > maxInterval) {
              isRapid = false;
              break;
            }
          }

          if (isRapid) {
            // Prevent Enter from submitting the form or triggering default behavior
            e.preventDefault();
            e.stopPropagation();

            const scannedText = buffer.map((item) => item.char).join('');

            // If the user happened to have an input or textarea focused,
            // clean up the scanned characters from the input field so it's not polluted.
            const activeEl = document.activeElement;
            if (
              activeEl &&
              (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
            ) {
              const currentValue = activeEl.value || '';
              if (currentValue.endsWith(scannedText)) {
                const cleanedValue = currentValue.slice(0, -scannedText.length);
                const nativeSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype,
                  'value'
                )?.set;
                if (nativeSetter) {
                  nativeSetter.call(activeEl, cleanedValue);
                } else {
                  activeEl.value = cleanedValue;
                }
                activeEl.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }

            // Clear buffer
            bufferRef.current = [];
            lastKeyTimeRef.current = 0;

            // Trigger scan callback
            if (onScanRef.current) {
              onScanRef.current(scannedText);
            }
            return;
          }
        }

        // Not a scanner burst, reset buffer and allow normal Enter
        bufferRef.current = [];
        lastKeyTimeRef.current = 0;
        return;
      }

      // Handle single printable characters or control characters (e.g. GS \x1d)
      if (e.key.length === 1) {
        const timeSinceLast = now - lastKeyTimeRef.current;

        if (timeSinceLast <= maxInterval) {
          // Rapid keystroke: append to current burst buffer
          bufferRef.current.push({
            char: e.key,
            time: now,
          });
        } else {
          // Too slow for a scanner burst: start fresh burst buffer with this keystroke
          bufferRef.current = [
            {
              char: e.key,
              time: now,
            },
          ];
        }

        lastKeyTimeRef.current = now;
      }
    };

    // Use capture phase to intercept before native input listeners
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      bufferRef.current = [];
      lastKeyTimeRef.current = 0;
    };
  }, [isOpen, maxInterval, minLength]);
}
