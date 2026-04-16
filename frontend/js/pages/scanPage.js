/**
 * Scan page orchestrator -- mounts scan tabs, forms, and verdict display.
 * @module pages/scanPage
 */

import { requireAuth } from '../utils/router.js';
import { createNavbar } from '../components/Navbar.js';
import { createScanTabs } from '../components/ScanTabs.js';
import { createLinkScanForm } from '../components/LinkScanForm.js';
import { createQRScanForm } from '../components/QRScanForm.js';
import { createDocScanForm } from '../components/DocScanForm.js';
import { createVerdictCard } from '../components/VerdictCard.js';

/**
 * Initialize the scan page.
 * Mounts the navbar, scan tabs with forms, and a verdict results area.
 */
export function initScanPage() {
    requireAuth();

    const app = document.getElementById('app');
    if (!app) return;

    // Mount navbar
    const navbar = createNavbar({ activePage: 'scan' });
    app.appendChild(navbar);

    // Main content area
    const main = document.createElement('main');
    main.className = 'max-w-4xl mx-auto px-4 py-8';

    // Page header
    const header = document.createElement('div');
    header.className = 'mb-6';
    header.innerHTML = `
        <h1 class="text-2xl font-bold text-slate-900">Threat Scanner</h1>
        <p class="text-sm text-slate-500 mt-1">Analyze URLs, QR codes, and documents for potential cyber threats</p>
    `;
    main.appendChild(header);

    // Verdict display area
    const verdictContainer = document.createElement('div');
    verdictContainer.id = 'verdict-container';

    function handleResult(result) {
        verdictContainer.innerHTML = '';
        verdictContainer.appendChild(createVerdictCard(result));
        verdictContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Create scan forms
    const linkForm = createLinkScanForm({ onResult: handleResult });
    const qrForm = createQRScanForm({ onResult: handleResult });
    const docForm = createDocScanForm({ onResult: handleResult });

    // Mount tabs
    const tabs = createScanTabs({
        linkPanel: linkForm,
        qrPanel: qrForm,
        docPanel: docForm,
    });

    const tabCard = document.createElement('div');
    tabCard.className = 'card';
    tabCard.appendChild(tabs);
    main.appendChild(tabCard);

    main.appendChild(verdictContainer);
    app.appendChild(main);
}
