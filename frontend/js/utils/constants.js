/**
 * Application-wide constants and configuration values.
 * @module constants
 */

export const API_BASE_URL = 'http://localhost:8000';

export const THREAT_CATEGORIES = [
    'phishing',
    'malware',
    'scam',
    'spam',
    'suspicious_redirect',
    'macro_threat',
    'data_exfiltration',
    'unknown',
];

export const VERDICT_LABELS = {
    safe: 'Safe',
    suspicious: 'Suspicious',
    malicious: 'Malicious',
};

export const VERDICT_COLORS = {
    safe: { text: '#16a34a', bg: '#f0fdf4', border: '#16a34a' },
    suspicious: { text: '#d97706', bg: '#fffbeb', border: '#d97706' },
    malicious: { text: '#dc2626', bg: '#fef2f2', border: '#dc2626' },
};

export const SEVERITY_THRESHOLDS = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 90,
};

export const CATEGORY_LABELS = {
    phishing: 'Phishing',
    malware: 'Malware',
    scam: 'Scam',
    spam: 'Spam',
    suspicious_redirect: 'Suspicious Redirect',
    macro_threat: 'Macro Threat',
    data_exfiltration: 'Data Exfiltration',
    unknown: 'Unknown',
};

export const CATEGORY_COLORS = {
    phishing: '#dc2626',
    malware: '#7c3aed',
    scam: '#d97706',
    spam: '#64748b',
    suspicious_redirect: '#0891b2',
    macro_threat: '#c2410c',
    data_exfiltration: '#be185d',
    unknown: '#94a3b8',
};
