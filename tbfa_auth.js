export const Auth = {
    login(id, pw) {

        if (id === 'admin' && pw === '1234') {
            sessionStorage.setItem('tbfa_admin_session', 'true');
            return true;
        }
        return false;
    },
    check() {
        const session = sessionStorage.getItem('tbfa_admin_session');
        if (session === 'true') {
            document.getElementById('admin-dashboard').classList.remove('hidden');





            import('./admin_ui.js').then(module => {
                 module.AdminUI.init();
                 module.AdminUI.renderDashboard('donation');
            });
        }
    },
    logout() {
        sessionStorage.removeItem('tbfa_admin_session');
        window.location.reload();
    }
};
