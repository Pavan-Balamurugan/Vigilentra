/**
 * Login page orchestrator.
 * @module pages/loginPage
 */

import { login } from '../api/auth.js';
import { showToast } from '../components/Toast.js';
import { redirectIfAuthenticated } from '../utils/router.js';

/**
 * Initialize the login page.
 * Binds form submission and handles authentication flow.
 */
export function initLoginPage() {
    redirectIfAuthenticated();

    const form = document.getElementById('login-form');
    const btn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            errorEl.textContent = 'Please fill in all fields';
            errorEl.classList.remove('hidden');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Signing in...';
        errorEl.classList.add('hidden');

        try {
            const result = await login(email, password);
            showToast({ message: 'Login successful', type: 'success' });
            setTimeout(() => {
                window.location.href = result.role === 'admin' ? 'admin.html' : 'scan.html';
            }, 300);
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = 'Sign In';
        }
    });
}
