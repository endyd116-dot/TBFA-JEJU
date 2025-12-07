import { DataStore } from './data_store.js';
import { formatCurrency, showToast, sanitize, randomThanks } from './utils.js';

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
        else if(tab === 'posters') this.renderPosterMgr(container, data);
        else if(tab === 'resources') this.renderResourcesMgr(container, data);
        else if(tab === 'signResources') this.renderSignResourcesMgr(container, data);
        else container.innerHTML = '<p class="text-center text-gray-400 mt-10">기능 준비중</p>';
        
        if(window.lucide) lucide.createIcons();
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
                            <div class="text-xs text-gray-500">온라인 서명 입력값은 사용자 입력을 그대로 저장합니다.</div>
                            <div class="overflow-x-auto">
                                ${signatures.length === 0 ? `<div class="text-center text-gray-400 py-4 text-sm">아직 서명이 없습니다.</div>` : `
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
                                        ${signatures.map((s,i)=>({s,i})).reverse().map(({s,i}) => {
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
                                </table>`}
                            </div>
                        </div>
                    </div>

                    <div id="flow-panel-donate" class="bg-white p-6 rounded-xl shadow-sm space-y-3">
                        <div class="flex items-center gap-2 mb-2"><i data-lucide="gift" class="w-4 h-4 text-primary"></i><h4 class="font-bold">후원 섹션</h4></div>
                        <input id="flow-donate-title" value="${sanitize(data.flowTexts?.donateTitle || '')}" class="w-full border p-3 rounded text-lg" placeholder="후원 섹션 제목">
                        <div class="grid md:grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs text-gray-500">후원하기 버튼 이동 URL</label>
                                <input id="flow-donate-main-url" value="${sanitize(data.settings?.donateMainUrl || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...">
                            </div>
                            <div>
                                <label class="text-xs text-gray-500">카카오페이 URL</label>
                                <input id="flow-donate-kakao-url" value="${sanitize(data.settings?.donateKakaoUrl || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...">
                            </div>
                            <div>
                                <label class="text-xs text-gray-500">해피빈 URL</label>
                                <input id="flow-donate-happy-url" value="${sanitize(data.settings?.donateHappyUrl || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...">
                            </div>
                            <div class="md:col-span-2 grid md:grid-cols-2 gap-2 items-center">
                                <div>
                                    <label class="text-xs text-gray-500">후원 섹션 이미지 URL</label>
                                    <input id="flow-donate-image" value="${sanitize(data.settings?.donateImage || '')}" class="w-full border p-2 rounded text-sm" placeholder="https://...jpg">
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
                                <input id="flow-acc-owner" value="${sanitize(data.settings?.accountOwner || '')}" class="w-full border p-2 rounded text-sm">
                            </div>
                            <div>
                                <label class="text-xs text-gray-500">은행</label>
                                <input id="flow-acc-bank" value="${sanitize(data.settings?.accountBank || '')}" class="w-full border p-2 rounded text-sm">
                            </div>
                            <div>
                                <label class="text-xs text-gray-500">계좌번호</label>
                                <input id="flow-acc-number" value="${sanitize(data.settings?.accountNumber || '')}" class="w-full border p-2 rounded text-sm">
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
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h3 class="font-bold">댓글 관리</h3>
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
    }
};
