import { DataStore } from './data_store.js';

export const Tracker = {
    init() {
        if (sessionStorage.getItem('tbfa_visited')) return;
        
        const data = DataStore.get();
        const info = this.getVisitorInfo();
        
        if (data.stats.length > 1000) data.stats.shift();
        
        data.stats.push({
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            device: info.device,
            ip: 'Masked' // 일반 통계에서는 마스킹 처리
        });
        
        DataStore.save(data);
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
