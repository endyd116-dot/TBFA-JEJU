import { State } from './state.js';
import './admin.js';

let chartInstance = null;

function init() {
    lucide.createIcons();
    syncUI();
    
    document.getElementById('filterCategory').addEventListener('change', renderTable);
    window.addEventListener('stateChanged', syncUI);
}

function syncUI() {
    renderDashboard();
    renderTable();
    updateFilterOptions();
}

function formatCurrency(val) {
    return new Intl.NumberFormat('ko-KR').format(val) + ' 원';
}

function updateFilterOptions() {
    const cats = State.getCategories();
    const filter = document.getElementById('filterCategory');
    const currentVal = filter.value;
    
    let html = '<option value="all">전체 항목 보기</option>';
    cats.forEach(c => {
        html += `<option value="${c}">${c}</option>`;
    });
    filter.innerHTML = html;
    if ([...filter.options].some(o => o.value === currentVal)) {
        filter.value = currentVal;
    }
}

function renderDashboard() {
    const summary = State.getSummary();
    document.getElementById('displayTotalFund').innerHTML = `${new Intl.NumberFormat('ko-KR').format(summary.totalFund)} <span class="text-xs font-normal text-slate-400 ml-1">KRW</span>`;
    document.getElementById('totalExpenses').innerHTML = `${new Intl.NumberFormat('ko-KR').format(summary.totalExpenses)} <span class="text-xs font-normal text-slate-400 ml-1">KRW</span>`;
    document.getElementById('remainingBalance').innerHTML = `${new Intl.NumberFormat('ko-KR').format(summary.remainingBalance)} <span class="text-xs font-normal text-slate-500/50 ml-1">KRW</span>`;

    const catData = State.getCategorySummary();
    const labels = Object.keys(catData);
    const values = Object.values(catData);

    const ctx = document.getElementById('distributionChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.includes('.') ? l.split('. ')[1] : l),
            datasets: [{
                label: '누적 집행액',
                data: values,
                backgroundColor: ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
                borderRadius: 6,
                barThickness: 24
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: (context) => `합계: ${new Intl.NumberFormat('ko-KR').format(context.raw)} 원` }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { callback: (value) => value >= 10000 ? (value/10000) + '만' : value }
                },
                y: { ticks: { font: { weight: 'bold' } } }
            }
        }
    });
}

function renderTable() {
    const data = State.getData();
    const filter = document.getElementById('filterCategory').value;
    const container = document.getElementById('settlementTableBody');
    const noData = document.getElementById('noDataMessage');
    
    const filtered = filter === 'all' ? data : data.filter(i => i.category === filter);
    
    if (filtered.length === 0) {
        container.innerHTML = '';
        noData.classList.remove('hidden');
        return;
    }
    
    noData.classList.add('hidden');
    container.innerHTML = filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(item => `
        <tr class="group hover:bg-slate-50 transition-colors">
            <td class="px-4 md:px-8 py-5 whitespace-nowrap text-slate-400 font-medium tabular-nums text-xs md:text-sm">${item.date}</td>
            <td class="px-2 md:px-6 py-5">
                <span class="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 truncate max-w-[80px] md:max-w-none">
                    ${item.category}
                </span>
            </td>
            <td class="px-2 md:px-6 py-5 font-bold text-slate-800 text-xs md:text-sm">${item.item}</td>
            <td class="px-2 md:px-6 py-5 text-right font-black text-slate-900 tabular-nums text-xs md:text-sm">${formatCurrency(item.amount)}</td>
            <td class="px-2 md:px-6 py-5 text-slate-600 font-medium text-xs md:text-sm hidden sm:table-cell">${item.recipient}</td>
            <td class="px-4 md:px-8 py-5 text-center">
                <button onclick="window.viewProof('${item.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <i data-lucide="file-text" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

window.viewProof = (id) => {
    const data = State.getData();
    const item = data.find(i => i.id === id);
    const modal = document.getElementById('proofModal');
    const content = document.getElementById('modalContent');
    document.getElementById('proofTitle').innerText = `${item.date} | ${item.item}`;

    if (item && item.proofs && item.proofs.length > 0) {
        content.innerHTML = item.proofs.map(p => `
            <div class="space-y-2 border-b pb-6 last:border-0">
                <img src="${p}" alt="증빙" class="w-full rounded-lg shadow-sm">
            </div>
        `).join('');
    } else {
        content.innerHTML = `<p class="py-20 text-center text-slate-300">증빙 자료가 없습니다.</p>`;
    }
    modal.classList.remove('hidden');
};

document.addEventListener('DOMContentLoaded', init);
