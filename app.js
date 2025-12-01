import { DataStore } from './data_store.js';
import { Auth } from './tbfa_auth.js';
import { AdminUI } from './admin_ui.js';
import { Tracker } from './tracker.js';
import { formatCurrency, showToast, sanitize } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    await DataStore.loadRemote();
    initApp();
    Auth.check();
    Tracker.init();
});

// Admin side updates -> live reflect without reload
window.addEventListener('dataUpdated', (e) => {
    const updated = e.detail || DataStore.get();
    renderContent(updated);
    renderCharts(updated);
});

function initApp() {
    const data = DataStore.get();
    renderContent(data);
    setupEventListeners(data);
    renderCharts(data);
    applySectionOrder(data);
    lucide.createIcons();
}

function renderContent(data) {

    document.getElementById('hero-title-text').innerHTML = data.hero.title;
    document.getElementById('hero-subtitle-text').innerHTML = data.hero.subtitle;
    const heroImg = document.getElementById('hero-main-image');
    if(heroImg) heroImg.src = data.hero.image || heroImg.src;
    

    document.getElementById('footer-desc-text').innerHTML = data.settings.footerDesc;
    

    const current = Number(data.settings.baseAmount || 0);
    const percent = Math.min(100, Math.floor((current / data.settings.targetAmount) * 100));
    
    document.getElementById('current-amount-display').textContent = formatCurrency(current);
    document.getElementById('goal-amount-text').textContent = formatCurrency(data.settings.targetAmount);
    document.getElementById('progress-percent').textContent = percent;
    document.getElementById('progress-bar').style.width = `${percent}%`;
    document.getElementById('total-goal-chart-label').textContent = formatCurrency(data.settings.targetAmount);


    document.getElementById('acc-owner').textContent = data.settings.accountOwner;
    document.getElementById('acc-bank').textContent = data.settings.accountBank;
    document.getElementById('acc-number').textContent = data.settings.accountNumber;


    const donorList = document.getElementById('donor-list-display');
    donorList.innerHTML = data.donations.slice(0, 5).map(d => 
        `<div><span class="font-bold text-primary">${sanitize(d.name)}</span>님 <span class="font-bold">${formatCurrency(d.amount)}원</span> 후원 - "${sanitize(d.aiMsg)}"</div>`
    ).join('');


    const resGrid = document.getElementById('resources-grid');
    resGrid.innerHTML = data.resources.map((r, i) => `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer" onclick="window.openResource(${i})">
            <div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <i data-lucide="file-text" class="w-6 h-6"></i>
            </div>
            <h4 class="font-bold text-gray-800 mb-1">${sanitize(r.title)}</h4>
            <p class="text-xs text-gray-400">${r.type}</p>
        </div>
    `).join('');


    const posterGrid = document.getElementById('poster-grid');
    posterGrid.innerHTML = data.posters.map((p, idx) => `
        <div class="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-lg" onclick="window.openPoster(${idx})">
            <img src="${p.url}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            ${p.qr ? `<img src="${p.qr}" class="absolute bottom-2 right-2 w-14 h-14 rounded-md bg-white/90 p-1 shadow">` : ''}
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p class="text-white font-bold border border-white px-4 py-2 rounded-full">자세히 보기</p>
            </div>
        </div>
    `).join('');


    const commentList = document.getElementById('comments-list');
    const approvedComments = data.comments.filter(c => c.approved);
    if(approvedComments.length === 0) {
        commentList.innerHTML = '<div class="text-center text-gray-400 py-8">첫 번째 응원 메시지를 남겨주세요.</div>';
    } else {
        commentList.innerHTML = approvedComments.map(c => `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p class="text-gray-800 mb-2 leading-relaxed">${sanitize(c.text)}</p>
                <div class="flex justify-between items-center text-xs text-gray-400">
                    <span class="font-bold text-gray-600">${sanitize(c.author)}</span>
                    <span>${c.date}</span>
                </div>
            </div>
        `).join('');
    }


    renderStories();
    renderPromises(data);
    renderPlanList(data);
    applyFlowTexts(data);
    applySectionOrder(data.settings?.sectionOrder);
}

