/**
 * Formatting utilities for dates, severity levels, and byte sizes.
 * @module format
 */

/**
 * Format an ISO date string into a human-readable local format.
 * @param {string} isoString - ISO 8601 date string.
 * @returns {string} Formatted date string.
 */
export function formatDate(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format a relative time string (e.g., "2 hours ago").
 * @param {string} isoString - ISO 8601 date string.
 * @returns {string} Relative time description.
 */
export function formatRelativeTime(isoString) {
    if (!isoString) return '-';
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
}

/**
 * Map a numeric severity score to a human-readable label.
 * @param {number} score - Severity score from 0 to 100.
 * @returns {string} Severity label.
 */
export function formatSeverity(score) {
    if (score >= 90) return 'Critical';
    if (score >= 75) return 'High';
    if (score >= 50) return 'Medium';
    if (score >= 25) return 'Low';
    return 'None';
}

/**
 * Format bytes into a human-readable size string.
 * @param {number} bytes - Number of bytes.
 * @returns {string} Formatted size (e.g., "1.5 MB").
 */
export function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str - Input string.
 * @returns {string}
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a category slug into a readable label.
 * @param {string} category - Category identifier (e.g., "suspicious_redirect").
 * @returns {string} Readable label.
 */
export function formatCategory(category) {
    if (!category) return 'Unknown';
    return category.split('_').map(capitalize).join(' ');
}
