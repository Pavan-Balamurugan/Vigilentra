/**
 * Chart panel component wrapping Chart.js canvases.
 * @module components/ChartPanel
 */

import { CATEGORY_COLORS, CATEGORY_LABELS } from '../utils/constants.js';

/**
 * Create a doughnut chart showing threats by category.
 * @param {object} options
 * @param {Object<string, number>} options.data - Map of category to count.
 * @param {string} [options.title='Threats by Category']
 * @returns {HTMLElement} The chart panel element.
 */
export function createCategoryChart({ data, title = 'Threats by Category' }) {
    const el = document.createElement('div');
    el.className = 'card';

    const canvasId = 'chart-category-' + Math.random().toString(36).slice(2, 8);

    el.innerHTML = `
        <h3 class="text-sm font-semibold text-slate-900 mb-4">${title}</h3>
        <div class="relative" style="height: 260px;">
            <canvas id="${canvasId}"></canvas>
        </div>
    `;

    // Defer chart creation until element is in the DOM
    requestAnimationFrame(() => {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        const labels = Object.keys(data).map(k => CATEGORY_LABELS[k] || k);
        const values = Object.values(data);
        const colors = Object.keys(data).map(k => CATEGORY_COLORS[k] || '#94a3b8');

        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 12,
                            font: { size: 11 },
                        },
                    },
                },
                cutout: '65%',
            },
        });
    });

    return el;
}

/**
 * Create a line chart showing scans over the last 7 days.
 * @param {object} options
 * @param {Array<{date: string, count: number}>} options.data - Daily scan counts.
 * @param {string} [options.title='Scans Over Last 7 Days']
 * @returns {HTMLElement} The chart panel element.
 */
export function createTimelineChart({ data, title = 'Scans Over Last 7 Days' }) {
    const el = document.createElement('div');
    el.className = 'card';

    const canvasId = 'chart-timeline-' + Math.random().toString(36).slice(2, 8);

    el.innerHTML = `
        <h3 class="text-sm font-semibold text-slate-900 mb-4">${title}</h3>
        <div class="relative" style="height: 260px;">
            <canvas id="${canvasId}"></canvas>
        </div>
    `;

    requestAnimationFrame(() => {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        const labels = data.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        });
        const values = data.map(d => d.count);

        new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Scans',
                    data: values,
                    borderColor: '#1e40af',
                    backgroundColor: 'rgba(30, 64, 175, 0.08)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointBackgroundColor: '#1e40af',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, font: { size: 11 } },
                        grid: { color: '#f1f5f9' },
                    },
                    x: {
                        ticks: { font: { size: 11 } },
                        grid: { display: false },
                    },
                },
            },
        });
    });

    return el;
}
