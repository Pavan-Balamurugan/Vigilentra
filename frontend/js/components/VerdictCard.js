/**
 * Scan result verdict display — IMPROVED for non-technical users.
 * Larger text, emojis, Tamil translation, audio alert for malicious results.
 * @module components/VerdictCard
 */

import { formatDate, formatCategory } from '../utils/format.js';
import { VERDICT_COLORS, VERDICT_MESSAGES, CATEGORY_EXPLANATIONS } from '../utils/constants.js';
import { getRole } from '../utils/auth.js';

// ── Tamil translations ────────────────────────────────────────────────────────

const TAMIL_VERDICT = {
    safe:       '✅ பாதுகாப்பானது',
    suspicious: '⚠️ சந்தேகமானது',
    malicious:  '🚨 ஆபத்தானது — திறக்காதீர்கள்!',
};

const TAMIL_ACTION = {
    safe:       'இந்த இணைப்பை திறக்கலாம். அச்சுறுத்தல் எதுவும் கண்டறியப்படவில்லை.',
    suspicious: 'கவனமாக இருங்கள். தனிப்பட்ட தகவல்களை பகிர வேண்டாம்.',
    malicious:  'இந்த இணைப்பை திறக்காதீர்கள்! உடனடியாக IT நிர்வாகியிடம் தெரிவிக்கவும்.',
};

const TAMIL_CATEGORY = {
    phishing:            '🎣 ஃபிஷிங் தாக்குதல்',
    malware:             '🦠 தீம்பொருள் (வைரஸ்)',
    scam:                '💸 மோசடி முயற்சி',
    spam:                '📧 ஸ்பாம் உள்ளடக்கம்',
    suspicious_redirect: '🔀 சந்தேகமான திசைமாற்றம்',
    macro_threat:        '📄 மேக்ரோ அச்சுறுத்தல்',
    data_exfiltration:   '📤 தரவு திருட்டு',
    unknown:             '❓ அறியப்படாத அச்சுறுத்தல்',
};

// ── Audio alert ───────────────────────────────────────────────────────────────

function playAlertSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        function pulse(freq, startAt, dur) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.55, ctx.currentTime + startAt + dur);
            gain.gain.setValueAtTime(0.38, ctx.currentTime + startAt);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + dur);
            osc.start(ctx.currentTime + startAt);
            osc.stop(ctx.currentTime + startAt + dur);
        }
        pulse(900, 0.0, 0.42);
        pulse(660, 0.5, 0.42);
        pulse(900, 1.0, 0.42);
        pulse(440, 1.5, 0.55);
    } catch {
        // Web Audio not available
    }
}

// ── Icon ──────────────────────────────────────────────────────────────────────

function getVerdictIcon(verdict) {
    if (verdict === 'safe') {
        return `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <polyline points="9 12 12 15 16 9" stroke="#16a34a" stroke-width="2.5"></polyline></svg>`;
    }
    if (verdict === 'suspicious') {
        return `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="12" stroke="#d97706" stroke-width="2.5"></line>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="#d97706" stroke-width="2.5"></line></svg>`;
    }
    return `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <line x1="15" y1="9" x2="9" y2="15" stroke="#dc2626" stroke-width="2.5"></line>
        <line x1="9" y1="9" x2="15" y2="15" stroke="#dc2626" stroke-width="2.5"></line></svg>`;
}

// ── Recommendation ────────────────────────────────────────────────────────────