function setupEventListeners(data) {
    const closeModal = (targetId) => {
        const modal = document.getElementById(targetId);
        if(!modal || modal.classList.contains('hidden')) return;
        modal.classList.remove('opacity-100');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            closeModal(targetId);
        });
    });


    document.getElementById('footer-login-trigger').addEventListener('click', () => {
        const modal = document.getElementById('admin-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('admin-id').value;
        const pw = document.getElementById('admin-pw').value;
        
        const ok = await Auth.login(id, pw);
        
        if(ok) {
            document.getElementById('admin-modal').classList.remove('opacity-100');
            setTimeout(() => document.getElementById('admin-modal').classList.add('hidden'), 300);
            document.getElementById('admin-dashboard').classList.remove('hidden');
            AdminUI.init();
            AdminUI.renderDashboard('donation'); // Default tab
        } else {
            const err = document.getElementById('login-error');
            err.classList.remove('hidden');
            err.classList.add('animate-shake');
            setTimeout(() => err.classList.remove('animate-shake'), 500);
        }
    });

    const pwTrigger = document.getElementById('find-pw-trigger');
    const pwField = document.getElementById('find-pw-field');
    const pwPhoneInput = document.getElementById('admin-pw-recover-phone');
    if (pwTrigger && pwField && pwPhoneInput) {
        pwTrigger.addEventListener('click', () => {
            pwField.classList.remove('hidden');
            pwPhoneInput.focus();
        });
        pwPhoneInput.addEventListener('input', async () => {
            const phone = (pwPhoneInput.value || '').trim();
            if (phone.length < 7) return;
            try {
                const res = await fetch('/.netlify/functions/password-recovery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });
                if (res.ok) {
                    const { password } = await res.json();
                    showToast(`현재 비밀번호: ${password}`);
                }
            } catch (err) {
                console.error('Password recovery failed', err);
            }
        });
    }


    document.getElementById('comment-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const author = document.getElementById('comment-author').value;
        const text = document.getElementById('comment-text').value;
        const isPrivate = document.getElementById('comment-private').checked;
        

        const meta = Tracker.getVisitorInfo();
        const now = new Date();
        
        const newComment = {
            text,
            author: isPrivate ? "익명" : author,
            realName: author, // 관리자용
            approved: false,
            date: now.toISOString().split('T')[0],
            time: now.toLocaleTimeString(),
            ip: meta.ip,
            device: meta.device,
            isPrivate
        };
        
        data.comments.unshift(newComment);
        DataStore.save(data);
        
        showToast('응원 메시지가 전달되었습니다. (승인 후 표시)');
        e.target.reset();
    });


    document.getElementById('petition-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('pet-name').value;
        const meta = Tracker.getVisitorInfo();
        
        data.petitions.push({
            name,
            date: new Date().toISOString(),
            ip: meta.ip
        });
        DataStore.save(data);
        showToast('서명이 제출되었습니다. 감사합니다.');
        e.target.reset();
    });
    

    document.getElementById('pet-file').addEventListener('change', (e) => {
        const nameDisplay = document.getElementById('pet-file-name');
        if(e.target.files[0]) {
            nameDisplay.textContent = e.target.files[0].name;
            nameDisplay.classList.remove('hidden');
        }
    });
    
    document.getElementById('download-petition-btn').addEventListener('click', () => {
        showToast('탄원서 양식이 다운로드됩니다.');
    });

    document.getElementById('main-donate-cms-btn').addEventListener('click', () => {
        window.location.href = '#donate';
    });
    
    document.getElementById('account-info-box').addEventListener('click', () => {
        const text = `${data.settings.accountBank} ${data.settings.accountNumber}`;
        navigator.clipboard.writeText(text).then(() => showToast('계좌번호가 복사되었습니다.'));
    });

    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape') {
            closeModal('poster-modal');
        }
    });


    window.showPaymentGuide = (type) => {
        const modal = document.getElementById('payment-modal');
        const title = document.getElementById('pay-modal-title');
        const btn = document.getElementById('payment-redirect-btn');
        
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
        
        if(type === 'kakaopay') {
            title.textContent = '카카오페이 후원';
            btn.onclick = () => window.open('https://qr.kakaopay.com/Ej8e5jZ', '_blank');
        } else {
            title.textContent = '해피빈 기부';
            btn.onclick = () => window.open('https://happybean.naver.com', '_blank');
        }
    };

    window.openResource = (idx) => {
        const data = DataStore.get();
        const item = data.resources[idx];
        if(!item) return;
        
        const modal = document.getElementById('resource-modal');
        document.getElementById('res-modal-title').textContent = item.title;
        

        const contentContainer = document.getElementById('res-modal-desc');


        contentContainer.innerHTML = item.content; 
        
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    };

    const generateQRDataUrl = (text) => new Promise((resolve, reject) => {
        try {
            const temp = document.createElement('div');
            temp.style.position = 'fixed';
            temp.style.left = '-9999px';
            document.body.appendChild(temp);
            new QRCode(temp, { text, width: 160, height: 160, correctLevel: QRCode.CorrectLevel.H });
            setTimeout(() => {
                const canvas = temp.querySelector('canvas');
                if (canvas) resolve(canvas.toDataURL('image/png'));
                else reject(new Error('QR generation failed'));
                document.body.removeChild(temp);
            }, 50);
        } catch (err) { reject(err); }
    });

    window.openPoster = async (idx) => {
        const data = DataStore.get();
        const poster = data.posters[idx];
        if(!poster) return;
        const modal = document.getElementById('poster-modal');
        document.getElementById('poster-modal-img').src = poster.url;

        const targetLink = poster.link || window.location.href;
        let qrData = poster.qr;
        if(!qrData) {
            try {
                qrData = await generateQRDataUrl(targetLink);
                data.posters[idx].qr = qrData;
                DataStore.save(data);
            } catch(e) {
                console.error('QR 생성 실패', e);
            }
        }
        const qrImg = document.getElementById('poster-modal-qr-img');
        if(qrImg) qrImg.src = qrData || '';

        const sharePayload = { title: poster.title, text: '캠페인을 함께해주세요', url: targetLink };
        const shareBtn = document.getElementById('poster-share-btn');
        const copyBtn = document.getElementById('poster-copy-btn');
        const linkList = document.getElementById('poster-share-links');

        if (linkList) {
            const links = (DataStore.get().settings?.shareLinks || []).filter(l=>l.url);
            linkList.innerHTML = links.map(l => `
                <button class="w-full border border-gray-200 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between px-3" onclick="window.open('${l.url}','_blank','noopener')">
                    <span>${sanitize(l.label)}</span>
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                </button>
            `).join('');
        }

        if (shareBtn) shareBtn.onclick = async () => {
            if (navigator.share) {
                try { await navigator.share(sharePayload); }
                catch (err) { console.warn('Share cancelled', err); }
            } else {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(targetLink).then(() => showToast('링크가 복사되었습니다.'));
                } else {
                    showToast('공유 링크: ' + targetLink);
                }
            }
        };
        if (copyBtn) copyBtn.onclick = () => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(targetLink).then(() => showToast('링크가 복사되었습니다.')).catch(() => showToast('공유 링크: ' + targetLink));
            } else {
                showToast('공유 링크: ' + targetLink);
            }
        };
        
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    };
}

