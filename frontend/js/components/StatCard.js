/**
 * Dashboard statistic card component.
 * @module components/StatCard
 */

/**
 * Create a stat card tile for the admin dashboard.
 * @param {object} options
 * @param {string} options.title - Stat label.
 * @param {string|number} options.value - Main metric value.
 * @param {string} [options.subtitle] - Secondary description.
 * @param {string} [options.variant='default'] - One of 'default', 'safe', 'warning', 'danger'.
 * @param {string} [options.icon] - SVG path data for the icon.
 * @returns {HTMLElement} The stat card element.
 */
export function createStatCard({ title, value, subtitle, variant = 'default', icon }) {
    const el = document.createElement('div');

    const variantStyles = {
        default: 'border-l-blue-800',
        safe: 'border-l-green-600',
        warning: 'border-l-amber-500',
        danger: 'border-l-red-600',
    };

    const iconColors = {
        default: 'text-blue-800',
        safe: 'text-green-600',
        warning: 'text-amber-500',
        danger: 'text-red-600',
    };

    el.className = `card border-l-4 ${variantStyles[variant] || variantStyles.default}`;
    el.setAttribute('data-stat-card', title);

    const iconSvg = icon
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${iconColors[variant] || iconColors.default}">
            ${icon}
           </svg>`
        : '';

    el.innerHTML = `
        <div class="flex items-start justify-between">
            <div>
                <p class="text-sm font-medium text-slate-500">${title}</p>
                <p class="text-2xl font-bold text-slate-900 mt-1" data-stat-value>${value}</p>
                ${subtitle ? `<p class="text-xs text-slate-400 mt-1" data-stat-subtitle>${subtitle}</p>` : ''}
            </div>
            ${iconSvg ? `<div class="p-2 bg-slate-50 rounded-lg">${iconSvg}</div>` : ''}
        </div>
    `;

    return el;
}

/**
 * Update a stat card's value and subtitle in place.
 * @param {HTMLElement} el - The stat card element.
 * @param {object} data
 * @param {string|number} data.value - New value.
 * @param {string} [data.subtitle] - New subtitle.
 */
export function updateStatCard(el, { value, subtitle }) {
    const valueEl = el.querySelector('[data-stat-value]');
    if (valueEl) valueEl.textContent = value;

    const subtitleEl = el.querySelector('[data-stat-subtitle]');
    if (subtitleEl && subtitle !== undefined) subtitleEl.textContent = subtitle;
}
