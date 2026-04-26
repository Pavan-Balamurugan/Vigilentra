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

/**
 * Plain-language verdict titles and subtitles for non-technical users.
 */
export const VERDICT_MESSAGES = {
    safe: {
        title: 'This appears SAFE',
        subtitle: 'No threats were detected by our security scans.',
    },
    suspicious: {
        title: 'WARNING: This looks SUSPICIOUS',
        subtitle: 'Some warning signs were found. Proceed with caution.',
    },
    malicious: {
        title: 'DANGER: This is NOT SAFE',
        subtitle: 'Multiple security checks have flagged this as dangerous. Do not interact with it.',
    },
};

/**
 * Plain-language explanations of each threat category.
 * Written for non-technical users such as school staff, shop owners, hostel wardens.
 */
export const CATEGORY_EXPLANATIONS = {
    phishing:
        'This is a fake website or message designed to look like a real one (such as a bank, email service, or social media site). Its goal is to trick you into entering your password, bank details, or personal information so the attacker can steal them.',
    malware:
        'This contains harmful software (a virus) that can damage your device, lock your files, or secretly spy on what you do. It may install itself without you knowing.',
    scam:
        'This is a fraudulent scheme trying to trick you into sending money, buying gift cards, or sharing personal details. Common examples include fake lottery wins, job offers that ask for payment, or urgent messages from strangers.',
    spam:
        'This is unsolicited junk content, often sent in bulk. While not always directly dangerous, spam messages frequently contain links to scam or phishing sites.',
    suspicious_redirect:
        'This link does not go directly to the website it claims. Instead, it passes through one or more hidden services before reaching the final destination. This technique is commonly used to hide malicious websites.',
    macro_threat:
        'This document contains embedded code (called macros) that can run automatically when you open it. Attackers use macros to install viruses, steal data, or take control of your computer.',
    data_exfiltration:
        'This file or link is designed to collect and send your personal data to an external server without your knowledge. This could include saved passwords, documents, or other sensitive information.',
    unknown:
        'Something about this content raised security concerns, but it does not fall into a well-known threat category. Exercise caution and verify the source before interacting with it.',
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