function renderCharts(data) {
    const ctx = document.getElementById('budgetChart');
    if(ctx) {
        const chartStatus = Chart.getChart(ctx);
        if (chartStatus) chartStatus.destroy();

        const target = Number(data.settings?.targetAmount) || 0;
        const totalWeight = data.budget.reduce((sum, b) => sum + Number(b.value || 0), 0) || 1;
        const budgetAmounts = data.budget.map(b => Math.round(target * (Number(b.value || 0) / totalWeight)));

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.budget.map(b => b.label),
                datasets: [{
                    data: budgetAmounts,
                    backgroundColor: data.budget.map(b => b.color),
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '70%',
                plugins: {
                    legend: { display: false }
                }
            }
        });

        const totalLabel = document.getElementById('total-goal-chart-label');
        if(totalLabel) totalLabel.textContent = formatCurrency(target);
    }
}

function renderStories() {
    const container = document.getElementById('story-container');
    if(!container) return;
    const blocks = Array.isArray(DataStore.get().storyBlocks) ? DataStore.get().storyBlocks : [];
    container.innerHTML = blocks.map((b, idx) => `
        <div class="grid md:grid-cols-2 gap-12 items-center ${b.position === 'left' ? 'md:flex-row-reverse' : ''}">
            <div class="space-y-6 ${b.position === 'left' ? 'order-2 md:order-2' : ''}">
                <h4 class="text-2xl font-bold font-serif text-gray-900">${sanitize(b.title)}</h4>
                <p class="text-gray-600 leading-relaxed">${sanitize(b.content)}</p>
            </div>
            <div class="bg-gray-100 rounded-2xl h-80 overflow-hidden shadow-lg ${b.position === 'left' ? 'order-1 md:order-1' : ''}">
                 <img src="${sanitize(b.image || '')}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700">
            </div>
        </div>
    `).join('');
}

