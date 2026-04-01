import { DataStore } from './data_store.js';
import { formatCurrency, showToast, sanitize, sanitizeAttr, randomThanks } from './utils.js';

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
    renderSignResourcesMgr(container, data) {
        data.signResources = Array.isArray(data.signResources) ? data.signResources : [];
        const list = data.signResources;
        const toast = (msg) => {
            let t = document.getElementById('admin-toast');
            if(!t) {
                t = document.createElement('div');
                t.id = 'admin-toast';
                Object.assign(t.style, {
                    position:'fixed', top:'20px', right:'20px', zIndex:'12000',
                    padding:'12px 16px', background:'#111827', color:'white',
                    borderRadius:'10px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)',
                    transition:'opacity 0.3s, transform 0.3s',
                    opacity:'0', transform:'translateY(-10px)',
                    pointerEvents:'none'
                });
                document.body.appendChild(t);
            }
            t.textContent = msg;
            t.style.opacity = '1';
            t.style.transform = 'translateY(0)';
            setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(-10px)'; },1500);
        };
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-6">
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-lg">서명 자료 관리</h3>
                    <button id="add-sign-resource" class="border border-gray-300 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-1"><i data-lucide="plus" class="w-4 h-4"></i> 추가</button>
                </div>
                <p class="text-sm text-gray-500">서명 섹션에서 보여줄 자료를 편집하세요.</p>
                <div class="space-y-6">
                    ${list.map((r, i) => `
                        <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs text-gray-500">자료 #${i+1}</span>
                                <div class="flex gap-2">
                                    <button class="border px-2 py-1 rounded text-xs" onclick="window.moveSignResource(${i}, -1)">▲</button>
                                    <button class="border px-2 py-1 rounded text-xs" onclick="window.moveSignResource(${i}, 1)">▼</button>
                                    <button class="text-red-500 border border-red-200 px-2 py-1 rounded text-xs" onclick="window.delSignResource(${i})">삭제</button>
                                </div>
                            </div>
                            <div class="flex gap-4 mb-2">
                                <div class="flex-1">
                                    <label class="block text-xs text-gray-500 mb-1">제목</label>
                                    <input type="text" id="sign-res-title-${i}" value="${sanitize(r.title)}" class="w-full border p-2 rounded text-sm">
                                </div>
                                <div class="w-32">
                                    <label class="block text-xs text-gray-500 mb-1">타입</label>
                                    <input type="text" id="sign-res-type-${i}" value="${sanitize(r.type || '')}" class="w-full border p-2 rounded text-sm">
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">HTML 내용</label>
                                <textarea id="sign-res-content-${i}" class="w-full border p-2 rounded text-sm font-mono h-32 focus:h-64 transition-all">${r.content || ''}</textarea>
                            </div>
                            <div class="mt-2 text-right">
                                <button onclick="window.saveSignResource(${i})" class="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-black">저장</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        window.saveSignResource = (i) => {
            if(!data.signResources) data.signResources = [];
            const title = document.getElementById(`sign-res-title-${i}`).value;
            const content = document.getElementById(`sign-res-content-${i}`).value;
            const type = document.getElementById(`sign-res-type-${i}`).value;
            data.signResources[i].title = title;
            data.signResources[i].content = content;
            data.signResources[i].type = type;
            DataStore.save(data);
            toast('서명 자료가 저장되었습니다.');
        };
        window.moveSignResource = (i, dir) => {
            if(!data.signResources) data.signResources = [];
            const next = i + dir;
            if(next < 0 || next >= data.signResources.length) return;
            [data.signResources[i], data.signResources[next]] = [data.signResources[next], data.signResources[i]];
            DataStore.save(data);
            this.renderSignResourcesMgr(container, data);
        };
        window.delSignResource = (i) => {
            if(!data.signResources) return;
            if(confirm('자료를 삭제하시겠습니까?')) {
                data.signResources.splice(i,1);
                DataStore.save(data);
                this.renderSignResourcesMgr(container, data);
            }
        };
        const addBtn = document.getElementById('add-sign-resource');
        if(addBtn) addBtn.onclick = () => {
            if(!data.signResources) data.signResources = [];
            data.signResources.push({
                id: `sign-res-${Date.now()}`,
                title: '새 서명 자료',
                type: 'SIGN',
                content: '<p>내용을 입력하세요.</p>'
            });
            DataStore.save(data);
            this.renderSignResourcesMgr(container, data);
        };
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
        const container = document.getElementById('admin-content-area');
        document.getElementById('admin-header-title').textContent = tab.toUpperCase();
        window.__admin_active_tab = tab;
        const tabButtons = document.querySelectorAll('.admin-tab-btn');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('bg-gray-50', 'text-primary');
            } else {
                btn.classList.remove('bg-gray-50', 'text-primary');
            }
        });
        const renderWith = (data) => {
            container.innerHTML = '';
            if(tab === 'donation') this.renderDonationMgr(container, data);
            else if(tab === 'budget') this.renderBudgetMgr(container, data);
            else if(tab === 'community') this.renderCommunityMgr(container, data);
            else if(tab === 'flow') this.renderFlowMgr(container, data);
            else if(tab === 'stats') this.renderStats(container, data);
            else if(tab === 'settings') this.renderSettings(container, data);
            else if(tab === 'posters') this.renderPosterMgr(container, data);
            else if(tab === 'resources') this.renderResourcesMgr(container, data);
            else if(tab === 'signResources') this.renderSignResourcesMgr(container, data);
            else if(tab === 'signList') this.renderSignListMgr(container, data);
            else if(tab === 'footerModals') this.renderFooterModalMgr(container, data);
            else if(tab === 'donateJoin') this.renderDonateJoinMgr(container, data);
            else if(tab === 'settlement') this.renderSettlementMgr(container, data);
            else container.innerHTML = '<p class="text-center text-gray-400 mt-10">기능 준비중</p>';
            if(window.lucide) lucide.createIcons();
        };

        // 로컬 데이터 기준 렌더 (자동 재로딩으로 입력이 초기화되는 것을 방지)
        renderWith(DataStore.get());
    },
    renderDonationMgr(container, data) {
        let editingIndex = null;

        const renderList = () => `
            <div class="bg-white p-6 rounded-xl shadow-sm mb-6">
                <h3 class="font-bold mb-4">현재 후원금액 설정</h3>
                <div class="flex gap-4 items-center">
                    <div class="relative w-full">
                        <input type="text" id="base-amount" value="${formatCurrency(data.settings.baseAmount)}" class="border p-2 rounded w-full pr-10 text-right" inputmode="numeric">
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                    </div>
                    <button id="save-base" class="bg-primary text-white px-4 py-2 rounded whitespace-nowrap">적용</button>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-bold">후원자 목록 (최근순)</h3>
                    <div class="text-sm text-gray-600">총 후원액: <span class="font-bold text-primary">${formatCurrency(data.donations.reduce((s,d)=>s+Number(d.amount||0),0))}원</span></div>
                </div>
                <form id="add-donor-form" class="mb-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                    <input placeholder="이름" class="border p-2 rounded text-right md:col-span-2" required>
                    <input type="text" id="add-donor-amount" placeholder="금액" class="border p-2 rounded text-right md:col-span-2" inputmode="numeric">
                    <input type="text" id="add-donor-msg" placeholder="응원 한마디 (선택)" class="border p-2 rounded md:col-span-6 text-sm">
                    <button class="bg-green-500 text-white px-4 py-2 rounded whitespace-nowrap md:col-span-2">추가</button>
                </form>
                <div class="border-t pt-2 max-h-96 overflow-y-auto">
                    ${data.donations.map((d,i) => {
                        const ts = d.timestamp || d.date || '';
                        const dt = ts ? new Date(ts) : null;
                        const formatted = dt && !isNaN(dt) ? dt.toLocaleString('ko-KR') : '';
                        if (editingIndex === i) {
                            return `<div class="flex justify-between items-center border-b p-2 text-sm gap-2">
                                <div class="flex flex-col flex-1 gap-1">
                                    <input id="edit-donor-name-${i}" value="${sanitize(d.name)}" class="border p-2 rounded text-sm text-right">
                                    <input id="edit-donor-amount-${i}" value="${formatCurrency(d.amount)}" class="border p-2 rounded text-sm text-right" inputmode="numeric">
                                    <input id="edit-donor-msg-${i}" value="${sanitize(d.aiMsg || '')}" class="border p-2 rounded text-xs text-right" placeholder="감사 문구">
                                    <span class="text-[11px] text-gray-400">등록/수정: ${formatted || '—'}</span>
                                </div>
                                <div class="flex gap-1 shrink-0">
                                    <button onclick="window.saveDonor(${i})" class="text-white text-xs bg-primary px-2 py-1 rounded">저장</button>
                                    <button onclick="window.cancelEditDonor()" class="text-gray-600 text-xs border border-gray-300 px-2 py-1 rounded">취소</button>
                                </div>
                            </div>`;
                        }
                        return `<div class="flex justify-between items-center border-b p-2 text-sm">
                            <div class="flex flex-col">
                                <span class="font-bold text-gray-800">${sanitize(d.name)} <span class="text-primary">(${formatCurrency(d.amount)})</span></span>
                                <span class="text-xs text-gray-500">"${sanitize(d.aiMsg || '')}"</span>
                                <span class="text-[11px] text-gray-400">${formatted}</span>
                            </div>
                            <div class="flex gap-2 shrink-0">
                                <button onclick="window.editDonor(${i})" class="text-blue-500 text-xs border border-blue-200 px-2 py-1 rounded">수정</button>
                                <button onclick="window.delDonor(${i})" class="text-red-500 text-xs border border-red-200 px-2 py-1 rounded">삭제</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;

        container.innerHTML = renderList();
        
        const baseToast = (msg) => {
            let toast = document.getElementById('admin-toast');
            if(!toast) {
                toast = document.createElement('div');
                toast.id = 'admin-toast';
                toast.style.position = 'fixed';
                toast.style.top = '20px';
                toast.style.right = '20px';
                toast.style.zIndex = '12000';
                toast.style.padding = '12px 16px';
                toast.style.background = '#111827';
                toast.style.color = 'white';
                toast.style.borderRadius = '10px';
                toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                toast.style.transition = 'opacity 0.3s, transform 0.3s';
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                toast.style.pointerEvents = 'none';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
            }, 2000);
        };

        const formatInput = (val) => {
            const num = Number(String(val).replace(/[^0-9]/g, '')) || 0;
            return formatCurrency(num);
        };
        const parseInput = (val) => Number(String(val).replace(/[^0-9]/g, '')) || 0;

        const baseInput = document.getElementById('base-amount');
        baseInput.addEventListener('input', (e) => {
            const caret = e.target.selectionStart;
            const raw = e.target.value;
            const formatted = formatInput(raw);
            e.target.value = formatted;
            e.target.setSelectionRange(formatted.length, formatted.length);
        });

        const bindEvents = () => {
            const attachAmountFormatter = (selector) => {
                const el = container.querySelector(selector);
                if(!el) return;
                el.addEventListener('input', (e) => {
                    const formatted = formatInput(e.target.value);
                    e.target.value = formatted;
                    e.target.setSelectionRange(formatted.length, formatted.length);
                });
            };
            attachAmountFormatter('#add-donor-amount');
            data.donations.forEach((_, i) => attachAmountFormatter(`#edit-donor-amount-${i}`));

            document.getElementById('save-base').onclick = () => { 
                data.settings.baseAmount = parseInput(document.getElementById('base-amount').value); 
                DataStore.save(data); 
                window.dispatchEvent(new CustomEvent('dataUpdated', { detail: data }));
                baseToast('현재 후원금액이 적용되었습니다.');
            };
            document.getElementById('add-donor-form').onsubmit = (e) => {
                e.preventDefault();
                const inputs = e.target.querySelectorAll('input');
                const msgInput = document.getElementById('add-donor-msg');
                const msgVal = msgInput ? msgInput.value : '';
                const now = new Date();
                data.donations.unshift({ 
                    name: inputs[0].value, 
                    amount: parseInput(inputs[1].value), 
                    aiMsg: msgVal || randomThanks(), 
                    date: now.toISOString().split('T')[0],
                    timestamp: now.toISOString()
                });
                DataStore.save(data);
                this.renderDashboard('donation');
            };
            window.delDonor = (i) => { data.donations.splice(i,1); DataStore.save(data); this.renderDashboard('donation'); };
            window.editDonor = (i) => { editingIndex = i; container.innerHTML = renderList(); bindEvents(); };
            window.cancelEditDonor = () => { editingIndex = null; container.innerHTML = renderList(); bindEvents(); };
            window.saveDonor = (i) => {
                const item = data.donations[i];
                if(!item) return;
                const nameEl = document.getElementById(`edit-donor-name-${i}`);
                const amtEl = document.getElementById(`edit-donor-amount-${i}`);
                const msgEl = document.getElementById(`edit-donor-msg-${i}`);
                item.name = nameEl?.value || item.name;
                item.amount = parseInput(amtEl?.value || item.amount) || 0;
                item.aiMsg = msgEl?.value || item.aiMsg || '';
                item.timestamp = new Date().toISOString();
                DataStore.save(data);
                editingIndex = null;
                container.innerHTML = renderList();
                bindEvents();
            };
        };

        container.innerHTML = renderList();
        bindEvents();
    },
    renderResourcesMgr(container, data) {
        const toast = (msg) => {
            let t = document.getElementById('admin-toast');
            if(!t) {
                t = document.createElement('div');
                t.id = 'admin-toast';
                Object.assign(t.style, {
                    position:'fixed', top:'20px', right:'20px', zIndex:'12000',
                    padding:'12px 16px', background:'#111827', color:'white',
                    borderRadius:'10px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)',
                    transition:'opacity 0.3s, transform 0.3s',
                    opacity:'0', transform:'translateY(-10px)',
                    pointerEvents:'none'
                });
                document.body.appendChild(t);
            }
            t.textContent = msg;
            t.style.opacity = '1';
            t.style.transform = 'translateY(0)';
            setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(-10px)'; },1500);
        };

        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-6">
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-lg">자료 패키지 편집</h3>
                    <button id="add-resource" class="border border-gray-300 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-1"><i data-lucide="plus" class="w-4 h-4"></i> 추가</button>
                </div>
                <p class="text-sm text-gray-500">각 자료의 제목과 내용을 HTML 형식으로 편집할 수 있습니다. (경고: 올바르지 않은 HTML은 화면 깨짐을 유발할 수 있습니다.)</p>
                <div class="space-y-6">
                    ${data.resources.map((r, i) => `
                        <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs text-gray-500">자료 #${i+1}</span>
                                <div class="flex gap-2">
                                    <button class="border px-2 py-1 rounded text-xs" onclick="window.moveResource(${i}, -1)">▲</button>
                                    <button class="border px-2 py-1 rounded text-xs" onclick="window.moveResource(${i}, 1)">▼</button>
                                    <button class="text-red-500 border border-red-200 px-2 py-1 rounded text-xs" onclick="window.delResource(${i})">삭제</button>
                                </div>
                            </div>
                            <div class="flex gap-4 mb-2">
                                <div class="flex-1">
                                    <label class="block text-xs text-gray-500 mb-1">제목</label>
                                    <input type="text" id="res-title-${i}" value="${sanitize(r.title)}" class="w-full border p-2 rounded text-sm">
                                </div>
                                <div class="w-32">
                                    <label class="block text-xs text-gray-500 mb-1">타입</label>
                                    <input type="text" id="res-type-${i}" value="${sanitize(r.type || '')}" class="w-full border p-2 rounded text-sm">
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
            const type = document.getElementById(`res-type-${i}`).value;
            data.resources[i].title = title;
            data.resources[i].type = type;
            data.resources[i].content = content; // Saving raw HTML as trusted admin input
            DataStore.save(data);
            toast('자료가 저장되었습니다.');
        };
        window.moveResource = (i, dir) => {
            const next = i + dir;
            if(next < 0 || next >= data.resources.length) return;
            [data.resources[i], data.resources[next]] = [data.resources[next], data.resources[i]];
            DataStore.save(data);
            this.renderResourcesMgr(container, data);
        };
        window.delResource = (i) => {
            if(confirm('자료를 삭제하시겠습니까?')) {
                data.resources.splice(i,1);
                DataStore.save(data);
                this.renderResourcesMgr(container, data);
            }
        };
        const addBtn = document.getElementById('add-resource');
        if(addBtn) addBtn.onclick = () => {
            data.resources.push({
                id: `res-${Date.now()}`,
                title: '새 자료',
                type: 'CUSTOM',
                content: '<p>내용을 입력하세요.</p>'
            });
            DataStore.save(data);
            this.renderResourcesMgr(container, data);
        };
    },
    renderFlowMgr(container, data) {
        const petitions = data.petitions || [];
        const signatures = data.signatures || [];
        const signPageSize = 15;
        if (this.signPage == null) this.signPage = 0;
        if (this.signQuery == null) this.signQuery = '';
        const getSignListMeta = () => {
            const signQuery = this.signQuery.trim().toLowerCase();
            const signList = signatures.map((s, i) => ({ s, i })).reverse();
            const filteredSignList = signQuery
                ? signList.filter(({ s }) => (s.name || '').toLowerCase().includes(signQuery))
                : signList;
            const totalSignPages = Math.max(1, Math.ceil(filteredSignList.length / signPageSize));
            if (this.signPage > totalSignPages - 1) this.signPage = totalSignPages - 1;
            const signStart = this.signPage * signPageSize;
            const signPageItems = filteredSignList.slice(signStart, signStart + signPageSize);
            return { filteredSignList, totalSignPages, signPageItems };
        };
        const renderSignListTable = () => {
            const { filteredSignList, totalSignPages, signPageItems } = getSignListMeta();
            return `
                ${filteredSignList.length === 0 ? `<div class="text-center text-gray-400 py-4 text-sm">검색 결과가 없습니다.</div>` : `
                <table class="min-w-full text-left text-sm">
                    <thead class="text-xs text-gray-500 border-b">
                        <tr>
                            <th class="py-2 px-2">성명</th>
                            <th class="py-2 px-2">연락처</th>
                            <th class="py-2 px-2">주민번호(앞 6)</th>
                            <th class="py-2 px-2">서명</th>
                            <th class="py-2 px-2">시간</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${signPageItems.map(({s,i}) => {
                            const dt = s.timestamp ? new Date(s.timestamp) : null;
                            const formatted = dt && !isNaN(dt) ? dt.toLocaleString('ko-KR') : '';
                            return `<tr>
                                <td class="py-2 px-2">${sanitize(s.name)}</td>
                                <td class="py-2 px-2">${sanitize(s.phone)}</td>
                                <td class="py-2 px-2">${sanitize(s.ssn)}</td>
                                <td class="py-2 px-2">${s.signData ? `<button class="text-primary text-xs underline" onclick="window.viewSignature(${i})">보기</button>` : '-'}</td>
                                <td class="py-2 px-2 text-xs text-gray-400">${formatted}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                <div class="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>페이지 ${this.signPage + 1} / ${totalSignPages} (15개씩)</span>
                    <div class="flex items-center gap-1">
                        <button class="border border-gray-300 px-2 py-1 rounded ${this.signPage === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}" onclick="window.setSignPage(${this.signPage - 1})" ${this.signPage === 0 ? 'disabled' : ''}>이전</button>
                        <button class="border border-gray-300 px-2 py-1 rounded ${this.signPage >= totalSignPages - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}" onclick="window.setSignPage(${this.signPage + 1})" ${this.signPage >= totalSignPages - 1 ? 'disabled' : ''}>다음</button>
                    </div>
                </div>`}
            `;
        };
        const sectionsMeta = [
            { id: 'hero', name: '타이틀' },
            { id: 'story', name: '우리가 기억해야 할 이야기' },
            { id: 'promises', name: '3가지 약속 (MISSION)' },
            { id: 'plan', name: '세부 후원 계획' },
            { id: 'resources', name: '행사 자료 패키지' },
            { id: 'posters', name: '캠페인 포스터 갤러리' },
            { id: 'community', name: '양식 / 서명 섹션' },
            { id: 'sign', name: '서명하기' },
            { id: 'donate', name: '후원하기' }
        ];
        const baseOrder = sectionsMeta.map(s=>s.id);
        let currentOrder = (data.settings.sectionOrder && data.settings.sectionOrder.length ? data.settings.sectionOrder.slice() : baseOrder.slice());
        baseOrder.forEach(id => { if(!currentOrder.includes(id)) currentOrder.push(id); });
        const hiddenSet = new Set(data.settings.hiddenSections || []);
        const posters = data.posters || [];
        const iconOptions = ['heart','scale','home','graduation-cap','shield','star','sparkles','users','hand-heart','thumbs-up','alert-triangle','clock','globe','target','briefcase','book-open','award','message-circle','check-circle','shield-check'];

        const orderList = () => currentOrder.map((id, idx) => {
            const meta = sectionsMeta.find(s=>s.id===id);
            const title = meta ? meta.name : id;
            return `
                <div class="flex items-center gap-3 border rounded-lg p-3 bg-gray-50">
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-gray-800">${idx+1}. ${title}</span>
                        <label class="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                            <input type="checkbox" ${hiddenSet.has(id)?'checked':''} onchange="window.toggleSectionVisibility('${id}')" class="w-4 h-4"> 숨기기
                        </label>
                    </div>
                    <div class="ml-auto flex gap-2">
                        <button class="px-2 py-1 rounded border text-xs" onclick="window.moveSection(${idx}, -1)">▲</button>
                        <button class="px-2 py-1 rounded border text-xs" onclick="window.moveSection(${idx}, 1)">▼</button>
                    </div>

                    <!-- icon picker is rendered per mission card -->
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="grid lg:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-xl shadow-sm space-y-3 lg:col-span-1">
                    <h3 class="font-bold text-lg flex items-center gap-2"><i data-lucide="list" class="w-5 h-5"></i> 섹션 순서 설정</h3>
                    <p class="text-xs text-gray-500">아래 순서대로 메인 페이지에 표시됩니다.</p>
                    <div class="space-y-2" id="section-order-list">${orderList()}</div>
                </div>
                <div id="flow-edit-panels" class="lg:col-span-2 space-y-4">
                    <div id="flow-panel-hero" class="bg-white p-6 rounded-xl shadow-sm space-y-3">
                        <div class="flex items-center gap-2 mb-2"><i data-lucide="layout" class="w-4 h-4 text-primary"></i><h4 class="font-bold">타이틀 영역</h4></div>
                        <div class="grid md:grid-cols-3 gap-3 items-center">
                            <div class="md:col-span-2 space-y-2">
                                <input id="edit-hero-title" value="${sanitize(data.hero.title)}" class="w-full border p-3 rounded text-lg font-bold">
                                <textarea id="edit-hero-sub" class="w-full border p-3 rounded h-20">${sanitize(data.hero.subtitle)}</textarea>
                                <div>
                                    <label class="text-xs text-gray-500">배경 음악 URL (mp3 등)</label>
                                    <input id="flow-music-url" value="${sanitize(data.settings?.musicUrl || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...mp3">
                                    <p class="text-[11px] text-gray-400 mt-1">URL만 지원합니다. (파일 업로드 미지원)</p>
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500">히어로 이미지 위 텍스트</label>
                                    <textarea id="flow-hero-overlay" class="w-full border p-2 rounded h-16 text-sm" placeholder="겹쳐 보일 문구를 입력하세요.">${sanitize(data.hero.overlay || '')}</textarea>
                                    <p class="text-[11px] text-gray-400 mt-1">HTML 허용 (예: 줄바꿈 &lt;br&gt;)</p>
                                </div>
                                <div class="grid md:grid-cols-2 gap-2">
                                    <div>
                                        <label class="text-[11px] text-gray-500">헤더 로고 URL</label>
                                        <input id="flow-logo-url" value="${sanitize(data.settings?.logoUrl || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...png">
                                    </div>
                                    <div>
                                        <label class="text-[11px] text-gray-500 block">로고 업로드</label>
                                        <input type="file" id="flow-logo-upload" accept="image/*" class="w-full text-[11px]">
                                    </div>
                                </div>
                                <div class="grid md:grid-cols-2 gap-2">
                                    <div>
                                        <label class="text-[11px] text-gray-500">사이트 제목</label>
                                        <input id="flow-site-title" value="${sanitize(data.settings?.siteTitle || '')}" class="w-full border p-2 rounded text-sm" placeholder="교사유가족협의회">
                                    </div>
                                    <div>
                                        <label class="text-[11px] text-gray-500">사이트 부제</label>
                                        <input id="flow-site-subtitle" value="${sanitize(data.settings?.siteSubtitle || '')}" class="w-full border p-2 rounded text-sm" placeholder="Teacher's Family Association">
                                    </div>
                                </div>
                                <div>
                                    <label class="text-[11px] text-gray-500">헤더 블로그 링크</label>
                                    <input id="flow-blog-link" value="${sanitize(data.settings?.shareLinks?.[0]?.url || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://blog.naver.com/...">
                                    <p class="text-[11px] text-gray-400 mt-1">헤더 블로그 버튼이 이동할 링크를 입력하세요.</p>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <div class="w-full aspect-square bg-gray-50 border rounded overflow-hidden">
                                    <img id="flow-hero-thumb" src="${sanitize(data.hero.image || '')}" class="w-full h-full object-cover">
                                </div>
                                <input id="flow-hero-image" value="${sanitize(data.hero.image || '')}" class="w-full border p-2 rounded text-sm" placeholder="메인 이미지 URL" oninput="window.updateHeroThumb()">
                                <label class="text-[11px] text-gray-500">이미지 업로드</label>
                                <input type="file" id="flow-hero-upload" accept="image/*" class="w-full text-xs">
                            </div>
                        </div>
                    </div>

                    <div id="flow-panel-story" class="bg-white p-6 rounded-xl shadow-sm space-y-3">
                        <div class="flex items-center gap-2 mb-2"><i data-lucide="book-open" class="w-4 h-4 text-primary"></i><h4 class="font-bold">스토리 섹션</h4></div>
                        <div class="grid md:grid-cols-2 gap-3">
                            <div><label class="text-xs text-gray-500">스토리 섹션 제목</label><input id="flow-story-title" value="${sanitize(data.flowTexts?.storyTitle || '')}" class="w-full border p-2 rounded"></div>
                            <div class="md:col-span-2"><label class="text-xs text-gray-500">스토리 섹션 설명</label><textarea id="flow-story-desc" class="w-full border p-2 rounded h-16">${sanitize(data.flowTexts?.storyDesc || '')}</textarea></div>
                        </div>
                        <div class="border-t pt-3 space-y-3">
                            <div class="flex justify-between items-center">
                                <h5 class="font-bold text-sm">스토리 카드</h5>
                                <button id="add-story-block" class="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold flex items-center gap-1"><i data-lucide="plus" class="w-3 h-3"></i>추가</button>
                            </div>
                            <div class="space-y-3" id="flow-story-list">
                                ${(data.storyBlocks || []).map((s,i)=>`
                                    <div class="border rounded-lg p-3 bg-gray-50 space-y-2">
                                        <div class="grid md:grid-cols-5 gap-2 text-sm items-center">
                                            <div class="md:col-span-1">
                                                <div class="w-full aspect-square bg-white border rounded overflow-hidden">
                                                    <img id="flow-story-thumb-${i}" src="${sanitize(s.image || '')}" class="w-full h-full object-cover">
                                                </div>
                                                <input id="flow-story-img-${i}" value="${sanitize(s.image || '')}" class="w-full border p-2 rounded text-xs mt-2" placeholder="이미지 URL" oninput="window.updateStoryThumb(${i})">
                                                <label class="text-[11px] text-gray-500 block mt-1">이미지 업로드</label>
                                                <input type="file" id="flow-story-upload-${i}" accept="image/*" class="w-full text-[11px]">
                                            </div>
                                            <div class="md:col-span-4 grid md:grid-cols-2 gap-2">
                                                <div class="md:col-span-2">
                                                    <label class="text-[11px] text-gray-500">제목</label>
                                                    <input id="flow-story-title-${i}" value="${sanitize(s.title)}" class="w-full border p-2 rounded">
                                                </div>
                                                <div class="md:col-span-2">
                                                    <label class="text-[11px] text-gray-500">내용</label>
                                                    <textarea id="flow-story-content-${i}" class="w-full border p-2 rounded h-24">${sanitize(s.content)}</textarea>
                                                </div>
                                                <div>
                                                    <label class="text-[11px] text-gray-500">이미지 위치</label>
                                                    <select id="flow-story-pos-${i}" class="w-full border p-2 rounded text-sm">
                                                        <option value="right" ${s.position === 'right' ? 'selected' : ''}>이미지 오른쪽</option>
                                                        <option value="left" ${s.position === 'left' ? 'selected' : ''}>이미지 왼쪽</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label class="text-[11px] text-gray-500">배경 색상</label>
                                                    <input type="color" id="flow-story-bg-${i}" value="${sanitize(s.bg || '#f3f4f6')}" class="w-full border p-2 rounded text-sm">
                                                </div>
                                                <div class="flex justify-end md:col-span-2 gap-2">
                                                    <button class="text-xs px-2 py-1 border border-gray-300 rounded" onclick="window.moveStoryBlock(${i}, -1)">위로</button>
                                                    <button class="text-xs px-2 py-1 border border-gray-300 rounded" onclick="window.moveStoryBlock(${i}, 1)">아래로</button>
                                                    <button class="text-red-500 text-xs" onclick="window.delStoryBlock(${i})">삭제</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div id="flow-panel-mission" class="bg-white p-6 rounded-xl shadow-sm space-y-3">
                        <div class="flex items-center gap-2 mb-2"><i data-lucide="rocket" class="w-4 h-4 text-primary"></i><h4 class="font-bold">3가지 약속 (MISSION)</h4></div>
                        <div class="grid md:grid-cols-2 gap-3">
                            <div><label class="text-xs text-gray-500">MISSION 제목</label><input id="flow-mission-title" value="${sanitize(data.flowTexts?.missionTitle || '')}" class="w-full border p-2 rounded"></div>
                            <div class="md:col-span-2"><label class="text-xs text-gray-500">MISSION 설명</label><textarea id="flow-mission-desc" class="w-full border p-2 rounded h-16">${sanitize(data.flowTexts?.missionDesc || '')}</textarea></div>
                        </div>
                        <div class="border-t pt-3 space-y-3">
                            <div class="flex justify-between items-center">
                                <h5 class="font-bold text-sm">미션 카드</h5>
                                <button id="add-mission" class="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold flex items-center gap-1"><i data-lucide="plus" class="w-3 h-3"></i>추가</button>
                            </div>
                            <div class="space-y-3" id="flow-mission-list">
                                ${(data.promises || []).map((m,i)=>`
                                    <div class="border rounded-lg p-3 bg-gray-50 space-y-2">
                                        <div class="grid md:grid-cols-3 gap-2 text-sm items-center">
                                            <div>
                                                <label class="text-[11px] text-gray-500">아이콘(lucide 이름)</label>
                                                <input id="flow-mission-icon-${i}" value="${sanitize(m.icon || '')}" class="w-full border p-2 rounded" placeholder="예: heart, scale, home">
                                                <div class="grid grid-cols-6 gap-1 mt-1">
                                                    ${iconOptions.map(icon=>`
                                                        <button type="button" class="border rounded px-1 py-1 flex items-center justify-center text-xs hover:bg-gray-100" onclick="window.pickMissionIcon(${i}, '${icon}')">
                                                            <i data-lucide="${icon}" class="w-4 h-4"></i>
                                                        </button>
                                                    `).join('')}
                                                </div>
                                            </div>
                                            <div>
                                                <label class="text-[11px] text-gray-500">제목</label>
                                                <input id="flow-mission-title-${i}" value="${sanitize(m.title)}" class="w-full border p-2 rounded">
                                            </div>
                                            <div>
                                                <label class="text-[11px] text-gray-500">설명</label>
                                                <textarea id="flow-mission-desc-${i}" class="w-full border p-2 rounded h-16">${sanitize(m.desc)}</textarea>
                                            </div>
                                            <div class="flex justify-end md:col-span-3 gap-2">
                                                <button class="text-xs px-2 py-1 border border-gray-300 rounded" onclick="window.moveMission(${i}, -1)">위로</button>
                                                <button class="text-xs px-2 py-1 border border-gray-300 rounded" onclick="window.moveMission(${i}, 1)">아래로</button>
                                                <button class="text-red-500 text-xs" onclick="window.delMission(${i})">삭제</button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div id="flow-panel-plan" class="bg-white p-6 rounded-xl shadow-sm space-y-3">
                        <div class="flex items-center gap-2 mb-2"><i data-lucide="pie-chart" class="w-4 h-4 text-primary"></i><h4 class="font-bold">세부 후원 계획</h4></div>
                        <div class="grid md:grid-cols-2 gap-3">
                            <div><label class="text-xs text-gray-500">제목</label><input id="flow-plan-title" value="${sanitize(data.flowTexts?.planTitle || '')}" class="w-full border p-2 rounded"></div>
                            <div><label class="text-xs text-gray-500">설명</label><input id="flow-plan-desc" value="${sanitize(data.flowTexts?.planDesc || '')}" class="w-full border p-2 rounded"></div>
                        </div>
                    </div>

                    <div id="flow-panel-assets" class="bg-white p-6 rounded-xl shadow-sm space-y-3">
                        <div class="flex items-center gap-2 mb-2"><i data-lucide="folder-open" class="w-4 h-4 text-primary"></i><h4 class="font-bold">자료 / 포스터</h4></div>
                        <div class="grid md:grid-cols-2 gap-3">
                            <div><label class="text-xs text-gray-500">자료 제목</label><input id="flow-res-title" value="${sanitize(data.flowTexts?.resourcesTitle || '')}" class="w-full border p-2 rounded"></div>
                            <div><label class="text-xs text-gray-500">자료 설명</label><input id="flow-res-desc" value="${sanitize(data.flowTexts?.resourcesDesc || '')}" class="w-full border p-2 rounded"></div>
                            <div><label class="text-xs text-gray-500">포스터 제목</label><input id="flow-posters-title" value="${sanitize(data.flowTexts?.postersTitle || '')}" class="w-full border p-2 rounded"></div>
                            <div><label class="text-xs text-gray-500">포스터 설명</label><input id="flow-posters-desc" value="${sanitize(data.flowTexts?.postersDesc || '')}" class="w-full border p-2 rounded"></div>
                        </div>
                        <div class="border-t pt-3">
                            <div class="flex justify-between items-center mb-2">
                                <h5 class="font-bold text-sm">포스터 목록</h5>
                                <button id="add-poster-flow" class="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold flex items-center gap-1"><i data-lucide="plus" class="w-3 h-3"></i>추가</button>
                            </div>
                            <div class="space-y-3" id="flow-poster-list">
                                ${posters.map((p,i)=>`
                                    <div class="border rounded-lg p-3 bg-gray-50 space-y-2">
                                        <div class="grid md:grid-cols-5 gap-2 text-sm items-center">
                                            <div class="md:col-span-1">
                                                <div class="w-full aspect-square bg-white border rounded overflow-hidden flex items-center justify-center">
                                                    <img id="flow-poster-thumb-${i}" src="${sanitize(p.url)}" class="w-full h-full object-cover">
                                                </div>
                                            </div>
                                            <div class="md:col-span-4 grid md:grid-cols-2 gap-2">
                                                <div><label class="text-[11px] text-gray-500">제목</label><input id="flow-poster-title-${i}" value="${sanitize(p.title)}" class="w-full border p-2 rounded"></div>
                                                <div>
                                                    <label class="text-[11px] text-gray-500">이미지 URL</label>
                                                    <input id="flow-poster-url-${i}" value="${sanitize(p.url)}" class="w-full border p-2 rounded" oninput="window.updatePosterThumb(${i})">
                                                    <label class="text-[11px] text-gray-500 block mt-1">이미지 업로드</label>
                                                    <input type="file" id="flow-poster-upload-${i}" accept="image/*" class="w-full text-[11px]">
                                                </div>
                                                <div><label class="text-[11px] text-gray-500">QR 링크</label><input id="flow-poster-link-${i}" value="${sanitize(p.link || '')}" class="w-full border p-2 rounded"></div>
                                                <div class="flex items-center gap-2">
                                                    <img id="flow-poster-qr-${i}" src="${p.qr ? sanitize(p.qr) : ''}" class="w-12 h-12 border rounded bg-white object-contain">
                                                    <button class="px-2 py-1 bg-gray-900 text-white rounded text-xs" onclick="window.genPosterQRFlow(${i})">QR 생성</button>
                                                    <div class="flex gap-2 ml-auto">
                                                        <button class="text-xs px-2 py-1 border border-gray-300 rounded" onclick="window.movePosterFlow(${i}, -1)">위로</button>
                                                        <button class="text-xs px-2 py-1 border border-gray-300 rounded" onclick="window.movePosterFlow(${i}, 1)">아래로</button>
                                                        <button class="text-red-500 text-xs" onclick="window.delPosterFlow(${i})">삭제</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div id="flow-panel-community" class="bg-white p-6 rounded-xl shadow-sm space-y-4">
                        <div class="flex items-center gap-2 mb-2"><i data-lucide="file-text" class="w-4 h-4 text-primary"></i><h4 class="font-bold">양식/서명 섹션</h4></div>
                        <div class="grid md:grid-cols-1 gap-3">
                            <div class="md:col-span-1 space-y-1">
                                <label class="text-xs text-gray-500">탄원서 양식 다운로드 URL</label>
                                <input id="flow-petition-link" value="${sanitize(data.settings?.petitionFormUrl || '')}" class="w-full border p-2 rounded" placeholder="https://...pdf">
                                <label class="text-xs text-gray-500 block mt-2">탄원서 수신 이메일</label>
                                <input id="flow-petition-email" value="${sanitize(data.settings?.petitionEmail || '')}" class="w-full border p-2 rounded" placeholder="admin@example.com">
                                <div class="grid md:grid-cols-2 gap-2 mt-2">
                                    <div>
                                        <label class="text-[11px] text-gray-500">SMTP HOST</label>
                                        <input id="flow-smtp-host" value="${sanitize(data.settings?.smtpHost || '')}" class="w-full border p-2 rounded text-sm" placeholder="smtp.naver.com">
                                    </div>
                                    <div>
                                        <label class="text-[11px] text-gray-500">SMTP PORT</label>
                                        <input id="flow-smtp-port" value="${sanitize(data.settings?.smtpPort || '')}" class="w-full border p-2 rounded text-sm" placeholder="465 또는 587">
                                    </div>
                                </div>
                                <div class="grid md:grid-cols-2 gap-2">
                                    <div>
                                        <label class="text-[11px] text-gray-500">SMTP USER</label>
                                        <input id="flow-smtp-user" value="${sanitize(data.settings?.smtpUser || '')}" class="w-full border p-2 rounded text-sm" placeholder="id@naver.com">
                                    </div>
                                    <div>
                                        <label class="text-[11px] text-gray-500">SMTP PASS</label>
                                        <input id="flow-smtp-pass" value="${sanitize(data.settings?.smtpPass || '')}" type="password" class="w-full border p-2 rounded text-sm" placeholder="앱 비밀번호">
                                    </div>
                                </div>
                                <div>
                                    <label class="text-[11px] text-gray-500">발신 이메일(FROM)</label>
                                    <input id="flow-from-email" value="${sanitize(data.settings?.fromEmail || '')}" class="w-full border p-2 rounded text-sm" placeholder="id@naver.com">
                                </div>
                                <label class="text-[11px] text-gray-500 block mt-2">파일 업로드 (비활성화됨)</label>
                                <input type="file" id="flow-petition-upload" class="w-full text-[11px] opacity-60 cursor-not-allowed" disabled>
                            </div>
                        </div>
                        <div class="border-t pt-3">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="table" class="w-4 h-4 text-primary"></i>
                                    <h5 class="font-bold text-sm">제출 현황</h5>
                                    <span class="text-xs text-gray-400">(${petitions.length})</span>
                                </div>
                                <div class="flex items-center gap-2 text-xs text-gray-500">
                                    <span>총 제출: <span class="font-bold text-gray-800">${petitions.length}</span></span>
                                    <button id="download-petition-files" class="border border-gray-300 px-2 py-1 rounded text-gray-700 hover:bg-gray-50">파일 저장</button>
                                    <button id="export-petitions" class="border border-gray-300 px-2 py-1 rounded text-gray-700 hover:bg-gray-50">리스트 저장</button>
                                </div>
                            </div>
                            <div class="overflow-x-auto">
                                ${petitions.length === 0 ? `<div class="text-center text-gray-400 py-4 text-sm">아직 제출된 서명이 없습니다.</div>` : `
                                <table class="min-w-full text-left text-sm">
                                    <thead class="text-xs text-gray-500 border-b">
                                        <tr>
                                            <th class="py-2 px-2">성명</th>
                                            <th class="py-2 px-2">문서</th>
                                            <th class="py-2 px-2">제출 시간</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y">
                                        ${petitions.slice().reverse().map(p => {
                                            const ts = p.timestamp || p.date;
                                            const dt = ts ? new Date(ts) : null;
                                            const formatted = dt && !isNaN(dt) ? dt.toLocaleString('ko-KR') : '';
                                            return `<tr>
                                                <td class="py-2 px-2">${sanitize(p.name)}</td>
                                                <td class="py-2 px-2">${p.fileUrl ? `<a href="${sanitize(p.fileUrl)}" target="_blank" rel="noopener" download="${sanitize(p.fileName || 'file')}">${sanitize(p.fileName || '업로드 없음')}</a>` : sanitize(p.fileName || '업로드 없음')}</td>
                                                <td class="py-2 px-2 text-gray-500 text-xs">${formatted}</td>
                                            </tr>`;
                                        }).join('')}
                                    </tbody>
                                </table>`}
                            </div>
                        </div>
                    </div>

                    <div id="flow-panel-sign" class="bg-white p-6 rounded-xl shadow-sm space-y-4">
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2 mb-2"><i data-lucide="list" class="w-4 h-4 text-primary"></i><h4 class="font-bold">서명하기</h4></div>
                                <div class="flex items-center gap-2 text-xs text-gray-500">
                                    <span>총 서명: <span class="font-bold text-gray-800">${signatures.length}</span></span>
                                    <button id="export-signatures" class="border border-gray-300 px-2 py-1 rounded text-gray-700 hover:bg-gray-50">리스트 저장</button>
                                </div>
                            </div>
                            <div class="flex items-center justify-end">
                                <button id="goto-sign-list" class="border border-gray-300 px-2 py-1 rounded text-xs text-gray-700 hover:bg-gray-50">서명리스트 관리로 이동</button>
                            </div>
                            <div class="text-xs text-gray-500">온라인 서명 입력값은 사용자 입력을 그대로 저장합니다.</div>
                            <div class="overflow-x-auto">
                                <div id="flow-sign-list-wrap">
                                    ${renderSignListTable()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="flow-panel-donate" class="bg-white p-6 rounded-xl shadow-sm space-y-3">
                        <div class="flex items-center gap-2 mb-2"><i data-lucide="gift" class="w-4 h-4 text-primary"></i><h4 class="font-bold">후원 섹션</h4></div>
                        <input id="flow-donate-title" value="${sanitizeAttr(data.flowTexts?.donateTitle || '')}" class="w-full border p-3 rounded text-lg" placeholder="후원 섹션 제목">
                        <div class="grid md:grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs text-gray-500">후원하기 버튼 이동 URL</label>
                                <input id="flow-donate-main-url" value="${sanitizeAttr(data.settings?.donateMainUrl || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...">
                            </div>
                            <div>
                                <label class="text-xs text-gray-500">카카오페이 URL</label>
                                <input id="flow-donate-kakao-url" value="${sanitizeAttr(data.settings?.donateKakaoUrl || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...">
                            </div>
                            <div>
                                <label class="text-xs text-gray-500">해피빈 URL</label>
                                <input id="flow-donate-happy-url" value="${sanitizeAttr(data.settings?.donateHappyUrl || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...">
                            </div>
                            <div class="md:col-span-2 grid md:grid-cols-2 gap-2 items-center">
                                <div>
                                    <label class="text-xs text-gray-500">후원 섹션 이미지 URL</label>
                                    <input id="flow-donate-image" value="${sanitizeAttr(data.settings?.donateImage || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...jpg">
                                </div>
                                <div>
                                    <label class="text-[11px] text-gray-500 block">이미지 업로드</label>
                                    <input type="file" id="flow-donate-upload" accept="image/*" class="w-full text-[11px]">
                                    <p class="text-[11px] text-gray-400 mt-1">파일을 선택하면 자동으로 반영됩니다.</p>
                                </div>
                            </div>
                            <div class="md:col-span-2">
                                <div class="w-full aspect-[4/3] bg-gray-50 border rounded overflow-hidden flex items-center justify-center">
                                    <img id="flow-donate-thumb" src="${sanitize(data.settings?.donateImage || '')}" class="w-full h-full object-cover">
                                </div>
                            </div>
                        </div>
                        <div class="grid md:grid-cols-3 gap-3">
                            <div>
                                <label class="text-xs text-gray-500">예금주</label>
                                <input id="flow-acc-owner" value="${sanitizeAttr(data.settings?.accountOwner || '')}" class="w-full border p-2 rounded text-sm">
                            </div>
                            <div>
                                <label class="text-xs text-gray-500">은행</label>
                                <input id="flow-acc-bank" value="${sanitizeAttr(data.settings?.accountBank || '')}" class="w-full border p-2 rounded text-sm">
                            </div>
                            <div>
                                <label class="text-xs text-gray-500">계좌번호</label>
                                <input id="flow-acc-number" value="${sanitizeAttr(data.settings?.accountNumber || '')}" class="w-full border p-2 rounded text-sm">
                            </div>
                        </div>
                    </div>

                    <div id="flow-panel-footer" class="bg-white p-6 rounded-xl shadow-sm space-y-3">
                        <div class="flex items-center gap-2 mb-2"><i data-lucide="layers" class="w-4 h-4 text-primary"></i><h4 class="font-bold">푸터 정보</h4></div>
                        <textarea id="edit-footer-desc" class="w-full border p-3 rounded h-20">${sanitize(data.settings.footerDesc)}</textarea>
                        <div class="grid md:grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs text-gray-500">문의 전화</label>
                                <input id="edit-footer-phone" value="${sanitize(data.settings.footerPhone || '')}" class="w-full border p-2 rounded text-sm">
                            </div>
                            <div>
                                <label class="text-xs text-gray-500">이메일</label>
                                <input id="edit-footer-email" value="${sanitize(data.settings.footerEmail || '')}" class="w-full border p-2 rounded text-sm">
                            </div>
                        </div>
                        <div class="flex justify-end">
                            <button id="goto-footer-modals" class="border border-gray-300 px-3 py-1.5 rounded text-xs text-gray-700 hover:bg-gray-50">푸터 모달관리 바로가기</button>
                        </div>
                    </div>

                    <button id="save-flow" class="w-full bg-primary text-white py-3 rounded-lg font-bold">저장하기</button>
                </div>
            </div>`;

        const regenerateOrderList = () => {
            const list = document.getElementById('section-order-list');
            if(list) list.innerHTML = orderList();
            if(window.lucide) lucide.createIcons();
        };

        window.viewSignature = (i) => {
            const item = data.signatures && data.signatures[i];
            if(!item || !item.signData) {
                showAdminToast('서명 데이터가 없습니다.');
                return;
            }
            const win = window.open();
            if(!win) { showAdminToast('팝업이 차단되었습니다.'); return; }
            const safeSrc = item.signData.replace(/"/g,'&quot;');
            win.document.write(`<html><head><title>서명보기</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#f8fafc;"><img src="${safeSrc}" style="max-width:100%;max-height:100vh;"/></body></html>`);
        };
        window.setSignPage = (next) => {
            const list = (data.signatures || []).map((s, i) => ({ s, i })).reverse();
            const q = (this.signQuery || '').trim().toLowerCase();
            const filtered = q ? list.filter(({ s }) => (s.name || '').toLowerCase().includes(q)) : list;
            const total = Math.max(1, Math.ceil(filtered.length / signPageSize));
            const clamped = Math.max(0, Math.min(next, total - 1));
            this.signPage = clamped;
            this.renderFlowMgr(container, data);
        };
        const gotoSignList = document.getElementById('goto-sign-list');
        if (gotoSignList) {
            gotoSignList.addEventListener('click', () => {
                this.signQuery = '';
                this.signPage = 0;
                this.renderDashboard('signList');
            });
        }
        const gotoFooterModals = document.getElementById('goto-footer-modals');
        if (gotoFooterModals) {
            gotoFooterModals.addEventListener('click', () => {
                this.renderDashboard('footerModals');
            });
        }
        const reorderEditPanels = () => {
            const panelMap = {
                hero: 'flow-panel-hero',
                story: 'flow-panel-story',
                promises: 'flow-panel-mission',
                plan: 'flow-panel-plan',
                resources: 'flow-panel-assets',
                posters: 'flow-panel-assets',
                community: 'flow-panel-community',
                sign: 'flow-panel-sign',
                donate: 'flow-panel-donate'
            };
            const containerPanels = document.getElementById('flow-edit-panels');
            if(!containerPanels) return;
            const added = new Set();
            currentOrder.forEach(id => {
                const pid = panelMap[id];
                if(pid && !added.has(pid)) {
                    const el = document.getElementById(pid);
                    if(el) {
                        containerPanels.appendChild(el);
                        added.add(pid);
                    }
                }
            });
            const footer = document.getElementById('flow-panel-footer');
            if(footer) containerPanels.appendChild(footer);
        };

        const generateQRDataUrl = (text) => new Promise((resolve, reject) => {
            try {
                const temp = document.createElement('div');
                temp.style.position = 'fixed';
                temp.style.left = '-9999px';
                document.body.appendChild(temp);
                const qr = new QRCode(temp, { text, width: 160, height: 160, correctLevel: QRCode.CorrectLevel.H });
                setTimeout(() => {
                    const canvas = temp.querySelector('canvas');
                    if (canvas) resolve(canvas.toDataURL('image/png'));
                    else reject(new Error('QR generation failed'));
                    document.body.removeChild(temp);
                }, 50);
            } catch (err) { reject(err); }
        });

        window.moveSection = (idx, dir) => {
            const next = idx + dir;
            if(next < 0 || next >= currentOrder.length) return;
            [currentOrder[idx], currentOrder[next]] = [currentOrder[next], currentOrder[idx]];
            data.settings.sectionOrder = currentOrder;
            DataStore.save(data);
            this.renderFlowMgr(container, data);
        };

        window.genPosterQRFlow = async (i) => {
            const link = document.getElementById(`flow-poster-link-${i}`).value || window.location.href;
            try {
                const dataUrl = await generateQRDataUrl(link);
                const img = document.getElementById(`flow-poster-qr-${i}`);
                if(img) img.src = dataUrl;
                data.posters[i].qr = dataUrl;
                data.posters[i].link = link;
            DataStore.save(data);
            showAdminToast('QR이 생성되었습니다.');
        } catch (err) {
            showAdminToast('QR 생성 실패');
        }
    };

        window.delPosterFlow = (i) => {
            if(confirm('삭제하시겠습니까?')) {
                data.posters.splice(i,1);
                DataStore.save(data);
                this.renderFlowMgr(container, data);
            }
        };

        window.movePosterFlow = (i, dir) => {
            if(!data.posters) return;
            const next = i + dir;
            if(next < 0 || next >= data.posters.length) return;
            // sync current poster inputs before swap
            data.posters = data.posters.map((p, idx) => ({
                ...p,
                title: document.getElementById(`flow-poster-title-${idx}`)?.value || p.title,
                url: document.getElementById(`flow-poster-url-${idx}`)?.value || p.url,
                link: document.getElementById(`flow-poster-link-${idx}`)?.value || p.link,
                qr: document.getElementById(`flow-poster-qr-${idx}`)?.src || p.qr
            }));
            [data.posters[i], data.posters[next]] = [data.posters[next], data.posters[i]];
            DataStore.save(data);
            this.renderFlowMgr(container, data);
        };

        const addBtn = document.getElementById('add-poster-flow');
        if(addBtn) addBtn.onclick = () => {
            data.posters.push({ title:'새 포스터', url:'', link: window.location.href, qr:'' });
            DataStore.save(data);
            this.renderFlowMgr(container, data);
        };

        const addStoryBtn = document.getElementById('add-story-block');
        if(addStoryBtn) addStoryBtn.onclick = () => {
            syncStoryInputs();
            data.storyBlocks = data.storyBlocks || [];
            data.storyBlocks.push({ title:'새 이야기', content:'내용을 입력하세요', image:'', position:'right', bg:'#f3f4f6' });
            DataStore.save(data);
            this.renderFlowMgr(container, data);
        };

        window.delStoryBlock = (i) => {
            if(!data.storyBlocks) return;
            if(confirm('삭제하시겠습니까?')) {
                syncStoryInputs();
                data.storyBlocks.splice(i,1);
                DataStore.save(data);
                this.renderFlowMgr(container, data);
            }
        };

        window.moveStoryBlock = (i, dir) => {
            if(!data.storyBlocks) return;
            const next = i + dir;
            if(next < 0 || next >= data.storyBlocks.length) return;
            syncStoryInputs();
            [data.storyBlocks[i], data.storyBlocks[next]] = [data.storyBlocks[next], data.storyBlocks[i]];
            DataStore.save(data);
            this.renderFlowMgr(container, data);
        };

        const addMissionBtn = document.getElementById('add-mission');
        if(addMissionBtn) addMissionBtn.onclick = () => {
            syncMissionInputs();
            data.promises = data.promises || [];
            data.promises.push({ icon:'star', title:'새 약속', desc:'설명을 입력하세요' });
            DataStore.save(data);
            this.renderFlowMgr(container, data);
        };

        window.moveMission = (i, dir) => {
            if(!data.promises) return;
            const next = i + dir;
            if(next < 0 || next >= data.promises.length) return;
            syncMissionInputs();
            [data.promises[i], data.promises[next]] = [data.promises[next], data.promises[i]];
            DataStore.save(data);
            this.renderFlowMgr(container, data);
        };

        const uploadAdminFile = async (file, folder = 'uploads') => {
            const token = sessionStorage.getItem('tbfa_admin_token') || '';
            if(!token) throw new Error('관리자 로그인 후 이용해주세요.');
            const res = await fetch('/.netlify/functions/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': file.type || 'application/octet-stream',
                    'X-File-Name': encodeURIComponent(file.name || 'upload.bin'),
                    'X-Upload-Folder': folder
                },
                body: file
            });
            const payload = await res.json().catch(() => ({}));
            if(!res.ok) {
                throw new Error(payload.error || '업로드에 실패했습니다.');
            }
            if(!payload.url) throw new Error('업로드된 URL을 받지 못했습니다.');
            return payload.url;
        };

        // 타이틀 이미지 업로드 → data URL로 미리보기 및 입력란 동기화
        const heroUpload = document.getElementById('flow-hero-upload');
        if(heroUpload) {
            heroUpload.onchange = (e) => {
                const file = e.target?.files?.[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result || '';
                    const input = document.getElementById('flow-hero-image');
                    const img = document.getElementById('flow-hero-thumb');
                    if(input) input.value = dataUrl;
                    if(img) img.src = dataUrl;
                    data.hero.image = dataUrl;
                    DataStore.save(data);
                    showAdminToast('이미지를 불러왔습니다. 저장 버튼을 눌러 최종 저장하세요.');
                };
                reader.readAsDataURL(file);
            };
        }

        // 스토리 카드 이미지 업로드 → data URL 반영
        (data.storyBlocks || []).forEach((_, i) => {
            const upload = document.getElementById(`flow-story-upload-${i}`);
            if(!upload) return;
            upload.onchange = (e) => {
                const file = e.target?.files?.[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result || '';
                    const input = document.getElementById(`flow-story-img-${i}`);
                    const img = document.getElementById(`flow-story-thumb-${i}`);
                    if(input) input.value = dataUrl;
                    if(img) img.src = dataUrl;
                    if(!data.storyBlocks) data.storyBlocks = [];
                    if(data.storyBlocks[i]) data.storyBlocks[i].image = dataUrl;
                    DataStore.save(data);
                    showAdminToast('스토리 이미지가 불러와졌습니다. 저장 버튼을 눌러 최종 반영하세요.');
                };
                reader.readAsDataURL(file);
            };
        });

        // 포스터 이미지 업로드 → data URL 반영
        data.posters.forEach((_, i) => {
            const upload = document.getElementById(`flow-poster-upload-${i}`);
            if(!upload) return;
            upload.onchange = (e) => {
                const file = e.target?.files?.[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result || '';
                    const input = document.getElementById(`flow-poster-url-${i}`);
                    const img = document.getElementById(`flow-poster-thumb-${i}`);
                    if(input) input.value = dataUrl;
                    if(img) img.src = dataUrl;
                    if(data.posters[i]) data.posters[i].url = dataUrl;
                    DataStore.save(data);
                    showAdminToast('포스터 이미지가 불러와졌습니다. 저장 버튼을 눌러 최종 반영하세요.');
                };
                reader.readAsDataURL(file);
            };
        });

        // 후원 섹션 이미지 업로드 → data URL 반영
        const donateUpload = document.getElementById('flow-donate-upload');
        if(donateUpload) {
            donateUpload.onchange = (e) => {
                const file = e.target?.files?.[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result || '';
                    const input = document.getElementById('flow-donate-image');
                    const img = document.getElementById('flow-donate-thumb');
                    if(input) input.value = dataUrl;
                    if(img) img.src = dataUrl;
                    data.settings.donateImage = dataUrl;
                    DataStore.save(data);
                    showAdminToast('후원 섹션 이미지가 불러와졌습니다. 저장 버튼을 눌러 최종 반영하세요.');
                };
                reader.readAsDataURL(file);
            };
        }

        // 탄원서 파일 업로드 → data URL로 저장/미리보기 필드 반영
        // 파일 업로드 비활성화: URL 입력만 사용
        const petitionUpload = document.getElementById('flow-petition-upload');
        if(petitionUpload) {
            petitionUpload.onchange = () => showAdminToast('현재는 파일 업로드를 지원하지 않습니다. URL만 입력해주세요.');
        }

        // 로고 업로드 → data URL 반영
        const logoUpload = document.getElementById('flow-logo-upload');
        if(logoUpload) {
            logoUpload.onchange = (e) => {
                const file = e.target?.files?.[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result || '';
                    const input = document.getElementById('flow-logo-url');
                    if(input) input.value = dataUrl;
                    data.settings.logoUrl = dataUrl;
                    DataStore.save(data);
                    showAdminToast('헤더 로고가 업로드되었습니다. 저장 버튼으로 최종 반영하세요.');
                };
                reader.readAsDataURL(file);
            };
        }

        window.delMission = (i) => {
            if(!data.promises) return;
            if(confirm('삭제하시겠습니까?')) {
                syncMissionInputs();
                data.promises.splice(i,1);
                DataStore.save(data);
                this.renderFlowMgr(container, data);
            }
        };

        window.pickMissionIcon = (i, icon) => {
            const input = document.getElementById(`flow-mission-icon-${i}`);
            if(input) input.value = icon;
            if(window.lucide) lucide.createIcons();
        };

        window.toggleSectionVisibility = (id) => {
            const hiddenArr = new Set(data.settings.hiddenSections || []);
            if(hiddenArr.has(id)) hiddenArr.delete(id); else hiddenArr.add(id);
            data.settings.hiddenSections = Array.from(hiddenArr);
            DataStore.save(data);
            this.renderFlowMgr(container, data);
        };

        const getVal = (id, fallback = '') => {
            const el = document.getElementById(id);
            return el && el.value !== undefined ? el.value : fallback;
        };

        document.getElementById('save-flow').onclick = () => {
            data.settings.sectionOrder = currentOrder;
            data.hero.title = getVal('edit-hero-title', data.hero.title);
            data.hero.subtitle = getVal('edit-hero-sub', data.hero.subtitle);
            data.hero.image = getVal('flow-hero-image', data.hero.image);
            data.hero.overlay = getVal('flow-hero-overlay', data.hero.overlay || '');
            data.settings.footerDesc = getVal('edit-footer-desc', data.settings.footerDesc);
            data.settings.footerPhone = getVal('edit-footer-phone', data.settings.footerPhone || '');
            data.settings.footerEmail = getVal('edit-footer-email', data.settings.footerEmail || '');
            data.settings.hiddenSections = Array.from(new Set(data.settings.hiddenSections || []));
            data.settings.petitionFormUrl = getVal('flow-petition-link', data.settings?.petitionFormUrl || '');
            data.settings.petitionEmail = getVal('flow-petition-email', data.settings?.petitionEmail || '');
            data.settings.smtpHost = getVal('flow-smtp-host', data.settings?.smtpHost || '');
            data.settings.smtpPort = getVal('flow-smtp-port', data.settings?.smtpPort || '');
            data.settings.smtpUser = getVal('flow-smtp-user', data.settings?.smtpUser || '');
            data.settings.smtpPass = getVal('flow-smtp-pass', data.settings?.smtpPass || '');
            data.settings.fromEmail = getVal('flow-from-email', data.settings?.fromEmail || '');
            data.settings.siteTitle = getVal('flow-site-title', data.settings?.siteTitle || '');
            data.settings.siteSubtitle = getVal('flow-site-subtitle', data.settings?.siteSubtitle || '');
            const blogUrl = getVal('flow-blog-link', data.settings?.shareLinks?.[0]?.url || '');
            data.settings.shareLinks = [{ label: "블로그", url: blogUrl }];
            data.settings.donateMainUrl = getVal('flow-donate-main-url', data.settings?.donateMainUrl || '');
            data.settings.donateKakaoUrl = getVal('flow-donate-kakao-url', data.settings?.donateKakaoUrl || '');
            data.settings.donateHappyUrl = getVal('flow-donate-happy-url', data.settings?.donateHappyUrl || '');
            data.settings.accountOwner = getVal('flow-acc-owner', data.settings?.accountOwner || '');
            data.settings.accountBank = getVal('flow-acc-bank', data.settings?.accountBank || '');
            data.settings.accountNumber = getVal('flow-acc-number', data.settings?.accountNumber || '');
            data.settings.musicUrl = getVal('flow-music-url', data.settings?.musicUrl || '');
            data.settings.donateImage = getVal('flow-donate-image', data.settings?.donateImage || '');
            data.flowTexts = {
                storyTitle: getVal('flow-story-title', data.flowTexts?.storyTitle || ''),
                storyDesc: getVal('flow-story-desc', data.flowTexts?.storyDesc || ''),
                missionTitle: getVal('flow-mission-title', data.flowTexts?.missionTitle || ''),
                missionDesc: getVal('flow-mission-desc', data.flowTexts?.missionDesc || ''),
                planTitle: getVal('flow-plan-title', data.flowTexts?.planTitle || ''),
                planDesc: getVal('flow-plan-desc', data.flowTexts?.planDesc || ''),
                resourcesTitle: getVal('flow-res-title', data.flowTexts?.resourcesTitle || ''),
                resourcesDesc: getVal('flow-res-desc', data.flowTexts?.resourcesDesc || ''),
                postersTitle: getVal('flow-posters-title', data.flowTexts?.postersTitle || ''),
                postersDesc: getVal('flow-posters-desc', data.flowTexts?.postersDesc || ''),
                commentsTitle: getVal('flow-comments-title', data.flowTexts?.commentsTitle || ''),
                commentsNote: getVal('flow-comments-note', data.flowTexts?.commentsNote || ''),
                donateTitle: getVal('flow-donate-title', data.flowTexts?.donateTitle || '')
            };

            data.storyBlocks = (data.storyBlocks || []).map((s, i) => ({
                ...s,
                title: document.getElementById(`flow-story-title-${i}`)?.value || '',
                content: document.getElementById(`flow-story-content-${i}`)?.value || '',
                image: document.getElementById(`flow-story-img-${i}`)?.value || '',
                position: document.getElementById(`flow-story-pos-${i}`)?.value || 'right',
                bg: document.getElementById(`flow-story-bg-${i}`)?.value || s.bg || '#f3f4f6'
            }));

            data.promises = (data.promises || []).map((m, i) => ({
                ...m,
                icon: document.getElementById(`flow-mission-icon-${i}`)?.value || '',
                title: document.getElementById(`flow-mission-title-${i}`)?.value || '',
                desc: document.getElementById(`flow-mission-desc-${i}`)?.value || ''
            }));

            // 포스터 저장
            data.posters = data.posters.map((p, i) => ({
                ...p,
                title: document.getElementById(`flow-poster-title-${i}`)?.value || '',
                url: document.getElementById(`flow-poster-url-${i}`)?.value || '',
                link: document.getElementById(`flow-poster-link-${i}`)?.value || window.location.href,
                qr: document.getElementById(`flow-poster-qr-${i}`)?.src || ''
            }));

            DataStore.save(data);
            showAdminToast('섹션 순서/문구/포스터/스토리가 저장되었습니다.');
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: data }));
        };

        regenerateOrderList();
        reorderEditPanels();
        window.updatePosterThumb = (i) => {
            const url = document.getElementById(`flow-poster-url-${i}`)?.value || '';
            const img = document.getElementById(`flow-poster-thumb-${i}`);
            if(img) img.src = url;
        };
        window.updateHeroThumb = () => {
            const url = document.getElementById('flow-hero-image')?.value || '';
            const img = document.getElementById('flow-hero-thumb');
            if(img) img.src = url;
        };
        window.updateStoryThumb = (i) => {
            const url = document.getElementById(`flow-story-img-${i}`)?.value || '';
            const img = document.getElementById(`flow-story-thumb-${i}`);
            if(img) img.src = url;
        };

        const exportSignatures = () => {
            if(!data.signatures || data.signatures.length === 0) {
                showAdminToast('다운로드할 서명이 없습니다.');
                return;
            }
            const headers = ['성명','연락처','주민번호앞6','서명이미지','시간'];
            const rows = data.signatures.map(s => {
                const dt = s.timestamp ? new Date(s.timestamp) : null;
                const formatted = dt && !isNaN(dt) ? dt.toLocaleString('ko-KR') : '';
                const imgHtml = s.signData ? `<img src="${s.signData}" style="max-height:200px; max-width:200px;"/>` : '-';
                return [sanitize(s.name), sanitize(s.phone), sanitize(s.ssn), imgHtml, formatted];
            });
            const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>서명 리스트</title>
<style>
body { font-family: Arial, sans-serif; padding: 16px; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
th { background: #f3f4f6; text-align: left; }
</style>
</head>
<body>
<h2>서명 리스트 (${data.signatures.length}건)</h2>
<table>
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>
        ${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}
    </tbody>
</table>
</body>
</html>`;
            const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `signatures_${new Date().toISOString().slice(0,10)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showAdminToast('서명 리스트를 다운로드했습니다.');
        };

        const exportPetitions = () => {
            if(!data.petitions || data.petitions.length === 0) {
                showAdminToast('다운로드할 제출 내역이 없습니다.');
                return;
            }
            const headers = ['성명','파일','시간'];
            const origin = window.location.origin;
            const rows = data.petitions.map(p => {
                const dt = p.timestamp ? new Date(p.timestamp) : (p.date ? new Date(p.date) : null);
                const formatted = dt && !isNaN(dt) ? dt.toLocaleString('ko-KR') : '';
                const safeName = sanitize(p.fileName || '파일 보기');
                const href = p.fileUrl ? (p.fileUrl.startsWith('http') ? p.fileUrl : `${origin}${p.fileUrl}`) : '';
                const fileCell = href
                    ? `<a href="${href}" target="_blank" rel="noopener" download="${safeName}">${safeName}</a>`
                    : sanitize(p.fileName || '업로드 없음');
                return [sanitize(p.name), fileCell, formatted];
            });
            const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>제출 현황</title>
<style>
body { font-family: Arial, sans-serif; padding: 16px; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
th { background: #f3f4f6; text-align: left; }
</style>
</head>
<body>
<h2>제출 현황 (${data.petitions.length}건)</h2>
<table>
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>
        ${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}
    </tbody>
</table>
</body>
</html>`;
            const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `petitions_${new Date().toISOString().slice(0,10)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showAdminToast('제출 현황을 다운로드했습니다.');
        };

        const exportBtn = document.getElementById('export-signatures');
        if(exportBtn) exportBtn.onclick = exportSignatures;
        const exportPetBtn = document.getElementById('export-petitions');
        if(exportPetBtn) exportPetBtn.onclick = exportPetitions;
        const downloadPetFilesBtn = document.getElementById('download-petition-files');
        if(downloadPetFilesBtn) downloadPetFilesBtn.onclick = async () => {
            if(!data.petitions || data.petitions.length === 0) {
                showAdminToast('다운로드할 파일이 없습니다.');
                return;
            }
            const withFiles = data.petitions.filter(p => p.fileUrl);
            if(withFiles.length === 0) {
                showAdminToast('첨부된 파일이 없습니다.');
                return;
            }
            showAdminToast('파일을 순차적으로 저장합니다...');
            for (const p of withFiles) {
                try {
                    const res = await fetch(p.fileUrl);
                    if(!res.ok) throw new Error('fetch failed');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = (p.fileName || 'petition_file');
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (err) {
                    console.warn('파일 다운로드 실패', err);
                }
            }
            showAdminToast('파일 다운로드를 완료했습니다.');
        };

        const syncStoryInputs = () => {
            if(!data.storyBlocks) return;
            data.storyBlocks = data.storyBlocks.map((s, i) => ({
                ...s,
                title: document.getElementById(`flow-story-title-${i}`)?.value || s.title,
                content: document.getElementById(`flow-story-content-${i}`)?.value || s.content,
                image: document.getElementById(`flow-story-img-${i}`)?.value || s.image,
                position: document.getElementById(`flow-story-pos-${i}`)?.value || s.position || 'right',
                bg: document.getElementById(`flow-story-bg-${i}`)?.value || s.bg || '#f3f4f6'
            }));
        };

        const syncMissionInputs = () => {
            if(!data.promises) return;
            data.promises = data.promises.map((m, i) => ({
                ...m,
                icon: document.getElementById(`flow-mission-icon-${i}`)?.value || m.icon,
                title: document.getElementById(`flow-mission-title-${i}`)?.value || m.title,
                desc: document.getElementById(`flow-mission-desc-${i}`)?.value || m.desc
            }));
        };

        function showAdminToast(msg) {
            let toast = document.getElementById('admin-toast');
            if(!toast) {
                toast = document.createElement('div');
                toast.id = 'admin-toast';
                toast.style.position = 'fixed';
                toast.style.top = '20px';
                toast.style.right = '20px';
                toast.style.zIndex = '12000';
                toast.style.padding = '12px 16px';
                toast.style.background = '#111827';
                toast.style.color = 'white';
                toast.style.borderRadius = '10px';
                toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                toast.style.transition = 'opacity 0.3s, transform 0.3s';
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                toast.style.pointerEvents = 'none'; // 클릭 막지 않도록
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
            }, 2000);
        }
    },
    renderBudgetMgr(container, data) {
        const target = Number(data.settings?.targetAmount) || 0;
        const palette = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#00A29D', '#FF6B6B'];
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm flex flex-col gap-6">
                <div class="flex gap-6 flex-col lg:flex-row">
                    <div class="lg:w-1/3 h-64">
                        <canvas id="adminBudgetChart"></canvas>
                    </div>
                    <div class="lg:w-2/3 space-y-3" id="budget-items">
                        ${data.budget.map((b,i)=>`
                            <div class="flex items-center gap-3 border rounded-lg p-3">
                                <div class="flex-1">
                                    <label class="text-[11px] text-gray-500">항목명</label>
                                    <input id="budget-label-${i}" value="${sanitize(b.label)}" class="w-full border p-2 rounded text-sm">
                                </div>
                                <div class="w-28">
                                    <label class="text-[11px] text-gray-500">비율(%)</label>
                                    <input id="budget-perc-${i}" type="number" min="0" max="100" step="0.1" value="${b.value}" class="border p-2 rounded w-full text-right">
                                </div>
                                <div class="text-sm text-gray-600 min-w-[120px] text-right">≈ ${formatCurrency(Math.round(target * (Number(b.value||0)/100)))}원</div>
                                <button class="text-red-500 text-xs border border-red-200 px-2 py-1 rounded" onclick="window.delBudgetItem(${i})">삭제</button>
                            </div>
                        `).join('')}
                        <button id="add-budget-item" class="w-full border border-dashed border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2"><i data-lucide="plus" class="w-4 h-4"></i> 항목 추가</button>
                    </div>
                </div>
                <button id="save-budget" class="self-end bg-primary text-white px-4 py-2 rounded font-bold">저장</button>
            </div>`;

        new Chart(document.getElementById('adminBudgetChart'), { type: 'pie', data: { labels: data.budget.map(b=>b.label), datasets: [{ data: data.budget.map(b=>target*(Number(b.value||0)/100)), backgroundColor: data.budget.map(b=>b.color) }] } });

        const budgetToast = (msg) => {
            let toast = document.getElementById('admin-toast');
            if(!toast) {
                toast = document.createElement('div');
                toast.id = 'admin-toast';
                toast.style.position = 'fixed';
                toast.style.top = '20px';
                toast.style.right = '20px';
                toast.style.zIndex = '12000';
                toast.style.padding = '12px 16px';
                toast.style.background = '#111827';
                toast.style.color = 'white';
                toast.style.borderRadius = '10px';
                toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                toast.style.transition = 'opacity 0.3s, transform 0.3s';
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                toast.style.pointerEvents = 'none';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
            }, 2000);
        };

        document.getElementById('save-budget').onclick = () => {
            const updated = data.budget.map((b,i)=>({
                ...b,
                label: document.getElementById(`budget-label-${i}`)?.value || b.label,
                value: Number(document.getElementById(`budget-perc-${i}`)?.value || b.value) || 0
            }));
            const totalPerc = updated.reduce((s,b)=>s+Number(b.value||0),0);
            if(totalPerc > 100.0001) {
                budgetToast(`비율 합계가 ${totalPerc.toFixed(1)}% 입니다. 100% 이내로 맞춰주세요.`);
                return;
            }
            data.budget = updated;
            DataStore.save(data);
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: data }));
            this.renderDashboard('budget');
            budgetToast('예산 비율이 저장되었습니다.');
        };

        window.delBudgetItem = (i) => {
            data.budget.splice(i,1);
            DataStore.save(data);
            this.renderDashboard('budget');
        };
        document.getElementById('add-budget-item').onclick = () => {
            const nextColor = palette[data.budget.length % palette.length];
            data.budget.push({ label: '새 항목', value: 0, color: nextColor });
            DataStore.save(data);
            this.renderDashboard('budget');
        };
    },
    renderSignListMgr(container, data) {
        const signatures = data.signatures || [];
        const signPageSize = 15;
        if (this.signPage == null) this.signPage = 0;
        if (this.signQuery == null) this.signQuery = '';
        const getSignListMeta = () => {
            const signQuery = this.signQuery.trim().toLowerCase();
            const signList = signatures.map((s, i) => ({ s, i })).reverse();
            const filteredSignList = signQuery
                ? signList.filter(({ s }) => (s.name || '').toLowerCase().includes(signQuery))
                : signList;
            const totalSignPages = Math.max(1, Math.ceil(filteredSignList.length / signPageSize));
            if (this.signPage > totalSignPages - 1) this.signPage = totalSignPages - 1;
            const signStart = this.signPage * signPageSize;
            const signPageItems = filteredSignList.slice(signStart, signStart + signPageSize);
            return { filteredSignList, totalSignPages, signPageItems };
        };
        const renderSignListTable = () => {
            const { filteredSignList, totalSignPages, signPageItems } = getSignListMeta();
            return `
                ${filteredSignList.length === 0 ? `<div class="text-center text-gray-400 py-4 text-sm">검색 결과가 없습니다.</div>` : `
                <table class="min-w-full text-left text-sm">
                    <thead class="text-xs text-gray-500 border-b">
                        <tr>
                            <th class="py-2 px-2">성명</th>
                            <th class="py-2 px-2">연락처</th>
                            <th class="py-2 px-2">주민번호(앞 6)</th>
                            <th class="py-2 px-2">서명</th>
                            <th class="py-2 px-2">시간</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${signPageItems.map(({s,i}) => {
                            const dt = s.timestamp ? new Date(s.timestamp) : null;
                            const formatted = dt && !isNaN(dt) ? dt.toLocaleString('ko-KR') : '';
                            return `<tr>
                                <td class="py-2 px-2">${sanitize(s.name)}</td>
                                <td class="py-2 px-2">${sanitize(s.phone)}</td>
                                <td class="py-2 px-2">${sanitize(s.ssn)}</td>
                                <td class="py-2 px-2">${s.signData ? `<button class="text-primary text-xs underline" onclick="window.viewSignature(${i})">보기</button>` : '-'}</td>
                                <td class="py-2 px-2 text-xs text-gray-400">${formatted}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                <div class="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>페이지 ${this.signPage + 1} / ${totalSignPages} (15개씩)</span>
                    <div class="flex items-center gap-1">
                        <button class="border border-gray-300 px-2 py-1 rounded ${this.signPage === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}" onclick="window.setSignPage(${this.signPage - 1})" ${this.signPage === 0 ? 'disabled' : ''}>이전</button>
                        <button class="border border-gray-300 px-2 py-1 rounded ${this.signPage >= totalSignPages - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}" onclick="window.setSignPage(${this.signPage + 1})" ${this.signPage >= totalSignPages - 1 ? 'disabled' : ''}>다음</button>
                    </div>
                </div>`}
            `;
        };

        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i data-lucide="list" class="w-4 h-4 text-primary"></i>
                        <h4 class="font-bold">서명리스트 관리</h4>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                        <span>총 서명: <span class="font-bold text-gray-800">${signatures.length}</span></span>
                        <button id="export-signatures" class="border border-gray-300 px-2 py-1 rounded text-gray-700 hover:bg-gray-50">리스트 저장</button>
                    </div>
                </div>
                <div class="flex items-center justify-end">
                    <input id="sign-search-input" value="${sanitizeAttr(this.signQuery)}" class="border border-gray-300 rounded px-2 py-1 text-xs w-48" placeholder="성명으로 검색">
                </div>
                <div class="text-xs text-gray-500">온라인 서명 입력값은 사용자 입력을 그대로 저장합니다.</div>
                <div class="overflow-x-auto">
                    <div id="sign-list-table-wrap">
                        ${renderSignListTable()}
                    </div>
                </div>
            </div>`;

        window.viewSignature = (i) => {
            const item = data.signatures && data.signatures[i];
            if(!item || !item.signData) {
                showAdminToast('서명 데이터가 없습니다.');
                return;
            }
            const win = window.open();
            if(!win) { showAdminToast('팝업이 차단되었습니다.'); return; }
            const safeSrc = item.signData.replace(/"/g,'&quot;');
            win.document.write(`<html><head><title>서명보기</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#f8fafc;"><img src="${safeSrc}" style="max-width:100%;max-height:100vh;"/></body></html>`);
        };
        const tableWrap = document.getElementById('sign-list-table-wrap');
        const refreshSignTable = () => {
            if (tableWrap) tableWrap.innerHTML = renderSignListTable();
            else this.renderSignListMgr(container, data);
        };
        const scheduleSignTableRefresh = () => {
            if (this.signSearchTimer) clearTimeout(this.signSearchTimer);
            this.signSearchTimer = setTimeout(() => {
                this.signSearchTimer = null;
                refreshSignTable();
            }, 200);
        };
        window.setSignPage = (next) => {
            const list = (data.signatures || []).map((s, i) => ({ s, i })).reverse();
            const q = (this.signQuery || '').trim().toLowerCase();
            const filtered = q ? list.filter(({ s }) => (s.name || '').toLowerCase().includes(q)) : list;
            const total = Math.max(1, Math.ceil(filtered.length / signPageSize));
            const clamped = Math.max(0, Math.min(next, total - 1));
            this.signPage = clamped;
            refreshSignTable();
        };
        const signSearchInput = document.getElementById('sign-search-input');
        if (signSearchInput) {
            signSearchInput.addEventListener('compositionstart', () => {
                this.signIsComposing = true;
            });
            signSearchInput.addEventListener('compositionend', (e) => {
                this.signIsComposing = false;
                this.signQuery = e.target.value || '';
                this.signPage = 0;
                scheduleSignTableRefresh();
            });
            signSearchInput.addEventListener('input', (e) => {
                if (e.isComposing || this.signIsComposing) return;
                this.signQuery = e.target.value || '';
                this.signPage = 0;
                scheduleSignTableRefresh();
            });
        }

        const exportSignatures = () => {
            if(!data.signatures || data.signatures.length === 0) {
                showAdminToast('다운로드할 서명이 없습니다.');
                return;
            }
            const headers = ['성명','연락처','주민번호앞6','서명이미지','시간'];
            const rows = data.signatures.map(s => {
                const dt = s.timestamp ? new Date(s.timestamp) : null;
                const formatted = dt && !isNaN(dt) ? dt.toLocaleString('ko-KR') : '';
                const imgHtml = s.signData ? `<img src="${s.signData}" style="max-height:200px; max-width:200px;"/>` : '-';
                return [sanitize(s.name), sanitize(s.phone), sanitize(s.ssn), imgHtml, formatted];
            });
            const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>서명 리스트</title>
<style>
body { font-family: Arial, sans-serif; padding: 16px; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
th { background: #f3f4f6; text-align: left; }
</style>
</head>
<body>
<h2>서명 리스트 (${data.signatures.length}건)</h2>
<table>
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>
        ${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}
    </tbody>
</table>
</body>
</html>`;
            const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `signatures_${new Date().toISOString().slice(0,10)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showAdminToast('서명 리스트를 다운로드했습니다.');
        };

        const exportBtn = document.getElementById('export-signatures');
        if(exportBtn) exportBtn.onclick = exportSignatures;
    },
    renderFooterModalMgr(container, data) {
        data.settings = data.settings || {};
        if (!Array.isArray(data.settings.footerModals)) data.settings.footerModals = [];
        while (data.settings.footerModals.length < 2) {
            data.settings.footerModals.push({ title: `푸터 모달 ${data.settings.footerModals.length + 1}`, blocks: [] });
        }
        data.settings.footerModals = data.settings.footerModals.slice(0, 2).map((modal, idx) => ({
            title: modal?.title || `푸터 모달 ${idx + 1}`,
            blocks: Array.isArray(modal?.blocks) ? modal.blocks : []
        }));

        const toast = (msg) => {
            let t = document.getElementById('admin-toast');
            if(!t) {
                t = document.createElement('div');
                t.id = 'admin-toast';
                Object.assign(t.style, {
                    position:'fixed', top:'20px', right:'20px', zIndex:'12000',
                    padding:'12px 16px', background:'#111827', color:'white',
                    borderRadius:'10px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)',
                    transition:'opacity 0.3s, transform 0.3s',
                    opacity:'0', transform:'translateY(-10px)',
                    pointerEvents:'none'
                });
                document.body.appendChild(t);
            }
            t.textContent = msg;
            t.style.opacity = '1';
            t.style.transform = 'translateY(0)';
            setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(-10px)'; },1500);
        };

        const renderBlocks = (modal, mi) => modal.blocks.map((block, bi) => {
            if (block.type === 'image') {
                const imgId = `footer-modal-${mi}-img-${bi}`;
                const previewId = `footer-modal-${mi}-img-preview-${bi}`;
                return `
                    <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-gray-500">이미지</span>
                            <button class="text-red-500 text-xs" onclick="window.removeFooterModalBlock(${mi}, ${bi})">삭제</button>
                        </div>
                        <input id="${imgId}" value="${sanitizeAttr(block.value || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...jpg" oninput="window.updateFooterModalImage(${mi}, ${bi})">
                        <div class="mt-2 w-full aspect-[4/3] bg-white border rounded overflow-hidden">
                            <img id="${previewId}" src="${sanitize(block.value || '')}" class="w-full h-full object-cover">
                        </div>
                    </div>
                `;
            }
            const htmlId = `footer-modal-${mi}-html-${bi}`;
            return `
                <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-gray-500">HTML</span>
                        <button class="text-red-500 text-xs" onclick="window.removeFooterModalBlock(${mi}, ${bi})">삭제</button>
                    </div>
                    <textarea id="${htmlId}" class="w-full border p-2 rounded text-sm font-mono h-32 focus:h-56 transition-all">${block.value || ''}</textarea>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="space-y-6">
                ${data.settings.footerModals.map((modal, mi) => `
                    <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="font-bold text-lg">푸터 모달 ${mi + 1}</h3>
                            <button class="border border-gray-300 px-2 py-1 rounded text-xs text-gray-700 hover:bg-gray-50" onclick="window.saveFooterModal(${mi})">저장</button>
                        </div>
                        <div>
                            <label class="text-xs text-gray-500">모달 제목 / 버튼 이름</label>
                            <input id="footer-modal-title-input-${mi}" value="${sanitizeAttr(modal.title || '')}" class="w-full border p-2 rounded text-sm">
                        </div>
                        <div class="space-y-3">
                            ${modal.blocks.length === 0 ? `<div class="text-xs text-gray-400">등록된 콘텐츠가 없습니다.</div>` : renderBlocks(modal, mi)}
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button class="border border-gray-300 px-3 py-1.5 rounded text-xs text-gray-700 hover:bg-gray-50" onclick="window.addFooterModalBlock(${mi}, 'html')">HTML 추가</button>
                            <button class="border border-gray-300 px-3 py-1.5 rounded text-xs text-gray-700 hover:bg-gray-50" onclick="window.addFooterModalBlock(${mi}, 'image')">이미지 추가</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        window.updateFooterModalImage = (mi, bi) => {
            const input = document.getElementById(`footer-modal-${mi}-img-${bi}`);
            const img = document.getElementById(`footer-modal-${mi}-img-preview-${bi}`);
            if (img && input) img.src = input.value || '';
        };
        window.addFooterModalBlock = (mi, type) => {
            const modal = data.settings.footerModals[mi];
            if (!modal) return;
            modal.blocks.push({ type, value: '' });
            DataStore.save(data);
            this.renderFooterModalMgr(container, data);
        };
        window.removeFooterModalBlock = (mi, bi) => {
            const modal = data.settings.footerModals[mi];
            if (!modal) return;
            modal.blocks.splice(bi, 1);
            DataStore.save(data);
            this.renderFooterModalMgr(container, data);
        };
        window.saveFooterModal = (mi) => {
            const modal = data.settings.footerModals[mi];
            if (!modal) return;
            modal.title = document.getElementById(`footer-modal-title-input-${mi}`)?.value || '';
            modal.blocks = modal.blocks.map((block, bi) => {
                if (block.type === 'image') {
                    const val = document.getElementById(`footer-modal-${mi}-img-${bi}`)?.value || '';
                    return { ...block, value: val };
                }
                const val = document.getElementById(`footer-modal-${mi}-html-${bi}`)?.value || '';
                return { ...block, value: val };
            });
            DataStore.save(data);
            toast('푸터 모달이 저장되었습니다.');
        };
    },
    renderPosterMgr(container, data) {
        const posters = data.posters || [];
        container.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-lg flex items-center gap-2"><i data-lucide="image" class="w-5 h-5"></i> 포스터 관리</h3>
                <button id="add-poster" class="bg-primary text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1"><i data-lucide="plus" class="w-4 h-4"></i> 추가</button>
            </div>
            <div class="space-y-4">
                ${posters.map((p,i)=>`
                    <div class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                        <div class="flex gap-3">
                            <div class="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border">
                                <img src="${sanitize(p.url)}" class="w-full h-full object-cover">
                            </div>
                            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label class="text-xs text-gray-500">제목</label>
                                    <input id="poster-title-${i}" value="${sanitize(p.title)}" class="w-full border p-2 rounded text-sm">
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500">포스터 이미지 URL</label>
                                    <input id="poster-url-${i}" value="${sanitize(p.url)}" class="w-full border p-2 rounded text-sm">
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500">QR 연결 링크</label>
                                    <input id="poster-link-${i}" value="${sanitize(p.link || '')}" placeholder="https://..." class="w-full border p-2 rounded text-sm">
                                </div>
                                <div class="flex flex-col gap-2">
                                    <label class="text-xs text-gray-500">QR 미리보기</label>
                                    <div class="flex items-center gap-2">
                                        <img id="poster-qr-preview-${i}" src="${p.qr ? sanitize(p.qr) : ''}" class="w-16 h-16 border rounded bg-white object-contain">
                                        <button class="px-3 py-2 text-xs bg-gray-900 text-white rounded" onclick="window.genPosterQR(${i})">QR 생성</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-end gap-2">
                            <button class="text-red-500 text-sm" onclick="window.delPoster(${i})">삭제</button>
                            <button class="bg-primary text-white px-4 py-2 rounded text-sm" onclick="window.savePoster(${i})">저장</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const generateQRDataUrl = (text) => new Promise((resolve, reject) => {
            try {
                const temp = document.createElement('div');
                temp.style.position = 'fixed';
                temp.style.left = '-9999px';
                document.body.appendChild(temp);
                const qr = new QRCode(temp, { text, width: 160, height: 160, correctLevel: QRCode.CorrectLevel.H });
                setTimeout(() => {
                    const canvas = temp.querySelector('canvas');
                    if (canvas) resolve(canvas.toDataURL('image/png'));
                    else reject(new Error('QR generation failed'));
                    document.body.removeChild(temp);
                }, 50);
            } catch (err) {
                reject(err);
            }
        });

        window.genPosterQR = async (i) => {
            const link = document.getElementById(`poster-link-${i}`).value || window.location.href;
            try {
                const dataUrl = await generateQRDataUrl(link);
                document.getElementById(`poster-qr-preview-${i}`).src = dataUrl;
                data.posters[i].qr = dataUrl;
                data.posters[i].link = link;
                DataStore.save(data);
                showToast('QR이 생성되었습니다.');
            } catch (err) {
                showToast('QR 생성 실패');
            }
        };

        window.savePoster = (i) => {
            data.posters[i].title = document.getElementById(`poster-title-${i}`).value;
            data.posters[i].url = document.getElementById(`poster-url-${i}`).value;
            data.posters[i].link = document.getElementById(`poster-link-${i}`).value || window.location.href;
            data.posters[i].qr = document.getElementById(`poster-qr-preview-${i}`).src || '';
            DataStore.save(data);
            showToast('포스터가 저장되었습니다.');
        };

        window.delPoster = (i) => {
            if(confirm('삭제하시겠습니까?')) {
                data.posters.splice(i,1);
                DataStore.save(data);
                this.renderPosterMgr(container, data);
            }
        };

        document.getElementById('add-poster').onclick = () => {
            data.posters.push({ title: '새 포스터', url: '', link: window.location.href, qr: '' });
            DataStore.save(data);
            this.renderPosterMgr(container, data);
        };
    },
    renderCommunityMgr(container, data) {
        data.settings = data.settings || {};
        const commentLimit = Number(data.settings.commentsDisplayLimit || 0);
        const adminToast = (msg) => {
            let t = document.getElementById('admin-panel-toast');
            if (!t) {
                t = document.createElement('div');
                t.id = 'admin-panel-toast';
                t.className = 'fixed top-6 right-6 z-[12000] bg-gray-900 text-white px-4 py-2 rounded shadow-lg transition-all';
                t.style.opacity = '0';
                t.style.transform = 'translateY(-8px)';
                document.body.appendChild(t);
            }
            t.textContent = msg;
            requestAnimationFrame(() => {
                t.style.opacity = '1';
                t.style.transform = 'translateY(0)';
            });
            setTimeout(() => {
                t.style.opacity = '0';
                t.style.transform = 'translateY(-8px)';
            }, 1600);
        };
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="font-bold">댓글 관리</h3>
                <div class="flex items-center gap-2 text-xs text-gray-600">
                    <label for="comments-display-limit" class="text-gray-500">메인 노출 개수</label>
                    <input id="comments-display-limit" type="number" min="1" value="${commentLimit || 4}" class="w-20 border border-gray-300 rounded px-2 py-1 text-right">
                    <button id="save-comments-limit" class="border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">저장</button>
                </div>
            </div>
            <div class="space-y-3">
                ${data.comments.map((c,i) => `
                    <div class="border p-4 rounded flex justify-between items-start ${c.approved?'bg-gray-50':'bg-yellow-50 border-yellow-200'}">
                        <div class="flex flex-col gap-1 w-full">
                            <div class="flex justify-between items-center">
                                <span class="font-bold text-sm text-gray-700">
                                    ${sanitize(c.realName || c.author || '')}
                                    ${c.isPrivate ? `<span class="text-[11px] text-gray-500 ml-1">(공개명: ${sanitize(c.author || '익명')})</span>` : ''}
                                    <span class="font-normal text-xs text-gray-500">${c.approved ? '(승인됨)' : '(승인 대기)'}</span>
                                </span>
                                <div class="flex gap-2 shrink-0">
                                    ${!c.approved ? `<button onclick="window.approveMsg(${i})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors">승인</button>` : ''}
                                    <button onclick="window.delMsg(${i})" class="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded">삭제</button>
                                </div>
                            </div>
                            <p class="text-gray-800 text-sm">${sanitize(c.text)}</p>
                            <div class="mt-2 bg-white border border-gray-200 rounded-lg p-3">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-gray-600">관리자 대댓글</span>
                                    <div class="flex gap-2">
                                        ${c.reply && c.reply.text ? `<button onclick="window.editReply(${i})" class="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">수정</button>` : ''}
                                        ${c.reply && c.reply.text ? `<button onclick="window.delReply(${i})" class="text-xs border border-red-200 text-red-500 px-2 py-1 rounded">삭제</button>` : ''}
                                    </div>
                                </div>
                                ${c.reply && c.reply.text
                                    ? `<div class="text-sm text-gray-700 whitespace-pre-line">${sanitize(c.reply.text)}</div>
                                       <div class="text-[10px] text-gray-400 mt-1">${(() => {
                                            const ts = c.reply.updatedAt || c.reply.timestamp;
                                            const dt = ts ? new Date(ts) : null;
                                            return (dt && !isNaN(dt)) ? dt.toLocaleString('ko-KR') : '';
                                        })()}</div>`
                                    : `<textarea id="reply-input-${i}" class="w-full border p-2 rounded text-sm h-20" placeholder="관리자 대댓글을 입력하세요."></textarea>
                                       <div class="flex justify-end mt-2">
                                           <button onclick="window.saveReply(${i})" class="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-black">등록</button>
                                       </div>`
                                }
                            </div>
                            <div class="text-[10px] text-gray-400 flex gap-2 items-center mt-1 border-t pt-2 border-gray-200/50">
                                <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${(() => {
                                    const src = c.timestamp || c.date || c.time;
                                    const dt = src ? new Date(src) : null;
                                    return (dt && !isNaN(dt)) ? dt.toLocaleString('ko-KR') : (c.date || c.time || '');
                                })()}</span>
                                <span class="w-px h-3 bg-gray-300"></span>
                                <span class="flex items-center gap-1"><i data-lucide="monitor" class="w-3 h-3"></i> ${c.device || 'Unknown'}</span>
                                <span class="w-px h-3 bg-gray-300"></span>
                                <span class="flex items-center gap-1"><i data-lucide="shield" class="w-3 h-3"></i> IP: ${this.maskIP(c.ip)}</span>
                            </div>
                        </div>
                    </div>`).join('')}
            </div>
        </div>`;
        
        window.approveMsg = (i) => { data.comments[i].approved = true; DataStore.save(data); this.renderDashboard('community'); };
        window.delMsg = (i) => { data.comments.splice(i,1); DataStore.save(data); this.renderDashboard('community'); };
        window.saveReply = (i) => {
            const input = document.getElementById(`reply-input-${i}`);
            const text = (input?.value || '').trim();
            if (!text) return;
            data.comments[i].reply = {
                text,
                timestamp: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            DataStore.save(data);
            this.renderDashboard('community');
        };
        window.editReply = (i) => {
            const current = data.comments[i].reply?.text || '';
            const text = prompt('대댓글 수정', current);
            if (text == null) return;
            const trimmed = text.trim();
            if (!trimmed) return;
            data.comments[i].reply = {
                text: trimmed,
                timestamp: data.comments[i].reply?.timestamp || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            DataStore.save(data);
            this.renderDashboard('community');
        };
        window.delReply = (i) => {
            if (!data.comments[i].reply) return;
            if (confirm('대댓글을 삭제하시겠습니까?')) {
                delete data.comments[i].reply;
                DataStore.save(data);
                this.renderDashboard('community');
            }
        };
        const saveLimitBtn = document.getElementById('save-comments-limit');
        if (saveLimitBtn) {
            saveLimitBtn.onclick = () => {
                const val = Number(document.getElementById('comments-display-limit')?.value || 0);
                data.settings.commentsDisplayLimit = Math.max(1, val || 4);
                DataStore.save(data);
                adminToast('메인 노출 개수가 저장되었습니다.');
            };
        }
        if(window.lucide) lucide.createIcons();
    },
    renderDonateJoinMgr(container, data) {
        const fields = data.settings?.donateFields || [];
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2"><i data-lucide="edit-3" class="w-4 h-4 text-primary"></i><h3 class="font-bold">후원 가입 관리</h3></div>
                    <button type="button" id="add-donate-field" class="border border-primary text-primary px-3 py-1 rounded text-sm">필드 추가</button>
                </div>
                <div class="space-y-3 bg-gray-50 border rounded-xl p-3">
                    <div class="flex items-center gap-2 text-sm font-bold text-gray-700"><i data-lucide="file-text" class="w-4 h-4 text-primary"></i>약관 내용</div>
                    <textarea id="donate-terms-edit" class="w-full border rounded-lg p-3 text-sm min-h-[120px]" placeholder="캠페인 약관을 입력하세요.">${sanitize(data.settings?.donateTerms || '')}</textarea>
                </div>
                <div class="space-y-3" id="donate-field-list">
                    ${fields.length === 0 ? `<div class="text-center text-gray-400 py-6 text-sm">필드가 없습니다.</div>` : fields.map((f,i)=>`
                        <div class="border rounded-xl p-3 flex flex-col md:flex-row gap-3 items-start md:items-center">
                            <div class="flex-1 w-full">
                                <label class="text-[11px] text-gray-500">레이블</label>
                                <input type="text" id="donate-field-label-${i}" value="${sanitize(f.label || '')}" class="w-full border p-2 rounded text-sm">
                            </div>
                            <div class="flex-1 w-full">
                                <label class="text-[11px] text-gray-500">placeholder</label>
                                <input type="text" id="donate-field-placeholder-${i}" value="${sanitize(f.placeholder || '')}" class="w-full border p-2 rounded text-sm">
                            </div>
                            <div class="w-40">
                                <label class="text-[11px] text-gray-500">name</label>
                                <input type="text" id="donate-field-name-${i}" value="${sanitize(f.name || '')}" class="w-full border p-2 rounded text-sm">
                            </div>
                            <label class="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                <input type="checkbox" id="donate-field-required-${i}" ${f.required ? 'checked' : ''} class="rounded border-gray-300">
                                필수
                            </label>
                            <button class="text-red-500 text-xs border border-red-200 px-2 py-1 rounded" onclick="window.delDonateField(${i})">삭제</button>
                        </div>
                    `).join('')}
                </div>
                <div class="flex justify-end">
                    <button type="button" id="save-donate-fields" class="bg-primary text-white px-4 py-2 rounded font-bold">저장</button>
                </div>
            </div>
        `;
        const adminToast = (msg) => {
            let t = document.getElementById('admin-panel-toast');
            if (!t) {
                t = document.createElement('div');
                t.id = 'admin-panel-toast';
                t.className = 'fixed top-6 right-6 z-[12000] bg-gray-900 text-white px-4 py-2 rounded shadow-lg transition-all';
                t.style.opacity = '0';
                t.style.transform = 'translateY(-8px)';
                document.body.appendChild(t);
            }
            t.textContent = msg;
            requestAnimationFrame(() => {
                t.style.opacity = '1';
                t.style.transform = 'translateY(0)';
            });
            setTimeout(() => {
                t.style.opacity = '0';
                t.style.transform = 'translateY(-8px)';
            }, 1600);
        };

        const collectFields = () => {
            const list = data.settings.donateFields || [];
            for(let i=0;i<list.length;i++){
                list[i].label = document.getElementById(`donate-field-label-${i}`).value;
                list[i].placeholder = document.getElementById(`donate-field-placeholder-${i}`).value;
                list[i].name = document.getElementById(`donate-field-name-${i}`).value || `field_${i}`;
                list[i].required = document.getElementById(`donate-field-required-${i}`).checked;
            }
            return list;
        };

        document.getElementById('add-donate-field').onclick = () => {
            const current = collectFields();
            current.push({ label:'', name:'', placeholder:'', required:false });
            data.settings.donateFields = current;
            DataStore.save(data);
            this.renderDashboard('donateJoin');
            adminToast('후원 가입 필드가 추가되었습니다.');
        };
        window.delDonateField = (idx) => {
            const current = collectFields().filter((_,i)=>i!==idx);
            data.settings.donateFields = current;
            DataStore.save(data);
            this.renderDashboard('donateJoin');
            adminToast('후원 가입 필드가 삭제되었습니다.');
        };
        document.getElementById('save-donate-fields').onclick = () => {
            const list = collectFields();
            data.settings.donateFields = list;
            data.settings.donateTerms = document.getElementById('donate-terms-edit').value || '';
            DataStore.save(data);
            adminToast('후원 가입 필드가 저장되었습니다.');
        };
        const subs = data.settings?.donateSubmissions || [];
        const subWrap = document.createElement('div');
        const renderSubs = () => {
            if (subs.length === 0) return '<div class="text-center text-gray-400 py-4 text-sm">아직 신청이 없습니다.</div>';
            return `
            <div class="max-h-72 overflow-y-auto border rounded-xl divide-y">
                ${subs.map(s => {
                    const ts = s.timestamp ? new Date(s.timestamp) : null;
                    const time = ts && !isNaN(ts) ? ts.toLocaleString('ko-KR') : '';
                    const snapshot = Array.isArray(s.fieldsSnapshot) ? s.fieldsSnapshot : [];
                    const entries = snapshot.length
                        ? snapshot
                        : Object.keys(s.form || {}).map((k)=>({ name:k, label:k }));
                    return `<div class="p-3">
                        <div class="text-xs text-gray-500 mb-2">${time}</div>
                        <div class="grid md:grid-cols-2 gap-2 text-sm">
                            ${entries.map(field => {
                                const val = s.form ? (s.form[field.name] || '') : (s[field.name] || '');
                                return `<div><span class="font-semibold text-gray-700">${sanitize(field.label || field.name)}:</span> ${sanitize(val)}</div>`;
                            }).join('')}
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        };
        subWrap.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-3 mt-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2"><i data-lucide="list" class="w-4 h-4 text-primary"></i><h4 class="font-bold">신청 내역</h4></div>
                    <button type="button" id="export-donate-joins" class="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50">엑셀 다운로드</button>
                </div>
                ${renderSubs()}
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-4 mt-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2"><i data-lucide="bar-chart-2" class="w-4 h-4 text-primary"></i><h4 class="font-bold">신청 통계</h4></div>
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                        <button type="button" id="export-donate-stats" class="border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50">통계 엑셀</button>
                        <select id="donate-stats-label" class="border border-gray-300 rounded px-2 py-1">
                            <option value="__all__">전체 레이블</option>
                        </select>
                        <select id="donate-stats-range" class="border border-gray-300 rounded px-2 py-1">
                            <option value="all">전체</option>
                            <option value="7">최근 7일</option>
                            <option value="30">최근 30일</option>
                        </select>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <label class="flex items-center gap-2">
                        <input type="checkbox" id="donate-stats-value-toggle" class="rounded border-gray-300">
                        레이블 값 기준 통계 보기
                    </label>
                    <select id="donate-stats-value-label" class="border border-gray-300 rounded px-2 py-1 hidden">
                        <option value="">레이블 선택</option>
                    </select>
                </div>
                <div id="donate-stats-empty" class="text-sm text-gray-400 hidden">통계를 표시할 데이터가 없습니다.</div>
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="border rounded-lg p-3">
                        <div class="text-xs text-gray-500 mb-2">일자별 건수 (막대)</div>
                        <canvas id="donate-stats-bar"></canvas>
                    </div>
                    <div class="border rounded-lg p-3">
                        <div class="text-xs text-gray-500 mb-2">일자별 누적 (꺾은선)</div>
                        <canvas id="donate-stats-line"></canvas>
                    </div>
                </div>
                <div class="border rounded-lg p-3">
                    <div class="text-xs text-gray-500 mb-2">레이블 분포 (파이)</div>
                    <canvas id="donate-stats-pie"></canvas>
                </div>
            </div>
        `;
        while (subWrap.firstElementChild) {
            container.appendChild(subWrap.firstElementChild);
        }
        const exportBtn = document.getElementById('export-donate-joins');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (!subs || subs.length === 0) {
                    adminToast('다운로드할 신청 내역이 없습니다.');
                    return;
                }
                const labelCounts = new Map();
                const labelOrder = [];
                const rows = subs.map((s) => {
                    const row = {};
                    const snapshot = Array.isArray(s.fieldsSnapshot) ? s.fieldsSnapshot : [];
                    const entries = snapshot.length
                        ? snapshot
                        : Object.keys(s.form || {}).map((k) => ({ name: k, label: k }));
                    entries.forEach((field) => {
                        const label = field.label || field.name || '';
                        if (!label) return;
                        row[label] = s.form ? (s.form[field.name] || '') : (s[field.name] || '');
                    });
                    Object.keys(row).forEach((label) => {
                        labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
                        if (!labelOrder.includes(label)) labelOrder.push(label);
                    });
                    return row;
                });
                const headers = Array.from(labelCounts.keys()).sort((a, b) => {
                    const diff = (labelCounts.get(b) || 0) - (labelCounts.get(a) || 0);
                    if (diff !== 0) return diff;
                    return labelOrder.indexOf(a) - labelOrder.indexOf(b);
                });
                const escapeHtml = (value) => {
                    const text = String(value ?? '');
                    return text.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
                };
                const table = `
<table>
    <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>
        ${rows.map(row => `<tr>${headers.map(h => `<td>${escapeHtml(row[h] || '')}</td>`).join('')}</tr>`).join('')}
    </tbody>
</table>`;
                const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>후원 가입 신청 내역</title>
<style>
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; text-align: left; }
th { background: #f3f4f6; }
</style>
</head>
<body>
${table}
</body>
</html>`;
                const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `donate_joins_${new Date().toISOString().slice(0,10)}.xls`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                adminToast('엑셀 파일을 다운로드했습니다.');
            });
        }
        const labelSelect = document.getElementById('donate-stats-label');
        const rangeSelect = document.getElementById('donate-stats-range');
        const valueToggle = document.getElementById('donate-stats-value-toggle');
        const valueLabelSelect = document.getElementById('donate-stats-value-label');
        const statsExportBtn = document.getElementById('export-donate-stats');
        const emptyEl = document.getElementById('donate-stats-empty');
        const barCanvas = document.getElementById('donate-stats-bar');
        const lineCanvas = document.getElementById('donate-stats-line');
        const pieCanvas = document.getElementById('donate-stats-pie');
        if (labelSelect && rangeSelect && valueToggle && valueLabelSelect && statsExportBtn && barCanvas && lineCanvas && pieCanvas) {
            const getLabelEntries = (s) => {
                const snapshot = Array.isArray(s.fieldsSnapshot) ? s.fieldsSnapshot : [];
                const entries = snapshot.length
                    ? snapshot
                    : Object.keys(s.form || {}).map((k)=>({ name:k, label:k }));
                return entries.map((field) => ({
                    name: field.name,
                    label: field.label || field.name || ''
                })).filter(f => f.label);
            };
            const getDateKey = (s) => {
                const ts = s.timestamp ? new Date(s.timestamp) : null;
                if (!ts || isNaN(ts)) return null;
                return ts.toLocaleDateString('ko-KR');
            };
            const allLabels = new Set();
            subs.forEach((s) => {
                getLabelEntries(s).forEach((f) => allLabels.add(f.label));
            });
            Array.from(allLabels).forEach((label) => {
                const opt = document.createElement('option');
                opt.value = label;
                opt.textContent = label;
                labelSelect.appendChild(opt);
                const opt2 = document.createElement('option');
                opt2.value = label;
                opt2.textContent = label;
                valueLabelSelect.appendChild(opt2);
            });

            const destroyChart = (chart) => {
                if (chart) chart.destroy();
            };
            if (!this._donateJoinCharts) this._donateJoinCharts = {};

            const buildSeries = (label, range) => {
                const counts = new Map();
                const labelCounts = new Map();
                subs.forEach((s) => {
                    const dateKey = getDateKey(s);
                    if (!dateKey) return;
                    const entries = getLabelEntries(s);
                    const values = s.form || {};
                    entries.forEach((f) => {
                        const val = (values[f.name] || '').toString().trim();
                        if (!val) return;
                        labelCounts.set(f.label, (labelCounts.get(f.label) || 0) + 1);
                        if (label !== '__all__' && f.label !== label) return;
                        counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
                    });
                });
                const dates = Array.from(counts.keys()).map((d) => {
                    const parts = d.split('.').map(p => p.trim());
                    const safe = parts.length >= 3 ? `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}` : d;
                    return { key: d, sortKey: new Date(safe) };
                }).sort((a,b) => a.sortKey - b.sortKey);
                let filteredDates = dates;
                if (range !== 'all') {
                    const days = Number(range);
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - (days - 1));
                    filteredDates = dates.filter(d => d.sortKey >= cutoff);
                }
                const labels = filteredDates.map(d => d.key);
                const values = filteredDates.map(d => counts.get(d.key) || 0);
                const cumulative = [];
                values.reduce((sum, v, i) => {
                    const next = sum + v;
                    cumulative[i] = next;
                    return next;
                }, 0);
                return { labels, values, cumulative, labelCounts };
            };
            const buildValueSeries = (valueLabel, range) => {
                const dailyCounts = new Map();
                const valueCounts = new Map();
                subs.forEach((s) => {
                    const dateKey = getDateKey(s);
                    if (!dateKey) return;
                    const entries = getLabelEntries(s);
                    const values = s.form || {};
                    entries.forEach((f) => {
                        if (f.label !== valueLabel) return;
                        const val = (values[f.name] || '').toString().trim();
                        if (!val) return;
                        dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
                        valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
                    });
                });
                const dates = Array.from(dailyCounts.keys()).map((d) => {
                    const parts = d.split('.').map(p => p.trim());
                    const safe = parts.length >= 3 ? `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}` : d;
                    return { key: d, sortKey: new Date(safe) };
                }).sort((a,b) => a.sortKey - b.sortKey);
                let filteredDates = dates;
                if (range !== 'all') {
                    const days = Number(range);
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - (days - 1));
                    filteredDates = dates.filter(d => d.sortKey >= cutoff);
                }
                const labels = filteredDates.map(d => d.key);
                const values = filteredDates.map(d => dailyCounts.get(d.key) || 0);
                return { labels, values, valueCounts };
            };

            const renderCharts = () => {
                const useValueMode = valueToggle.checked;
                const range = rangeSelect.value;
                const label = labelSelect.value;
                const valueLabel = valueLabelSelect.value;
                const { labels, values, cumulative, labelCounts } = buildSeries(label, range);
                const hasData = labels.length > 0;
                if (emptyEl) emptyEl.classList.toggle('hidden', hasData);
                destroyChart(this._donateJoinCharts.bar);
                destroyChart(this._donateJoinCharts.line);
                destroyChart(this._donateJoinCharts.pie);
                if (hasData) {
                    if (!useValueMode) {
                        this._donateJoinCharts.bar = new Chart(barCanvas, {
                            type: 'bar',
                            data: { labels, datasets: [{ label: '건수', data: values, backgroundColor: '#60A5FA' }] },
                            options: { responsive: true, plugins: { legend: { display: false } } }
                        });
                        this._donateJoinCharts.line = new Chart(lineCanvas, {
                            type: 'line',
                            data: { labels, datasets: [{ label: '누적', data: cumulative, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.2)', fill: true, tension: 0.3 }] },
                            options: { responsive: true, plugins: { legend: { display: false } } }
                        });
                    } else if (valueLabel) {
                        const valueSeries = buildValueSeries(valueLabel, range);
                        const dateLabels = valueSeries.labels;
                        const dateValues = valueSeries.values;
                        this._donateJoinCharts.bar = new Chart(barCanvas, {
                            type: 'bar',
                            data: { labels: dateLabels, datasets: [{ label: `${valueLabel} 일자별 건수`, data: dateValues, backgroundColor: '#60A5FA' }] },
                            options: { responsive: true, plugins: { legend: { display: false } } }
                        });
                        const valueLabels = Array.from(valueSeries.valueCounts.keys());
                        if (valueLabels.length > 0) {
                            const pieData = valueLabels.map(l => valueSeries.valueCounts.get(l) || 0);
                            const colors = valueLabels.map((_, i) => `hsl(${(i * 47) % 360} 70% 60%)`);
                            this._donateJoinCharts.pie = new Chart(pieCanvas, {
                                type: 'pie',
                                data: { labels: valueLabels, datasets: [{ data: pieData, backgroundColor: colors }] },
                                options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
                            });
                        }
                    }
                }
                if (!useValueMode) {
                    const pieLabels = Array.from(labelCounts.keys());
                    if (pieLabels.length > 0) {
                        const pieData = pieLabels.map(l => labelCounts.get(l) || 0);
                        const colors = pieLabels.map((_, i) => `hsl(${(i * 47) % 360} 70% 60%)`);
                        this._donateJoinCharts.pie = new Chart(pieCanvas, {
                            type: 'pie',
                            data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: colors }] },
                            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
                        });
                    }
                }
            };
            renderCharts();
            labelSelect.addEventListener('change', renderCharts);
            rangeSelect.addEventListener('change', renderCharts);
            valueToggle.addEventListener('change', () => {
                const enabled = valueToggle.checked;
                valueLabelSelect.classList.toggle('hidden', !enabled);
                renderCharts();
            });
            valueLabelSelect.addEventListener('change', renderCharts);
            const escapeHtml = (value) => {
                const text = String(value ?? '');
                return text.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            };
            statsExportBtn.addEventListener('click', () => {
                const useValueMode = valueToggle.checked;
                const range = rangeSelect.value;
                const label = labelSelect.value;
                const valueLabel = valueLabelSelect.value;
                let htmlTables = '';
                if (!useValueMode) {
                    const series = buildSeries(label, range);
                    const rows = series.labels.map((d, i) => ({
                        date: d,
                        count: series.values[i] || 0,
                        cumulative: series.cumulative[i] || 0
                    }));
                    const labelRows = Array.from(series.labelCounts.keys()).map((k) => ({
                        label: k,
                        count: series.labelCounts.get(k) || 0
                    }));
                    htmlTables += `
<h3>일자별 건수/누적</h3>
<table>
    <thead><tr><th>날짜</th><th>건수</th><th>누적</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.count)}</td><td>${escapeHtml(r.cumulative)}</td></tr>`).join('')}</tbody>
</table>
<h3>레이블 분포</h3>
<table>
    <thead><tr><th>레이블</th><th>건수</th></tr></thead>
    <tbody>${labelRows.map(r => `<tr><td>${escapeHtml(r.label)}</td><td>${escapeHtml(r.count)}</td></tr>`).join('')}</tbody>
</table>`;
                } else if (valueLabel) {
                    const valueSeries = buildValueSeries(valueLabel, range);
                    const rows = valueSeries.labels.map((d, i) => ({
                        date: d,
                        count: valueSeries.values[i] || 0
                    }));
                    const valueRows = Array.from(valueSeries.valueCounts.keys()).map((k) => ({
                        value: k,
                        count: valueSeries.valueCounts.get(k) || 0
                    }));
                    htmlTables += `
<h3>${escapeHtml(valueLabel)} 일자별 건수</h3>
<table>
    <thead><tr><th>날짜</th><th>건수</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.count)}</td></tr>`).join('')}</tbody>
</table>
<h3>${escapeHtml(valueLabel)} 값 분포</h3>
<table>
    <thead><tr><th>값</th><th>건수</th></tr></thead>
    <tbody>${valueRows.map(r => `<tr><td>${escapeHtml(r.value)}</td><td>${escapeHtml(r.count)}</td></tr>`).join('')}</tbody>
</table>`;
                } else {
                    adminToast('레이블을 선택해주세요.');
                    return;
                }
                const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>후원 가입 통계</title>
<style>
body { font-family: Arial, sans-serif; padding: 16px; }
table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; text-align: left; }
th { background: #f3f4f6; }
h3 { margin: 16px 0 8px; }
</style>
</head>
<body>
${htmlTables}
</body>
</html>`;
                const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `donate_stats_${new Date().toISOString().slice(0,10)}.xls`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                adminToast('통계 엑셀을 다운로드했습니다.');
            });
        }
        if(window.lucide) lucide.createIcons();
    },
    renderStats(container) {
        container.innerHTML = `<div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h3 class="font-bold text-lg">방문 통계</h3>
            <div id="stats-summary" class="text-sm text-gray-500">불러오는 중...</div>
            <div class="grid md:grid-cols-3 gap-4" id="stats-agg">
                <div class="border rounded-lg p-3">
                    <h4 class="font-bold mb-2 text-sm">일간</h4>
                    <div id="stats-daily" class="text-xs text-gray-600 space-y-1 max-h-48 overflow-y-auto"></div>
                </div>
                <div class="border rounded-lg p-3">
                    <h4 class="font-bold mb-2 text-sm">주간</h4>
                    <div id="stats-weekly" class="text-xs text-gray-600 space-y-1 max-h-48 overflow-y-auto"></div>
                </div>
                <div class="border rounded-lg p-3">
                    <h4 class="font-bold mb-2 text-sm">월간</h4>
                    <div id="stats-monthly" class="text-xs text-gray-600 space-y-1 max-h-48 overflow-y-auto"></div>
                </div>
            </div>
            <div>
                <h4 class="font-bold mb-2 text-sm flex items-center gap-2"><i data-lucide="list" class="w-4 h-4 text-primary"></i>접속 로그</h4>
                <div id="stats-log" class="h-64 overflow-y-auto text-xs mt-2 space-y-1 border rounded-lg p-2 bg-gray-50"></div>
            </div>
        </div>`;

        const summary = container.querySelector('#stats-summary');
        const dailyEl = container.querySelector('#stats-daily');
        const weeklyEl = container.querySelector('#stats-weekly');
        const monthlyEl = container.querySelector('#stats-monthly');
        const logEl = container.querySelector('#stats-log');

        const renderAgg = (list, target) => {
            if(!target) return;
            if(!list || list.length === 0) {
                target.innerHTML = '<div class="text-gray-400">데이터 없음</div>';
                return;
            }
            target.innerHTML = list.map(item => `<div class="flex justify-between"><span>${item.key}</span><span class="font-bold text-gray-800">${item.count}</span></div>`).join('');
        };

        const renderLog = (entries) => {
            if(!logEl) return;
            if(!entries || entries.length === 0) {
                logEl.innerHTML = '<div class="text-center text-gray-400 py-6">로그가 없습니다.</div>';
                return;
            }
            const rows = entries.slice().reverse().map(e => {
                const ts = e.timestamp || e.ts || e.date;
                const dt = ts ? new Date(ts) : null;
                const formatted = dt && !isNaN(dt) ? dt.toLocaleString('ko-KR') : '';
                return `<div class="border-b last:border-0 pb-1">
                    <div class="flex justify-between"><span>${formatted}</span><span class="text-gray-600">${e.device || '-'}</span></div>
                    <div class="text-gray-500">IP: ${e.ip || '-'}</div>
                </div>`;
            }).join('');
            logEl.innerHTML = rows;
        };

        const renderData = (payload) => {
            if(summary) summary.textContent = `총 방문: ${payload.entries.length}`;
            renderAgg(payload.daily, dailyEl);
            renderAgg(payload.weekly, weeklyEl);
            renderAgg(payload.monthly, monthlyEl);
            renderLog(payload.entries);
            if(window.lucide) lucide.createIcons();
        };

        fetch('/.netlify/functions/stats')
            .then(res => res.ok ? res.json() : Promise.reject(new Error('fail')))
            .then(renderData)
            .catch(err => {
                console.warn('Stats load failed', err);
                const fallback = DataStore.get().stats || [];
                renderData({
                    entries: fallback,
                    daily: [],
                    weekly: [],
                    monthly: []
                });
            });
    },
    renderSettings(container, data) {
        const showSettingsToast = (msg) => {
            let toast = document.getElementById('admin-toast');
            if(!toast) {
                toast = document.createElement('div');
                toast.id = 'admin-toast';
                toast.style.position = 'fixed';
                toast.style.top = '20px';
                toast.style.right = '20px';
                toast.style.zIndex = '12000';
                toast.style.padding = '12px 16px';
                toast.style.background = '#111827';
                toast.style.color = 'white';
                toast.style.borderRadius = '10px';
                toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                toast.style.transition = 'opacity 0.3s, transform 0.3s';
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                toast.style.pointerEvents = 'none';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
            }, 2000);
        };

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
            showSettingsToast('설정이 저장되었습니다.'); 
        };

        document.getElementById('backup-data').onclick = async () => {
            try {
                const res = await fetch('/.netlify/functions/data');
                if(!res.ok) throw new Error('백업 데이터 조회 실패');
                const latest = await res.json();
                const dataStr = JSON.stringify(latest, null, 2);
                const blob = new Blob([dataStr], {type: "application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tbfa_data_backup_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showSettingsToast('백업 파일이 다운로드되었습니다.');
            } catch (err) {
                console.error(err);
                showSettingsToast('백업에 실패했습니다.');
            }
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
                            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: importedData }));
                            showSettingsToast('복구가 완료되었습니다.');
                        }
                    } else {
                        showSettingsToast('올바르지 않은 데이터 형식입니다.');
                    }
                } catch(err) {
                    console.error(err);
                    showSettingsToast('복구 중 오류가 발생했습니다.');
                }
            };
            reader.readAsText(file);
        };
        
        document.getElementById('reset-all').onclick = () => {
            if(confirm('정말로 모든 데이터를 초기화하시겠습니까?\\n이 작업은 되돌릴 수 없습니다.')) DataStore.reset();
        };
    },

    // ===== 정산 관리 탭 =====
    renderSettlementMgr(container, data) {
        if(!data.settlement) {
            data.settlement = {
                data: [],
                settings: { totalFund: 0, manualSpent: null, manualRemain: null },
                categories: ["1. 법률 및 소송 지원","2. 유가족 긴급 지원","3. 진상 규명 활동","4. 캠페인 운영 및 홍보"]
            };
        }
        const s = data.settlement;

        const fmtInput = (v) => {
            const num = v.toString().replace(/[^0-9]/g, '');
            if(!num) return '';
            return new Intl.NumberFormat('ko-KR').format(num);
        };
        const parseNum = (v) => parseInt(v.toString().replace(/[^0-9]/g, '')) || 0;

        const toast = (msg) => {
            showToast(msg);
        };

        const catOptions = () => (s.categories || []).map(c => `<option value="${sanitize(c)}">${sanitize(c)}</option>`).join('');

        const renderList = () => {
            const listEl = document.getElementById('stl-admin-list');
            if(!listEl) return;
            const entries = (s.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
            if(entries.length === 0) {
                listEl.innerHTML = '<div class="py-10 text-center text-gray-400">등록된 내역이 없습니다.</div>';
                return;
            }
            listEl.innerHTML = entries.map(item => `
                <div class="p-3 bg-white border border-gray-200 rounded-xl flex justify-between items-center">
                    <div class="truncate mr-3">
                        <div class="text-[10px] text-gray-400 font-bold">${sanitize(item.date)} | ${sanitize(item.category)}</div>
                        <div class="font-bold text-gray-800 text-sm truncate">${sanitize(item.item)}</div>
                        <div class="text-blue-600 font-black text-xs">${fmtInput(item.amount)}원</div>
                    </div>
                    <div class="flex gap-1 shrink-0">
                        <button onclick="window._stlEdit('${item.id}')" class="p-2 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                        <button onclick="window._stlDel('${item.id}')" class="p-2 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            `).join('');
            if(window.lucide) lucide.createIcons();
        };

        const renderCats = () => {
            const catList = document.getElementById('stl-cat-list');
            if(!catList) return;
            catList.innerHTML = (s.categories || []).map((cat, i) => `
                <div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
                    <input type="text" value="${sanitize(cat)}" onchange="window._stlUpdateCat(${i}, this.value)" class="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0 outline-none">
                    <button onclick="window._stlDelCat(${i})" class="text-red-400 hover:text-red-600 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
            `).join('');
            // update category select in form
            const sel = document.getElementById('stl-form-category');
            if(sel) sel.innerHTML = catOptions();
            if(window.lucide) lucide.createIcons();
        };

        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="font-bold text-lg mb-2">후원 정산 관리</h3>
                <p class="text-sm text-gray-500 mb-6">자료관리에서 타입을 <strong>SETTLEMENT</strong>로 설정한 항목을 클릭하면 이 데이터가 정산 보고 UI로 표시됩니다.</p>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- 카테고리 & 기금 설정 -->
                    <div class="lg:col-span-3 space-y-6">
                        <div>
                            <h4 class="text-xs font-black text-blue-600 uppercase mb-3 flex items-center gap-2"><i data-lucide="layers" class="w-4 h-4"></i> 카테고리</h4>
                            <div id="stl-cat-list" class="space-y-2 mb-3"></div>
                            <button id="stl-add-cat" class="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">+ 카테고리 추가</button>
                        </div>
                        <div>
                            <h4 class="text-xs font-black text-blue-600 uppercase mb-3 flex items-center gap-2"><i data-lucide="settings" class="w-4 h-4"></i> 기금 기본 정보</h4>
                            <div class="space-y-2">
                                <input type="text" id="stl-fund-total" placeholder="총 후원액" class="w-full p-2.5 bg-gray-50 border rounded-xl text-sm font-bold">
                                <input type="text" id="stl-fund-spent" placeholder="누적 집행액 (자동합산 시 공란)" class="w-full p-2.5 bg-gray-50 border rounded-xl text-sm font-bold">
                                <input type="text" id="stl-fund-remain" placeholder="잔여 기금 (자동계산 시 공란)" class="w-full p-2.5 bg-gray-50 border rounded-xl text-sm font-bold">
                                <button id="stl-save-fund" class="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">기금 정보 저장</button>
                            </div>
                        </div>
                    </div>

                    <!-- 내역 등록 폼 -->
                    <div class="lg:col-span-4 space-y-4">
                        <h4 class="text-xs font-black text-blue-600 uppercase mb-1 flex items-center gap-2"><i data-lucide="plus-circle" class="w-4 h-4"></i> 지출 내역 등록/수정</h4>
                        <input type="hidden" id="stl-edit-id">
                        <input type="date" id="stl-form-date" required class="w-full p-2.5 bg-gray-50 border rounded-xl text-sm">
                        <select id="stl-form-category" class="w-full p-2.5 bg-gray-50 border rounded-xl text-sm font-bold">${catOptions()}</select>
                        <input type="text" id="stl-form-item" placeholder="항목명" required class="w-full p-2.5 bg-gray-50 border rounded-xl text-sm">
                        <input type="text" id="stl-form-amount" placeholder="금액 (원)" required class="w-full p-2.5 bg-gray-50 border rounded-xl text-sm font-bold">
                        <input type="text" id="stl-form-recipient" placeholder="수취인" required class="w-full p-2.5 bg-gray-50 border rounded-xl text-sm">
                        <div class="p-3 border-2 border-dashed rounded-xl text-center relative">
                            <input type="file" id="stl-form-images" multiple accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer">
                            <i data-lucide="image" class="w-5 h-5 mx-auto mb-1 text-gray-400"></i>
                            <p id="stl-file-status" class="text-[10px] text-gray-400">이미지 업로드 (2MB 이하)</p>
                            <div id="stl-img-edit-hint" class="hidden text-[9px] text-blue-500 font-bold mt-1">※ 미선택 시 기존 이미지 유지</div>
                        </div>
                        <div class="flex gap-2">
                            <button id="stl-form-reset" class="flex-1 py-2.5 bg-gray-100 rounded-xl font-bold text-sm">취소</button>
                            <button id="stl-form-save" class="flex-[2] py-2.5 bg-[#0f172a] text-white rounded-xl font-bold text-sm">내역 저장</button>
                        </div>
                    </div>

                    <!-- 등록된 내역 목록 -->
                    <div class="lg:col-span-5 bg-gray-50/50 rounded-xl p-4">
                        <h4 class="text-xs font-black text-gray-400 uppercase mb-3">현재 등록된 내역</h4>
                        <div id="stl-admin-list" class="space-y-2 max-h-[500px] overflow-y-auto"></div>
                    </div>
                </div>
            </div>
        `;

        // 기금 정보 로드
        const fundSettings = s.settings || {};
        document.getElementById('stl-fund-total').value = fundSettings.totalFund ? fmtInput(fundSettings.totalFund) : '';
        document.getElementById('stl-fund-spent').value = fundSettings.manualSpent != null ? fmtInput(fundSettings.manualSpent) : '';
        document.getElementById('stl-fund-remain').value = fundSettings.manualRemain != null ? fmtInput(fundSettings.manualRemain) : '';

        // 숫자 포맷
        ['stl-fund-total','stl-fund-spent','stl-fund-remain','stl-form-amount'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', (e) => { e.target.value = fmtInput(e.target.value); });
        });

        // 기금 저장
        document.getElementById('stl-save-fund').onclick = () => {
            s.settings = {
                totalFund: parseNum(document.getElementById('stl-fund-total').value),
                manualSpent: document.getElementById('stl-fund-spent').value === '' ? null : parseNum(document.getElementById('stl-fund-spent').value),
                manualRemain: document.getElementById('stl-fund-remain').value === '' ? null : parseNum(document.getElementById('stl-fund-remain').value)
            };
            data.settlement = s;
            DataStore.save(data);
            toast('기금 정보가 저장되었습니다.');
        };

        // 카테고리 관리
        window._stlUpdateCat = (i, val) => {
            s.categories[i] = val;
            data.settlement = s;
            DataStore.save(data);
            renderCats();
        };
        window._stlDelCat = (i) => {
            if(confirm('카테고리를 삭제하시겠습니까?')) {
                s.categories.splice(i, 1);
                data.settlement = s;
                DataStore.save(data);
                renderCats();
            }
        };
        document.getElementById('stl-add-cat').onclick = () => {
            s.categories.push(`신규 카테고리 ${s.categories.length + 1}`);
            data.settlement = s;
            DataStore.save(data);
            renderCats();
        };

        // 파일 -> base64
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        // 내역 저장
        document.getElementById('stl-form-save').onclick = async () => {
            const date = document.getElementById('stl-form-date').value;
            const category = document.getElementById('stl-form-category').value;
            const item = document.getElementById('stl-form-item').value;
            const amount = parseNum(document.getElementById('stl-form-amount').value);
            const recipient = document.getElementById('stl-form-recipient').value;
            const editId = document.getElementById('stl-edit-id').value;

            if(!date || !item || !amount) {
                toast('날짜, 항목명, 금액은 필수입니다.');
                return;
            }

            const fileInput = document.getElementById('stl-form-images');
            let proofs = [];
            if(fileInput.files.length > 0) {
                for(let f of fileInput.files) {
                    if(f.size > 2 * 1024 * 1024) { toast(`${f.name}: 2MB 초과`); return; }
                    proofs.push(await toBase64(f));
                }
            } else if(editId) {
                const existing = (s.data || []).find(e => e.id === editId);
                if(existing) proofs = existing.proofs || [];
            }

            const entry = { id: editId || Date.now().toString(), date, category, item, amount, recipient, proofs };

            if(editId) {
                s.data = (s.data || []).map(e => e.id === editId ? entry : e);
            } else {
                if(!s.data) s.data = [];
                s.data.push(entry);
            }

            data.settlement = s;
            DataStore.save(data);

            // 폼 리셋
            document.getElementById('stl-edit-id').value = '';
            document.getElementById('stl-form-date').value = '';
            document.getElementById('stl-form-item').value = '';
            document.getElementById('stl-form-amount').value = '';
            document.getElementById('stl-form-recipient').value = '';
            fileInput.value = '';
            document.getElementById('stl-file-status').textContent = '이미지 업로드 (2MB 이하)';
            document.getElementById('stl-img-edit-hint').classList.add('hidden');

            renderList();
            toast('내역이 저장되었습니다.');
        };

        // 폼 리셋
        document.getElementById('stl-form-reset').onclick = () => {
            document.getElementById('stl-edit-id').value = '';
            document.getElementById('stl-form-date').value = '';
            document.getElementById('stl-form-item').value = '';
            document.getElementById('stl-form-amount').value = '';
            document.getElementById('stl-form-recipient').value = '';
            document.getElementById('stl-form-images').value = '';
            document.getElementById('stl-file-status').textContent = '이미지 업로드 (2MB 이하)';
            document.getElementById('stl-img-edit-hint').classList.add('hidden');
        };

        // 수정
        window._stlEdit = (id) => {
            const item = (s.data || []).find(e => e.id === id);
            if(!item) return;
            document.getElementById('stl-edit-id').value = item.id;
            document.getElementById('stl-form-date').value = item.date;
            document.getElementById('stl-form-category').value = item.category;
            document.getElementById('stl-form-item').value = item.item;
            document.getElementById('stl-form-amount').value = fmtInput(item.amount);
            document.getElementById('stl-form-recipient').value = item.recipient;
            document.getElementById('stl-img-edit-hint').classList.remove('hidden');
        };

        // 삭제
        window._stlDel = (id) => {
            if(confirm('내역을 삭제하시겠습니까?')) {
                s.data = (s.data || []).filter(e => e.id !== id);
                data.settlement = s;
                DataStore.save(data);
                renderList();
            }
        };

        // 파일 선택 표시
        document.getElementById('stl-form-images').addEventListener('change', (e) => {
            const count = e.target.files.length;
            document.getElementById('stl-file-status').textContent = count > 0 ? `${count}개 파일 선택됨` : '이미지 업로드 (2MB 이하)';
        });

        renderCats();
        renderList();
    }
};