function getRecommendation(verdict, category) {
    if (verdict === 'safe') return {
        emoji: '✅',
        action: 'No action needed',
        detail: 'This appears safe to use. As always, be cautious when sharing personal information online.',
    };
    if (verdict === 'suspicious') {
        const m = {
            phishing:            'Do not enter any login details or personal information. Verify the sender before proceeding.',
            scam:                'This may be a scam. Do not send money, gift cards, or personal details.',
            suspicious_redirect: 'Ask the sender for the direct link. Do not click through unknown redirects.',
            malware:             'Do not download files from this source. Run an antivirus scan if you already have.',
            macro_threat:        'Do not enable macros or editing if prompted when opening this file.',
            spam:                'Avoid clicking any links inside this content.',
            data_exfiltration:   'Do not open on devices with sensitive information.',
            unknown:             'Exercise caution. Do not share personal details until the source is verified.',
        };
        return { emoji: '⚠️', action: 'Proceed with caution', detail: m[category] || m.unknown };
    }
    const m = {
        phishing:            '🚫 DO NOT open this link. It is designed to STEAL passwords & personal data. Report to your IT administrator immediately.',
        scam:                '🚫 DO NOT respond, send money, or share personal details. This is a confirmed SCAM. Block the sender and report it.',
        malware:             '🚫 DO NOT download or open anything. This contains HARMFUL software that can damage your device.',
        suspicious_redirect: '🚫 DO NOT follow this link. It leads to a dangerous destination hidden behind redirects.',
        macro_threat:        '🚫 DO NOT open this file. It contains malicious code that runs automatically and can compromise your device.',
        spam:                '🚫 Delete immediately. Do not click any links or download attachments.',
        data_exfiltration:   '🚫 DO NOT open this file. It is designed to STEAL and transmit your data externally.',
        unknown:             '🚫 DO NOT interact. Flagged as dangerous by multiple security engines. Report to IT admin.',
    };
    return { emoji: '🚨', action: 'STOP — Do not open or interact', detail: m[category] || m.unknown };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function createVerdictCard(result) {
    const el = document.createElement('div');
    const colors = VERDICT_COLORS[result.verdict] || VERDICT_COLORS.safe;
    const verdictMsg = VERDICT_MESSAGES[result.verdict] || {};
    const categoryExplanation = CATEGORY_EXPLANATIONS[result.category] || CATEGORY_EXPLANATIONS.unknown;
    const rec = getRecommendation(result.verdict, result.category);
    const isAdmin = getRole() === 'admin';

    if (result.verdict === 'malicious') playAlertSound();

    const tamilVerdict  = TAMIL_VERDICT[result.verdict] || '';
    const tamilAction   = TAMIL_ACTION[result.verdict] || '';
    const tamilCategory = TAMIL_CATEGORY[result.category] || '';

    const reasonsList = (result.explanation || []).map(r => `
        <li style="display:flex;align-items:flex-start;gap:0.6rem;padding:0.35rem 0;">
            <span style="margin-top:0.5rem;flex-shrink:0;width:8px;height:8px;border-radius:50%;background:${colors.border};"></span>
            <span style="font-size:1rem;color:#334155;line-height:1.6;">${r}</span>
        </li>`).join('');

    const engineRows = Object.entries(result.engine_results || {}).map(([engine, data]) => {
        const st = data.status || 'analyzed';
        const sc = st === 'flagged' ? '#dc2626' : st === 'clean' ? '#16a34a' : st === 'error' ? '#d97706' : '#64748b';
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #f1f5f9;">
            <span style="font-size:0.95rem;color:#475569;">${engine.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>
            <span style="font-size:0.78rem;font-weight:700;padding:2px 10px;border-radius:999px;color:${sc};background:${sc}1a;">${st.toUpperCase()}</span>
        </div>`;
    }).join('');

    el.className = 'mt-6 rounded-xl overflow-hidden';
    el.style.cssText = `border:2.5px solid ${colors.border};box-shadow:0 4px 24px ${colors.border}33;`;

    el.innerHTML = `
        <!-- VERDICT BANNER -->
        <div style="background:${colors.bg};padding:1.6rem 2rem;">
            <div style="display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;">
                <div style="flex-shrink:0;">${getVerdictIcon(result.verdict)}</div>
                <div style="flex:1;min-width:180px;">
                    <div style="font-size:1.75rem;font-weight:800;color:${colors.text};line-height:1.2;">${verdictMsg.title || result.verdict.toUpperCase()}</div>
                    <div style="font-size:1.05rem;color:${colors.text}cc;margin-top:0.3rem;">${verdictMsg.subtitle || ''}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                    <div style="font-size:3rem;font-weight:800;color:${colors.text};line-height:1;">${Math.round(result.severity)}<span style="font-size:1.1rem;font-weight:400;">/100</span></div>
                    <div style="font-size:0.85rem;color:${colors.text}99;margin-top:2px;">Risk Score</div>
                </div>
            </div>
            <div style="margin-top:1rem;height:12px;background:rgba(255,255,255,0.45);border-radius:999px;overflow:hidden;">
                <div style="height:100%;border-radius:999px;width:${Math.min(result.severity,100)}%;background:${colors.border};transition:width 0.8s ease;"></div>
            </div>
        </div>

        <!-- TAMIL BANNER -->
        <div style="background:#1e3a8a;padding:1rem 2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;">
            <div>
                <div style="font-size:1.35rem;font-weight:700;color:#ffffff;">${tamilVerdict}</div>
                <div style="font-size:1rem;color:#bfdbfe;margin-top:0.25rem;">${tamilAction}</div>
            </div>
            ${tamilCategory ? `<div style="font-size:0.95rem;font-weight:600;background:rgba(255,255,255,0.15);color:#e0f2fe;padding:0.4rem 1.1rem;border-radius:999px;">${tamilCategory}</div>` : ''}
        </div>

        <!-- BODY -->
        <div style="background:#fff;padding:1.75rem 2rem;">

            <!-- Target -->
            <div style="margin-bottom:1.4rem;padding-bottom:1.4rem;border-bottom:1px solid #f1f5f9;">
                <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:0.4rem;">Scanned Target</div>
                <p style="font-size:0.95rem;font-family:monospace;color:#334155;word-break:break-all;">${result.target || ''}</p>
                <div style="display:flex;gap:0.5rem;margin-top:0.6rem;flex-wrap:wrap;">
                    <span style="font-size:0.82rem;padding:3px 12px;border-radius:999px;background:#f1f5f9;color:#475569;font-weight:600;">${(result.scan_type||'').toUpperCase()}</span>
                    <span style="font-size:0.82rem;padding:3px 12px;border-radius:999px;color:#fff;background:${colors.border};font-weight:600;">${formatCategory(result.category)}</span>
                </div>
            </div>

            ${isAdmin ? `
            <!-- What does this mean -->
            <div style="margin-bottom:1.4rem;padding-bottom:1.4rem;border-bottom:1px solid #f1f5f9;">
                <h4 style="font-size:1.1rem;font-weight:700;color:#0f172a;margin-bottom:0.5rem;">💡 What does this mean?</h4>
                <p style="font-size:1.05rem;color:#475569;line-height:1.75;">${categoryExplanation}</p>
            </div>` : ''}

            <!-- What to do -->
            <div style="margin-bottom:1.4rem;border-radius:0.75rem;padding:1.1rem 1.4rem;background:${colors.bg}99;">
                <h4 style="font-size:1.15rem;font-weight:700;color:${colors.text};margin-bottom:0.4rem;">${rec.emoji} What should you do?</h4>
                <p style="font-size:1.1rem;font-weight:700;color:#1e293b;margin-bottom:0.3rem;">${rec.action}</p>
                <p style="font-size:1.05rem;color:#475569;line-height:1.7;">${rec.detail}</p>
            </div>

            ${reasonsList ? `
            <div style="margin-bottom:1.4rem;padding-bottom:1.4rem;border-bottom:1px solid #f1f5f9;">
                <h4 style="font-size:1.1rem;font-weight:700;color:#0f172a;margin-bottom:0.5rem;">🔍 Why was this flagged?</h4>
                <ul style="list-style:none;padding:0;margin:0;">${reasonsList}</ul>
            </div>` : ''}

            ${engineRows && isAdmin ? `
            <details>
                <summary style="cursor:pointer;font-size:0.95rem;font-weight:600;color:#64748b;padding:0.5rem 0;user-select:none;">
                    🛠 Technical Details (for IT administrators)
                </summary>
                <div style="margin-top:0.75rem;padding-left:0.75rem;">${engineRows}</div>
            </details>` : ''}

            <div style="margin-top:1.2rem;padding-top:0.75rem;border-top:1px solid #f1f5f9;font-size:0.85rem;color:#94a3b8;">
                Scanned at ${formatDate(result.created_at)} &nbsp;|&nbsp; ID: ${result.id || 'N/A'}
            </div>
        </div>
    `;

    return el;
}

export function updateVerdictCard(container, result) {
    container.innerHTML = '';
    container.appendChild(createVerdictCard(result));
}