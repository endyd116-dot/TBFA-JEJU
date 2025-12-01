export const Auth = {
    async login(id, pw) {
        try {
            const res = await fetch('/.netlify/functions/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, pw })
            });
            if (!res.ok) return false;
            const { token } = await res.json();
            sessionStorage.setItem('tbfa_admin_token', token);
            sessionStorage.setItem('tbfa_admin_session', 'true');
            return true;
        } catch (err) {
            console.error('Login request failed', err);
            return false;
        }
    },
    check() {
        const session = sessionStorage.getItem('tbfa_admin_session');
        const token = sessionStorage.getItem('tbfa_admin_token');
        if (session === 'true' && token) {
            document.getElementById('admin-dashboard').classList.remove('hidden');





            import('./admin_ui.js').then(module => {
                 module.AdminUI.init();
                 module.AdminUI.renderDashboard('donation');
            });
        }
    },
    logout() {
        sessionStorage.removeItem('tbfa_admin_session');
        sessionStorage.removeItem('tbfa_admin_token');
        window.location.reload();
    }
};
