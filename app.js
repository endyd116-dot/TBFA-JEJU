import { DataStore } from './data_store.js';
import { Auth } from './tbfa_auth.js';
import { AdminUI } from './admin_ui.js';
import { Tracker } from './tracker.js';
import { formatCurrency, showToast, sanitize } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    Auth.check();
    Tracker.init();
});

function initApp() {
    const data = DataStore.get();
    renderContent(data);
    setupEventListeners(data);
    renderCharts(data);
    lucide.createIcons();
}

function renderContent(data) {

    document.getElementById('hero-title-text').innerHTML = data.hero.title;
    document.getElementById('hero-subtitle-text').innerHTML = data.hero.subtitle;
    

    document.getElementById('footer-desc-text').innerHTML = data.settings.footerDesc;
    

    const current = data.donations.reduce((sum, d) => sum + d.amount, data.settings.baseAmount);
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
    posterGrid.innerHTML = data.posters.map(p => `
        <div class="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-lg" onclick="window.openPoster('${p.url}', '${p.title}')">
            <img src="${p.url}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
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
    renderPromises();
    renderPlanList();
}

function setupEventListeners(data) {

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const modal = document.getElementById(targetId);
            modal.classList.remove('opacity-100');
            setTimeout(() => modal.classList.add('hidden'), 300);
        });
    });


    document.getElementById('footer-login-trigger').addEventListener('click', () => {
        const modal = document.getElementById('admin-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('admin-id').value;
        const pw = document.getElementById('admin-pw').value;
        
        if(Auth.login(id, pw)) {
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

    window.openPoster = (url, title) => {
        const modal = document.getElementById('poster-modal');
        document.getElementById('poster-modal-img').src = url;
        

        const qrContainer = document.getElementById('poster-modal-qr');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: window.location.href,
            width: 100,
            height: 100,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
        
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    };
}

function renderCharts(data) {
    const ctx = document.getElementById('budgetChart');
    if(ctx) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.budget.map(b => b.label),
                datasets: [{
                    data: data.budget.map(b => b.value),
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
    }
}

function renderStories() {
    const container = document.getElementById('story-container');

    container.innerHTML = `
        <!-- 1. 교사 일상 -->
        <div class="grid md:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
                <h4 class="text-2xl font-bold font-serif text-gray-900">1. 20년의 헌신, 그리고 멈춰버린 시간</h4>
                <p class="text-gray-600 leading-relaxed">
                    현승준 선생님은 제주대학교 사범대를 졸업하고 약 20년간 교단에 섰습니다. 
                    밤낮없이 학생들과 소통하고 학부모들과의 상담을 이어가던 열정적인 교육자였습니다.
                    <br><br>
                    "한 아이도 포기하지 않겠다"던 교육 철학으로 2025년 3학년 부장을 맡아
                    학교에 나오지 않는 제자들을 끝까지 바른 길로 인도하려 애썼습니다.
                    하지만 그토록 사랑했던 교정은 그가 마지막 숨을 거둔 장소가 되고 말았습니다.
                </p>
            </div>
            <div class="bg-gray-100 rounded-2xl h-80 overflow-hidden shadow-lg">
                 <img src="https://r2.flowith.net/files/jpeg/YRBIR-teacher_hyun_seung_jun_family_support_campaign_poster_index_1@1024x1024.jpeg" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700">
            </div>
        </div>

        <!-- 2. 사건 경과 -->
        <div class="relative border-l-2 border-gray-200 ml-4 md:ml-0 md:border-0">
             <div class="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
                <div class="order-1 md:order-2 space-y-6 pl-8 md:pl-0">
                    <h4 class="text-2xl font-bold font-serif text-gray-900">2. 멈추지 않았던 알림음과 놓쳐버린 골든타임</h4>
                    <p class="text-gray-600 leading-relaxed">
                        2025년 3월, 생활지도 과정에서 시작된 악성 민원은 밤낮을 가리지 않았습니다.
                        지속적인 인격 모독과 결정적인 악성 문자는 20년 베테랑 교사의 삶을 무너뜨렸습니다.
                    </p>
                    <div class="space-y-4 mt-4">
                        <div class="flex items-start gap-3">
                            <div class="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                            <div><span class="text-xs font-bold text-gray-400 block">2025.03 ~ 05.20</span><span class="text-sm">지속적인 악성 민원 및 인격 모독 발생</span></div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                            <div><span class="text-xs font-bold text-gray-400 block">2025.05.20 17:04</span><span class="text-sm">보호자로부터 결정적인 악성 문자 수신</span></div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                            <div><span class="text-xs font-bold text-gray-400 block">2025.05.22 00:46</span><span class="text-sm">학교 창고에서 숨진 채 발견 (골든타임 상실)</span></div>
                        </div>
                    </div>
                </div>
                <div class="order-2 md:order-1 hidden md:block bg-gray-50 rounded-2xl h-64 flex items-center justify-center text-gray-300">
                     <i data-lucide="clock" class="w-24 h-24 opacity-20"></i>
                </div>
            </div>
        </div>

        <!-- 3. 유가족 현재 -->
        <div class="grid md:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
                <h4 class="text-2xl font-bold font-serif text-gray-900">3. "아빠의 명예라도 지켜주세요"</h4>
                <p class="text-gray-600 leading-relaxed">
                    남겨진 아내와 어린 두 자녀의 시간은 5월 22일에 멈춰있습니다.
                    아이들은 엄마마저 사라질까 불안에 떨고 있으며, 
                    가장의 부재로 인해 가계 소득은 전무한 상태입니다.
                    <br><br>
                    사건 발생 5개월이 지났음에도 교육청의 지원은 없었습니다.
                    유가족은 경제적 빈곤과 트라우마라는 이중고 속에서
                    "가해자 없는 부실 조사"에 맞서 싸우고 있습니다.
                </p>
            </div>
            <div class="bg-gray-100 rounded-2xl h-80 overflow-hidden shadow-lg">
                 <img src="https://r2.flowith.net/files/jpeg/5QNVJ-korean_family_grief_scene_index_0@1024x1024.jpeg" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700 filter grayscale-[30%]">
            </div>
        </div>

        <!-- 4. 지원 필요성 -->
        <div class="bg-blue-50 rounded-[2.5rem] p-8 md:p-12 text-center space-y-6 border border-blue-100">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4 text-primary">
                <i data-lucide="shield-alert" class="w-8 h-8"></i>
            </div>
            <h4 class="text-2xl font-bold font-serif text-gray-900">4. 순직 인정과 남겨진 가족을 위하여</h4>
            <p class="text-gray-600 leading-relaxed max-w-2xl mx-auto">
                현승준 선생님의 죽음은 개인의 문제가 아닌 교육 시스템의 붕괴입니다.
                아직 '순직(공무상 재해)'은 공식적으로 인정되지 않았습니다.
                <br><br>
                선생님이 목숨으로 지키려 했던 교사의 소명감을 기억하며,
                남겨진 가족들이 경제적 고통 없이 치유에 전념할 수 있도록,
                그리고 그의 이름이 명예롭게 기록될 수 있도록 힘을 모아주세요.
            </p>
            <div class="pt-6">
                <a href="#donate" class="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-colors shadow-lg">유가족 지원하기</a>
            </div>
        </div>
    `;
}

function renderPromises() {
    const grid = document.getElementById('promises-grid');
    const promises = [
        { icon: 'scale', title: '진상 규명', desc: '변호사 선임 및 법적 대응을 통해 억울함을 밝히겠습니다.' },
        { icon: 'home', title: '생계 지원', desc: '긴급 생계비와 주거 안정을 위해 후원금을 사용합니다.' },
        { icon: 'graduation-cap', title: '학업 지속', desc: '두 자녀가 학업을 포기하지 않도록 교육비를 지원합니다.' }
    ];
    grid.innerHTML = promises.map(p => `
        <div class="bg-white/50 backdrop-blur p-8 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all">
            <div class="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <i data-lucide="${p.icon}" class="w-6 h-6"></i>
            </div>
            <h4 class="font-bold text-xl mb-3 text-gray-900">${p.title}</h4>
            <p class="text-gray-600 leading-relaxed text-sm">${p.desc}</p>
        </div>
    `).join('');
}

function renderPlanList() {
    const list = document.getElementById('plan-list');
    const items = [
        '법무법인 선임 착수금 및 성공보수 (3,000만원)',
        '유가족 긴급 생계비 1년치 (2,400만원)',
        '자녀 심리치료 및 학비 (1,000만원)',
        '진상규명위원회 운영 실비 (600만원)'
    ];
    list.innerHTML = items.map(item => `
        <div class="flex items-start gap-3">
            <div class="mt-1.5 w-1.5 h-1.5 bg-primary rounded-full shrink-0"></div>
            <span class="text-gray-700 font-medium">${item}</span>
        </div>
    `).join('');
}
