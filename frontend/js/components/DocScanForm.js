/**
 * Document upload form with drag-and-drop for scanning files.
 * @module components/DocScanForm
 */

import { scanDocument } from '../api/scan.js';
import { showToast } from './Toast.js';

/**
 * Create the document scan form with drag-and-drop file upload.
 * @param {object} options
 * @param {Function} options.onResult - Callback with the scan result object.
 * @returns {HTMLElement} The form element.
 */
export function createDocScanForm({ onResult }) {
    const el = document.createElement('div');

    el.innerHTML = `
        <form id="doc-scan-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Upload Document</label>
                <div class="drop-zone" id="doc-drop-zone">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 text-slate-400">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    <p class="text-sm font-medium text-slate-600 mb-1">Drag and drop a document here</p>
                    <p class="text-xs text-slate-400">Supported: PDF, DOCX, DOC, XLSX, XLS</p>
                    <input type="file" id="doc-file-input" accept=".pdf,.doc,.docx,.xls,.xlsx" class="hidden" />
                </div>
                <p id="doc-file-name" class="text-sm text-slate-500 mt-2 hidden"></p>
            </div>
            <div class="flex items-center gap-3">
                <button type="submit" class="btn btn-primary" id="doc-scan-btn" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Scan Document
                </button>
                <span id="doc-scan-status" class="text-sm text-slate-500"></span>
            </div>
        </form>
    `;

    const form = el.querySelector('#doc-scan-form');
    const dropZone = el.querySelector('#doc-drop-zone');
    const fileInput = el.querySelector('#doc-file-input');
    const fileNameEl = el.querySelector('#doc-file-name');
    const btn = el.querySelector('#doc-scan-btn');
    const statusEl = el.querySelector('#doc-scan-status');
    let selectedFile = null;

    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

    function handleFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            showToast({ message: `Unsupported file type. Allowed: ${allowedExtensions.join(', ')}`, type: 'error' });
            return;
        }
        selectedFile = file;
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        fileNameEl.textContent = `Selected: ${file.name} (${sizeMB} MB)`;
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
            const result = await scanDocument(selectedFile);
            onResult(result);
            showToast({ message: 'Document scan complete', type: 'success' });
        } catch (err) {
            showToast({ message: err.message, type: 'error' });
        } finally {
            btn.disabled = false;
            statusEl.textContent = '';
        }
    });

    return el;
}
