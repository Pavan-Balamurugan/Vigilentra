/**
 * Registration page orchestrator.
 * @module pages/registerPage
 */

import { register } from '../api/auth.js';
import { showToast } from '../components/Toast.js';
import { redirectIfAuthenticated } from '../utils/router.js';

/**
 * Initialize the registration page.
 * Binds form submission and handles user creation.
 */
export function initRegisterPage() {
    redirectIfAuthenticated();

    const form = document.getElementById('register-form');
    const btn = document.getElementById('register-btn');
    const errorEl = document.getElementById('register-error');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value.trim();
        const fullName = document.getElementById('reg-name').value.trim();
        const institution = document.getElementById('reg-institution').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (!email || !fullName || !password) {
            errorEl.textContent = 'Please fill in all required fields';
            errorEl.classList.remove('hidden');
            return;
        }

        if (password !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match';
            errorEl.classList.remove('hidden');
            return;
        }

        if (password.length < 6) {
            errorEl.textContent = 'Password must be at least 6 characters';
            errorEl.classList.remove('hidden');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Creating account...';
        errorEl.classList.add('hidden');

        try {
            await register({ email, full_name: fullName, institution: institution || null, password });
            showToast({ message: 'Account created successfully', type: 'success' });
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = 'Create Account';
        }
    });
}
