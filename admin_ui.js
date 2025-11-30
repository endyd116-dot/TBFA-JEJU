import { DataStore } from './data_store.js';
import { formatCurrency, showToast, sanitize } from './utils.js';

export const AdminUI = {
    init() {
        const btns = document.querySelectorAll('.admin-tab-btn');
        btns.forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('bg-gray-50', 'text-primary'));
                e.currentTarget.classList.add('bg-gray-50', 'text-primary');
                this.renderDashboard(e.currentTarget.dataset.tab);
            });
        });

        const logoutBtn = document.getElementById('logout-btn');
        if(logoutBtn) {
            logoutBtn.replaceWith(logoutBtn.cloneNode(true));
            document.getElementById('logout-btn').addEventListener('click', () => { 
                sessionStorage.removeItem('tbfa_admin_session'); 
                window.location.reload(); 
            });
        }

        const previewBtn = document.getElementById('preview-site');
        if(previewBtn) {
            previewBtn.replaceWith(previewBtn.cloneNode(true));
            document.getElementById('preview-site').addEventListener('click', () => document.getElementById('admin-dashboard').classList.add('hidden'));
        }
    },
    
    maskIP(ip) {
        if (!ip) return 'Unknown';
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.***.***`;
        }
        return 'Masked';
    },

    renderDashboard(tab) {
        const data = DataStore.get();
        const container = document.getElementById('admin-content-area');
        document.getElementById('admin-header-title').textContent = tab.toUpperCase();
        container.innerHTML = '';
        
        if(tab === 'donation') this.renderDonationMgr(container, data);
        else if(tab === 'budget') this.renderBudgetMgr(container, data);
        else if(tab === 'community') this.renderCommunityMgr(container, data);
        else if(tab === 'flow') this.renderFlowMgr(container, data);
        else if(tab === 'stats') this.renderStats(container, data);
        else if(tab === 'settings') this.renderSettings(container, data);
        else if(tab === 'resources') this.renderResourcesMgr(container, data);
        else container.innerHTML = '<p class="text-center text-gray-400 mt-10">기능 준비중</p>';
        
        if(window.lucide) lucide.createIcons();
    },
    renderDonationMgr(container, data) {
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm mb-6">
                <h3 class="font-bold mb-4">기본금 설정 (오프라인 합산)</h3>
                <div class="flex gap-4">
                    <input type="number" id="base-amount" value="${data.settings.baseAmount}" class="border p-2 rounded w-full">
                    <button id="save-base" class="bg-primary text-white px-4 py-2 rounded">적용</button>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="font-bold mb-4">후원자 목록 (최근순)</h3>
                <form id="add-donor-form" class="mb-4 flex gap-2">
                    <input placeholder="이름" class="border p-2 rounded w-24" required>
                    <input type="number" placeholder="금액" class="border p-2 rounded w-32" required>
                    <button class="bg-green-500 text-white px-4 rounded">추가</button>
                </form>
                <div class="max-h-96 overflow-y-auto">
                    ${data.donations.map((d,i) => `<div class="flex justify-between border-b p-2"><span>${sanitize(d.name)} (${formatCurrency(d.amount)})</span><button onclick="window.delDonor(${i})" class="text-red-500 text-xs">삭제</button></div>`).join('')}
                </div>
            </div>`;
        
        document.getElementById('save-base').onclick = () => { 
            data.settings.baseAmount = Number(document.getElementById('base-amount').value); 
            DataStore.save(data); 
            showToast('저장됨'); 
        };
        document.getElementById('add-donor-form').onsubmit = (e) => {
            e.preventDefault();
            const inputs = e.target.querySelectorAll('input');
            data.donations.unshift({ name: inputs[0].value, amount: Number(inputs[1].value), aiMsg: "감사합니다", date: new Date().toISOString().split('T')[0] });
            DataStore.save(data);
            this.renderDashboard('donation');
        };
        window.delDonor = (i) => { data.donations.splice(i,1); DataStore.save(data); this.renderDashboard('donation'); };
    },
    renderResourcesMgr(container, data) {
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-6">
                <h3 class="font-bold text-lg">자료 패키지 편집</h3>
                <p class="text-sm text-gray-500">각 자료의 제목과 내용을 HTML 형식으로 편집할 수 있습니다. (경고: 올바르지 않은 HTML은 화면 깨짐을 유발할 수 있습니다.)</p>
                <div class="space-y-6">
                    ${data.resources.map((r, i) => `
                        <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div class="flex gap-4 mb-2">
                                <div class="flex-1">
                                    <label class="block text-xs text-gray-500 mb-1">제목</label>
                                    <input type="text" id="res-title-${i}" value="${sanitize(r.title)}" class="w-full border p-2 rounded text-sm">
                                </div>
                                <div class="w-32">
                                    <label class="block text-xs text-gray-500 mb-1">타입</label>
                                    <input type="text" id="res-type-${i}" value="${r.type}" class="w-full border p-2 rounded text-sm bg-gray-100" readonly>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">HTML 내용</label>
                                <textarea id="res-content-${i}" class="w-full border p-2 rounded text-sm font-mono h-32 focus:h-64 transition-all">${r.content}</textarea>
                            </div>
                            <div class="mt-2 text-right">
                                <button onclick="window.saveResource(${i})" class="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-black">저장</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        window.saveResource = (i) => {
            const title = document.getElementById(`res-title-${i}`).value;
            const content = document.getElementById(`res-content-${i}`).value;
            data.resources[i].title = title;
            data.resources[i].content = content; // Saving raw HTML as trusted admin input
            DataStore.save(data);
            showToast('자료 내용이 저장되었습니다.');
        };
    },
    renderFlowMgr(container, data) {
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
                <h3 class="font-bold">메인 텍스트 설정</h3>
                <label class="block text-xs text-gray-500">헤더 제목 (HTML 허용)</label>
                <input id="edit-hero-title" value="${sanitize(data.hero.title)}" class="w-full border p-2 rounded">
                <label class="block text-xs text-gray-500">헤더 부제목</label>
                <textarea id="edit-hero-sub" class="w-full border p-2 rounded h-24">${sanitize(data.hero.subtitle)}</textarea>
                <h3 class="font-bold mt-6">푸터 정보 설정</h3>
                <textarea id="edit-footer-desc" class="w-full border p-2 rounded h-24">${sanitize(data.settings.footerDesc)}</textarea>
                <button id="save-flow" class="bg-primary text-white px-4 py-2 rounded mt-4 w-full font-bold">저장하기</button>
            </div>`;
        document.getElementById('save-flow').onclick = () => {
            data.hero.title = document.getElementById('edit-hero-title').value;
            data.hero.subtitle = document.getElementById('edit-hero-sub').value;
            data.settings.footerDesc = document.getElementById('edit-footer-desc').value;
            DataStore.save(data);
            showToast('문구가 저장되었습니다.');
        };
    },
    renderBudgetMgr(container, data) {
        container.innerHTML = `<div class="bg-white p-6 rounded-xl shadow-sm flex gap-8"><div class="w-1/3 h-64"><canvas id="adminBudgetChart"></canvas></div><div class="w-2/3" id="budget-items"></div></div>`;
        new Chart(document.getElementById('adminBudgetChart'), { type: 'pie', data: { labels: data.budget.map(b=>b.label), datasets: [{ data: data.budget.map(b=>b.value), backgroundColor: data.budget.map(b=>b.color) }] } });
    },
    renderCommunityMgr(container, data) {
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h3 class="font-bold">댓글 관리</h3>
            <div class="space-y-3">
                ${data.comments.map((c,i) => `
                    <div class="border p-4 rounded flex justify-between items-start ${c.approved?'bg-gray-50':'bg-yellow-50 border-yellow-200'}">
                        <div class="flex flex-col gap-1 w-full">
                            <div class="flex justify-between items-center">
                                <span class="font-bold text-sm text-gray-700">${sanitize(c.author)} <span class="font-normal text-xs text-gray-500">${c.approved ? '(승인됨)' : '(승인 대기)'}</span></span>
                                <div class="flex gap-2 shrink-0">
                                    ${!c.approved ? `<button onclick="window.approveMsg(${i})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors">승인</button>` : ''}
                                    <button onclick="window.delMsg(${i})" class="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded">삭제</button>
                                </div>
                            </div>
                            <p class="text-gray-800 text-sm">${sanitize(c.text)}</p>
                            <div class="text-[10px] text-gray-400 flex gap-2 items-center mt-1 border-t pt-2 border-gray-200/50">
                                <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${c.date} ${c.time || ''}</span>
                                <span class="w-px h-3 bg-gray-300"></span>
                                <span class="flex items-center gap-1"><i data-lucide="monitor" class="w-3 h-3"></i> ${c.device || 'Unknown'}</span>
                                <span class="w-px h-3 bg-gray-300"></span>
                                <span class="flex items-center gap-1"><i data-lucide="shield" class="w-3 h-3"></i> IP: ${this.maskIP(c.ip)}</span>
                            </div>
                        </div>
                    </div>`).join('')}
            </div>
            <h3 class="font-bold mt-8 border-t pt-6">탄원서 목록 (${data.petitions.length})</h3>
            <div class="max-h-40 overflow-y-auto text-sm space-y-2">
                ${data.petitions.map(p=>`<div class="flex justify-between border-b pb-2"><span>${p.date.split('T')[0]} - ${sanitize(p.name)}</span><span class="text-gray-400 text-xs">${this.maskIP(p.ip)}</span></div>`).join('')}
            </div>
        </div>`;
        
        window.approveMsg = (i) => { data.comments[i].approved = true; DataStore.save(data); this.renderDashboard('community'); };
        window.delMsg = (i) => { data.comments.splice(i,1); DataStore.save(data); this.renderDashboard('community'); };
        if(window.lucide) lucide.createIcons();
    },
    renderStats(container, data) {
        container.innerHTML = `<div class="bg-white p-6 rounded-xl shadow-sm"><h3>총 방문: ${data.stats.length}</h3><div class="h-64 overflow-y-auto text-xs mt-4 space-y-1">${data.stats.slice().reverse().map(s=>`<div class="border-b py-1 flex justify-between"><span>${s.date} ${s.time}</span><span>${s.device}</span><span class="text-gray-400">${s.ip}</span></div>`).join('')}</div></div>`;
    },
    renderSettings(container, data) {
        container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
                <h3 class="font-bold text-lg">목표 및 계좌 설정</h3>
                <label class="block text-sm text-gray-600">목표 금액 (원)</label>
                <input id="set-target" value="${data.settings.targetAmount}" type="number" class="border p-2 rounded-lg w-full mb-2">
                <div class="grid grid-cols-3 gap-2">
                    <input id="set-bank" value="${data.settings.accountBank}" placeholder="은행" class="border p-2 rounded-lg">
                    <input id="set-acc" value="${data.settings.accountNumber}" placeholder="계좌번호" class="border p-2 rounded-lg col-span-2">
                </div>
                <input id="set-owner" value="${data.settings.accountOwner}" placeholder="예금주" class="border p-2 rounded-lg w-full">
                <button id="save-set" class="bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 w-full rounded-lg transition-colors">설정 저장</button>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
                <h3 class="font-bold text-lg flex items-center gap-2"><i data-lucide="save" class="w-5 h-5"></i> 데이터 백업/복구</h3>
                <div class="grid grid-cols-2 gap-4">
                    <button id="backup-data" class="border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                        <i data-lucide="download" class="w-4 h-4"></i> 백업
                    </button>
                    <div class="relative">
                         <input type="file" id="restore-file" accept=".json" class="hidden">
                         <button onclick="document.getElementById('restore-file').click()" class="w-full border-2 border-red-400 text-red-500 hover:bg-red-500 hover:text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                            <i data-lucide="upload" class="w-4 h-4"></i> 복구
                        </button>
                    </div>
                </div>
            </div>
            
             <div class="bg-red-50 p-6 rounded-xl border border-red-100 space-y-4">
                <h3 class="font-bold text-red-600">위험 구역</h3>
                <button id="reset-all" class="text-red-500 text-sm underline hover:text-red-700">모든 데이터 초기화 (되돌릴 수 없음)</button>
            </div>
        </div>`;

        document.getElementById('save-set').onclick = () => { 
            data.settings.targetAmount = Number(document.getElementById('set-target').value); 
            data.settings.accountBank = document.getElementById('set-bank').value; 
            data.settings.accountNumber = document.getElementById('set-acc').value; 
            data.settings.accountOwner = document.getElementById('set-owner').value; 
            DataStore.save(data); 
            showToast('설정이 저장되었습니다.'); 
        };

        document.getElementById('backup-data').onclick = () => {
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tbfa_data_backup_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('백업 파일이 다운로드되었습니다.');
        };

        document.getElementById('restore-file').onchange = (e) => {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if(importedData.hero && importedData.donations) {
                        if(confirm('현재 데이터를 덮어쓰고 복구하시겠습니까?')) {
                            DataStore.save(importedData);
                            alert('데이터가 복구되었습니다.');
                            window.location.reload();
                        }
                    } else {
                        alert('올바르지 않은 데이터 형식입니다.');
                    }
                } catch(err) {
                    alert('오류가 발생했습니다.');
                }
            };
            reader.readAsText(file);
        };
        
        document.getElementById('reset-all').onclick = () => { 
            if(confirm('정말로 모든 데이터를 초기화하시겠습니까?\\n이 작업은 되돌릴 수 없습니다.')) DataStore.reset(); 
        };
    }
};