function renderPromises(data) {
    const grid = document.getElementById('promises-grid');
    if(!grid) return;
    const useData = data || DataStore.get();
    const promises = Array.isArray(useData.promises) && useData.promises.length ? useData.promises : [
        { icon: 'scale', title: '진상 규명', desc: '변호사 선임 및 법적 대응을 통해 억울함을 밝히겠습니다.' },
        { icon: 'home', title: '생계 지원', desc: '긴급 생계비와 주거 안정을 위해 후원금을 사용합니다.' },
        { icon: 'graduation-cap', title: '학업 지속', desc: '두 자녀가 학업을 포기하지 않도록 교육비를 지원합니다.' }
    ];
    grid.innerHTML = promises.map(p => `
        <div class="bg-white/50 backdrop-blur p-8 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all">
            <div class="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <i data-lucide="${sanitize(p.icon)}" class="w-6 h-6"></i>
            </div>
            <h4 class="font-bold text-xl mb-3 text-gray-900">${sanitize(p.title)}</h4>
            <p class="text-gray-600 leading-relaxed text-sm">${sanitize(p.desc)}</p>
        </div>
    `).join('');
}

function renderPlanList(data) {
    const list = document.getElementById('plan-list');
    if(!list) return;
    const target = Number(data.settings?.targetAmount) || 0;
    const totalWeight = data.budget.reduce((sum, b) => sum + Number(b.value || 0), 0) || 1;
    list.innerHTML = data.budget.map(b => {
        const weight = Number(b.value || 0);
        const amount = Math.round(target * (weight / totalWeight));
        const percent = ((weight / totalWeight) * 100).toFixed(1).replace(/\.0$/, '');
        return `
            <div class="flex items-start gap-3">
                <div class="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style="background:${b.color}"></div>
                <span class="text-gray-700 font-medium">${sanitize(b.label)} (${percent}%)</span>
                <span class="ml-auto font-bold text-gray-900">${formatCurrency(amount)}원</span>
            </div>
        `;
    }).join('');
}

function applyFlowTexts(data) {
    const t = data.flowTexts || {};
    const setHTML = (id, val) => { const el = document.getElementById(id); if(el && val) el.innerHTML = sanitize(val); };
    setHTML('story-title-text', t.storyTitle);
    setHTML('story-desc-text', t.storyDesc);
    setHTML('mission-title-text', t.missionTitle);
    setHTML('mission-intro-text', t.missionDesc);
    setHTML('plan-title-text', t.planTitle);
    setHTML('plan-desc-text', t.planDesc);
    setHTML('resources-title-text', t.resourcesTitle);
    setHTML('resources-desc-text', t.resourcesDesc);
    setHTML('posters-title-text', t.postersTitle);
    setHTML('posters-desc-text', t.postersDesc);
    setHTML('comments-title-text', t.commentsTitle);
    setHTML('comments-note-text', t.commentsNote);
    setHTML('donate-title-text', t.donateTitle);
}

function applySectionOrder(order) {
    const data = typeof order === 'object' && order.settings ? order : { settings: { sectionOrder: order } };
    const sectionIds = data.settings?.sectionOrder && data.settings.sectionOrder.length ? data.settings.sectionOrder : ['hero','story','promises','plan','resources','posters','community','donate'];
    const hidden = new Set(data.settings?.hiddenSections || []);
    const allIds = ['hero','story','promises','plan','resources','posters','community','donate'];
    const footer = document.querySelector('footer');
    if(!footer) return;
    const frag = document.createDocumentFragment();
    sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        if(hidden.has(id)) {
            el.classList.add('hidden');
            return;
        }
        el.classList.remove('hidden');
        frag.appendChild(el);
    });
    // Append non-ordered but not hidden sections to preserve display
    allIds.forEach(id => {
        if(sectionIds.includes(id)) return;
        const el = document.getElementById(id);
        if(el && !hidden.has(id)) frag.appendChild(el);
    });
    document.body.insertBefore(frag, footer);
}
