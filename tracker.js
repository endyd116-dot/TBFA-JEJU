import { DataStore } from './data_store.js';

export const Tracker = {
    async init() {
        if (sessionStorage.getItem('tbfa_visited')) return;
        const info = this.getVisitorInfo();

        // Send to server for persistent stats (includes real IP)
        try {
            await fetch('/.netlify/functions/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device: info.device, userAgent: info.userAgent })
            });
        } catch (err) {
            console.warn('Stats send failed, falling back to local', err);
            const data = DataStore.get();
            if (data.stats.length > 1000) data.stats.shift();
            data.stats.push({
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                device: info.device,
                ip: info.ip || 'Masked'
            });
            DataStore.save(data);
        }

        sessionStorage.setItem('tbfa_visited', 'true');
    },

    getVisitorInfo() {
        return {
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            userAgent: navigator.userAgent,
            ip: this.getMockIP()
        };
    },

    getMockIP() {

        let ip = sessionStorage.getItem('tbfa_client_ip');
        if (!ip) {
            ip = Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');
            sessionStorage.setItem('tbfa_client_ip', ip);
        }
        return ip;
    }
};
