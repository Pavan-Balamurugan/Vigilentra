/**
 * QR code scan form with file upload support.
 * @module components/QRScanForm
 */

import { scanQR } from '../api/scan.js';
import { showToast } from './Toast.js';

/**
 * Create the QR code scan form with file upload.
 * @param {object} options
 * @param {Function} options.onResult - Callback with the scan result object.
 * @returns {HTMLElement} The form element.
 */
export function createQRScanForm({ onResult }) {
    const el = document.createElement('div');

    el.innerHTML = `
        <form id="qr-scan-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Upload QR Code Image</label>
                <div class="drop-zone" id="qr-drop-zone">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 text-slate-400">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                    </svg>
                    <p class="text-sm font-medium text-slate-600 mb-1">Drag and drop a QR code image here</p>
                    <p class="text-xs text-slate-400">or click to browse (PNG, JPG, GIF)</p>
                    <input type="file" id="qr-file-input" accept="image/*" class="hidden" />
                </div>
                <p id="qr-file-name" class="text-sm text-slate-500 mt-2 hidden"></p>
            </div>
            <div class="flex items-center gap-3">
                <button type="submit" class="btn btn-primary" id="qr-scan-btn" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Scan QR Code
                </button>
                <span id="qr-scan-status" class="text-sm text-slate-500"></span>
            </div>
        </form>
    `;

    const form = el.querySelector('#qr-scan-form');
    const dropZone = el.querySelector('#qr-drop-zone');
    const fileInput = el.querySelector('#qr-file-input');
    const fileNameEl = el.querySelector('#qr-file-name');
    const btn = el.querySelector('#qr-scan-btn');
    const statusEl = el.querySelector('#qr-scan-status');
    let selectedFile = null;

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showToast({ message: 'Please select an image file', type: 'error' });
            return;
        }
        selectedFile = file;
        fileNameEl.textContent = `Selected: ${file.name}`;
        fileNameEl.classList.remove('hidden');
        btn.disabled = false;
    }

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        btn.disabled = true;
        statusEl.innerHTML = '<span class="spinner"></span> Scanning...';

        try {
            const result = await scanQR(selectedFile);
            onResult(result);
            showToast({ message: 'QR scan complete', type: 'success' });
        } catch (err) {
            showToast({ message: err.message, type: 'error' });
        } finally {
            btn.disabled = false;
            statusEl.textContent = '';
        }
    });

    return el;
}
