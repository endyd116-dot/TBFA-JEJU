const STORAGE_KEY = 'TBFA_SETTLEMENT_DATA';
const SETTINGS_KEY = 'TBFA_FUND_SETTINGS';
const CATEGORIES_KEY = 'TBFA_CATEGORIES';

const defaultCategories = [
    "1. 법률 및 소송 지원",
    "2. 유가족 긴급 지원",
    "3. 진상 규명 활동",
    "4. 캠페인 운영 및 홍보"
];

const defaultData = [
    {
        id: '1',
        date: '2026-03-15',
        category: '1. 법률 및 소송 지원',
        item: '순직 인정 행정소송 변호사 선임비',
        amount: 5500000,
        recipient: '법무법인 한울',
        proofs: ['https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=400']
    }
];

export const State = {
    getCategories: () => {
        const stored = localStorage.getItem(CATEGORIES_KEY);
        return stored ? JSON.parse(stored) : (window.__INITIAL_DATA__?.categories || defaultCategories);
    },

    saveCategories: (categories) => {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
        window.dispatchEvent(new CustomEvent('stateChanged'));
    },

    getData: () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : (window.__INITIAL_DATA__?.data || defaultData);
    },
    
    saveData: (data) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('stateChanged'));
    },

    getSettings: () => {
        const stored = localStorage.getItem(SETTINGS_KEY);
        const defaultSettings = {
            totalFund: 50000000,
            manualSpent: null,
            manualRemain: null
        };
        const initial = window.__INITIAL_DATA__?.settings || defaultSettings;
        return stored ? JSON.parse(stored) : initial;
    },

    saveSettings: (settings) => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('stateChanged'));
    },

    exportFullState: () => {
        return {
            data: State.getData(),
            settings: State.getSettings(),
            categories: State.getCategories(),
            exportedAt: new Date().toISOString()
        };
    },

    importFullState: (json) => {
        try {
            if (json.data) State.saveData(json.data);
            if (json.settings) State.saveSettings(json.settings);
            if (json.categories) State.saveCategories(json.categories);
            return true;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    },

    finalCommit: () => {
        const fullDump = State.exportFullState();
        localStorage.setItem('TBFA_FULL_BACKUP', JSON.stringify(fullDump));
        return fullDump;
    },

    getSummary: () => {
        const data = State.getData();
        const settings = State.getSettings();
        const calculatedExpenses = data.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
        
        const totalFund = settings.totalFund;
        const totalExpenses = settings.manualSpent !== null ? settings.manualSpent : calculatedExpenses;
        const remainingBalance = settings.manualRemain !== null ? settings.manualRemain : (totalFund - totalExpenses);

        return { totalFund, totalExpenses, remainingBalance };
    },

    getCategorySummary: () => {
        const data = State.getData();
        const categories = State.getCategories();
        const summary = {};
        categories.forEach(cat => summary[cat] = 0);
        
        data.forEach(item => {
            if (summary.hasOwnProperty(item.category)) {
                summary[item.category] += (parseInt(item.amount) || 0);
            }
        });
        return summary;
    }
};
