/**
 * admin.js
 * 관리자 기능: 로그인(tbfa/tbfa1), 콘텐츠 편집, 예약 배포, QR 생성, 통계 대시보드
 */
import { store } from './data_store.js';

let appData = store.getData();
const adminPanel = document.getElementById('admin-panel');
const adminContent = document.getElementById('admin-content');
let currentChart = null;

document.addEventListener('DOMContentLoaded', () => {
    setupAuth();

    if (sessionStorage.getItem('tbfa_admin_session') === 'true') {
        enterAdminMode(true);
    }
});

function setupAuth() {
    const form = document.getElementById('login-form');
    const findPwBtn = document.getElementById('find-pw-btn');
    const loginBtn = form.querySelector('button[type="submit"]');
    const loginText = document.getElementById('login-text');
    const loginSpinner = document.getElementById('login-spinner');




    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('admin-id');
        const pwInput = document.getElementById('admin-pw');
        
        const id = idInput.value.trim().toLowerCase();
        const pw = pwInput.value.trim();

        loginBtn.disabled = true;
        loginText.textContent = '인증 중...';
        loginSpinner.classList.remove('hidden');

        try {

            await new Promise(resolve => setTimeout(resolve, 800));


            const inputHash = await store.hashPassword(pw);
            

            const isHardcodedMatch = (id === 'tbfa' && pw === 'tbfa1');
            const isHashMatch = (id === 'tbfa' && inputHash === appData.meta.adminPwHash);

            if (isHardcodedMatch || isHashMatch) {
                document.getElementById('login-modal').close();
                enterAdminMode();
                idInput.value = '';
                pwInput.value = '';
            } else {
                alert('인증 정보가 올바르지 않습니다.\nID와 비밀번호를 확인해주세요.');
            }
        } catch (err) {
            console.error(err);
            alert('시스템 오류가 발생했습니다.');
        } finally {
            loginBtn.disabled = false;
            loginText.textContent = '로그인';
            loginSpinner.classList.add('hidden');
        }
    });

    findPwBtn.addEventListener('click', () => {
        const phone = prompt('등록된 관리자 휴대폰 번호를 입력하세요 (-없이 숫자만)');
        if (!phone) return;
        
        const cleanPhone = phone.replace(/-/g, '').trim();
        const storedPhone = appData.meta.adminPhone.replace(/-/g, '').trim();

        if (cleanPhone === "01028075242" || cleanPhone === storedPhone) {
            alert('초기 비밀번호는 [ tbfa1 ] 입니다.\n로그인 후 보안을 위해 비밀번호를 변경하시기 바랍니다.');
        } else {
            alert('등록된 정보와 일치하지 않습니다.');
        }
    });

    document.getElementById('admin-logout').addEventListener('click', () => {
        adminPanel.classList.add('hidden');
        document.body.style.overflow = 'auto';
        sessionStorage.removeItem('tbfa_admin_session');
        window.location.reload();
    });

    document.getElementById('admin-save-all').addEventListener('click', saveAllChanges);
}

function enterAdminMode(skipAlert = false) {
    sessionStorage.setItem('tbfa_admin_session', 'true');
    adminPanel.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    

    appData = store.getData();
    renderFlowDashboard();
    lucide.createIcons();
    
    if (!skipAlert) {

        const toast = document.getElementById('toast');
        const msg = document.getElementById('toast-message');
        msg.textContent = '관리자 모드에 접속했습니다.';
        toast.classList.remove('opacity-0');
        setTimeout(() => toast.classList.add('opacity-0'), 3000);
    }
}


function renderFlowDashboard() {
    adminContent.innerHTML = `
        <div class="space-y-6 animate-fade-in-up">
            <div class="bg-white p-6 rounded-xl shadow-sm border-l-4 border-brand-primary flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-1">관리자 대시보드</h2>
                    <p class="text-gray-600 text-sm">후원 캠페인의 모든 요소를 관리하고 실시간 현황을 모니터링하세요.</p>
                </div>
                <div class="text-right">
                    <span class="text-xs text-gray-500 block">현재 상태</span>
                    <span class="text-green-600 font-bold text-lg flex items-center gap-1">
                        <i data-lucide="activity" class="w-4 h-4"></i> 정상 운영 중
                    </span>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white p-4 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">누적 방문자</span>
                    <p class="text-3xl font-bold text-brand-dark mt-2" id="dash-total-visits">-</p>
                </div>
                <div class="bg-white p-4 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">오늘 방문자</span>
                    <p class="text-3xl font-bold text-blue-600 mt-2" id="dash-today-visits">-</p>
                </div>
                <div class="bg-white p-4 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">현재 모금액</span>
                    <p class="text-xl font-bold text-green-600 mt-2">${(appData.hero.currentAmount/10000).toLocaleString()}만원</p>
                </div>
                <div class="bg-white p-4 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">목표 달성률</span>
                    <p class="text-xl font-bold text-purple-600 mt-2">${Math.round(appData.hero.currentAmount/appData.hero.targetAmount*100)}%</p>
                </div>
            </div>

            <!-- Tools Grid -->
            <h3 class="font-bold text-gray-700 mt-4">빠른 작업 (Quick Actions)</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-brand-primary group transition-all" onclick="renderSection('hero')">
                    <div class="flex items-center gap-4 mb-3">
                        <div class="bg-orange-100 p-3 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <i data-lucide="layout-template"></i>
                        </div>
                        <h4 class="font-bold text-lg">메인/목차 편집</h4>
                    </div>
                    <p class="text-sm text-gray-500">헤더 제목, 부제, 후원 목표액 및 메뉴 구성을 수정합니다.</p>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-brand-primary group transition-all" onclick="renderSection('story')">
                    <div class="flex items-center gap-4 mb-3">
                        <div class="bg-red-100 p-3 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <i data-lucide="book-open"></i>
                        </div>
                        <h4 class="font-bold text-lg">스토리 관리</h4>
                    </div>
                    <p class="text-sm text-gray-500">Reality, Mission, Epilogue 등 핵심 이야기를 수정합니다.</p>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-brand-primary group transition-all" onclick="renderSection('tools')">
                    <div class="flex items-center gap-4 mb-3">
                        <div class="bg-purple-100 p-3 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <i data-lucide="calendar-clock"></i>
                        </div>
                        <h4 class="font-bold text-lg">예약 및 도구</h4>
                    </div>
                    <p class="text-sm text-gray-500">배포 예약, QR코드 생성, 관리자 비밀번호 등을 설정합니다.</p>
                </div>
            </div>
        </div>
    `;
    
    const stats = store.getAnalytics();
    document.getElementById('dash-total-visits').textContent = stats.total.toLocaleString();
    document.getElementById('dash-today-visits').textContent = stats.today.toLocaleString();
    lucide.createIcons();
}


window.renderSection = (section) => {

    document.querySelectorAll('#admin-sidebar a').forEach(el => el.classList.remove('bg-brand-dark', 'text-white'));
    const activeLink = document.querySelector(`a[data-target="${section}"]`);
    if(activeLink) activeLink.classList.add('bg-brand-dark', 'text-white');
    

    document.querySelectorAll('#admin-sidebar a:not(.bg-brand-dark)').forEach(el => el.classList.add('text-gray-600'));

    let html = '';
    switch(section) {
        case 'dashboard': renderFlowDashboard(); return;
        case 'stats': renderStatsUI(); return;
        case 'hero': html = renderHeroForm(); break;
        case 'story': html = renderStoryForm(); break;
        case 'docs': html = renderDocsForm(); break;
        case 'tools': html = renderToolsForm(); break;
    }
    
    adminContent.innerHTML = html;
    lucide.createIcons();


    if (section === 'tools') {
        document.getElementById('btn-gen-qr').addEventListener('click', generateAdminQR);
    }
};


function renderStatsUI(period = 'daily') {
    const data = store.getAnalytics(period);
    
    adminContent.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-md animate-fade-in-up">
            <div class="flex flex-col md:flex-row justify-between items-center border-b pb-4 mb-6 gap-4">
                <h3 class="text-xl font-bold text-brand-dark flex items-center gap-2">
                    <i data-lucide="bar-chart-2"></i> 방문자 통계 분석
                </h3>
                <div class="flex bg-gray-100 rounded-lg p-1">
                    <button onclick="renderStatsUI('daily')" class="px-4 py-1 rounded text-sm transition-all ${period==='daily'?'bg-white shadow text-brand-dark font-bold':'text-gray-500'}">일별</button>
                    <button onclick="renderStatsUI('monthly')" class="px-4 py-1 rounded text-sm transition-all ${period==='monthly'?'bg-white shadow text-brand-dark font-bold':'text-gray-500'}">월별</button>
                    <button onclick="renderStatsUI('yearly')" class="px-4 py-1 rounded text-sm transition-all ${period==='yearly'?'bg-white shadow text-brand-dark font-bold':'text-gray-500'}">연도별</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div class="lg:col-span-2 bg-white border rounded-xl p-4">
                    <h5 class="text-sm font-bold text-gray-600 mb-4">방문자 추이 (${period})</h5>
                    <div class="h-64 relative">
                        <canvas id="chart-trend"></canvas>
                    </div>
                </div>
                <div class="lg:col-span-1 flex flex-col gap-4">
                    <div class="bg-white border rounded-xl p-4 flex-1">
                        <h5 class="text-sm font-bold text-gray-600 mb-2">접속 기기 비율</h5>
                        <div class="h-40 relative"><canvas id="chart-device"></canvas></div>
                    </div>
                </div>
            </div>

            <div class="overflow-x-auto border rounded-xl">
                <table class="w-full text-sm text-left text-gray-500">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th class="px-6 py-3">날짜/기간</th>
                            <th class="px-6 py-3">방문수</th>
                            <th class="px-6 py-3">모바일</th>
                            <th class="px-6 py-3">검색유입</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.table.map(row => `
                            <tr class="bg-white border-b hover:bg-gray-50">
                                <td class="px-6 py-4 font-medium text-gray-900">${row.date}</td>
                                <td class="px-6 py-4 text-blue-600 font-bold">${row.visits}</td>
                                <td class="px-6 py-4">${row.mobile}</td>
                                <td class="px-6 py-4">${row.search}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mt-4 text-right">
                <button onclick="store.seedDemoData(); renderStatsUI('${period}')" class="text-xs text-gray-400 underline hover:text-gray-600">데이터 시뮬레이션(데모 생성)</button>
            </div>
        </div>
    `;
    lucide.createIcons();

    const ctx = document.getElementById('chart-trend');
    if(currentChart) currentChart.destroy();
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.chart.labels,
            datasets: [{
                label: '방문자 수',
                data: data.chart.data,
                borderColor: '#FF8A65',
                backgroundColor: 'rgba(255, 138, 101, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    new Chart(document.getElementById('chart-device'), {
        type: 'doughnut',
        data: {
            labels: ['모바일', 'PC'],
            datasets: [{
                data: [data.deviceRatio.mobile, data.deviceRatio.pc],
                backgroundColor: ['#4ADE80', '#60A5FA']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
    });
}

function renderHeroForm() {
    return `
        <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-lg font-bold border-b pb-2 mb-4 flex items-center gap-2"><i data-lucide="layout-template"></i> 메인 상단 및 구성</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">메인 타이틀</label>
                    <input type="text" id="edit-hero-title" value="${appData.hero.title}" class="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-primary outline-none">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">서브 타이틀 (부제)</label>
                    <textarea id="edit-hero-subtitle" class="w-full border border-gray-300 p-2 rounded h-24 resize-none focus:ring-2 focus:ring-brand-primary outline-none">${appData.hero.subtitle}</textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">목표 후원 금액 (원)</label>
                        <input type="number" id="edit-target-amount" value="${appData.hero.targetAmount}" class="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-primary outline-none">
                        <p class="text-xs text-gray-400 mt-1">* 변경 시 계획서 및 차트에 자동 반영됩니다.</p>
                    </div>
                    <div>
                         <label class="block text-sm font-bold text-gray-700 mb-1">현재 모금액 (원)</label>
                         <input type="number" disabled value="${appData.hero.currentAmount}" class="w-full border bg-gray-100 p-2 rounded text-gray-500">
                    </div>
                </div>
                
                <div class="pt-6 mt-6 border-t">
                    <h4 class="font-bold text-sm mb-4 text-gray-600">섹션 제목 (메뉴명) 수정</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <span class="text-xs text-gray-400 block">Story Section</span>
                            <input type="text" id="edit-title-story" value="${appData.sections.story}" class="w-full border p-2 rounded text-sm">
                        </div>
                        <div>
                            <span class="text-xs text-gray-400 block">Mission Section</span>
                            <input type="text" id="edit-title-mission" value="${appData.sections.mission}" class="w-full border p-2 rounded text-sm">
                        </div>
                        <div>
                            <span class="text-xs text-gray-400 block">Posters Section</span>
                            <input type="text" id="edit-title-posters" value="${appData.sections.posters}" class="w-full border p-2 rounded text-sm">
                        </div>
                        <div>
                            <span class="text-xs text-gray-400 block">Plan Section</span>
                            <input type="text" id="edit-title-plan" value="${appData.sections.plan}" class="w-full border p-2 rounded text-sm">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderStoryForm() {
    return `
        <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-lg font-bold border-b pb-2 mb-4 flex items-center gap-2"><i data-lucide="book-open"></i> 스토리텔링 관리</h3>
            <p class="text-sm text-gray-500 mb-6">리얼리티(Reality) 섹션을 중심으로 가족들의 구체적인 상황을 묘사하여 공감을 이끌어냅니다.</p>
            
            <div id="edit-story-list" class="space-y-8">
                ${appData.story.map((item, idx) => `
                    <div class="border border-gray-200 p-4 rounded-xl bg-gray-50 hover:border-brand-primary transition-colors">
                        <div class="flex gap-2 mb-2 items-center">
                            <span class="bg-brand-dark text-white text-xs px-2 py-1 rounded font-bold">STEP ${idx + 1}</span>
                            <input type="text" class="edit-story-step border px-2 py-1 rounded w-32 text-xs font-bold uppercase" value="${item.step}" placeholder="STEP NAME">
                        </div>
                        <input type="text" class="edit-story-title w-full border p-2 rounded text-sm font-bold mb-2" value="${item.title}" placeholder="제목을 입력하세요">
                        <textarea class="edit-story-content w-full border p-2 rounded h-40 text-sm resize-none leading-relaxed" placeholder="본문 내용을 입력하세요">${item.content}</textarea>
                        <input type="hidden" class="edit-story-id" value="${item.id}">
                        <div class="mt-2 text-right">
                             <span class="text-xs text-gray-400">이미지: ${item.image ? '설정됨' : '없음'} (자동 할당)</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderDocsForm() {
    return `
        <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-lg font-bold border-b pb-2 mb-4 flex items-center gap-2"><i data-lucide="file-text"></i> 상세 계획서 및 예산</h3>
            <div class="space-y-6">
                <div>
                    <div class="flex justify-between mb-1">
                        <label class="block text-sm font-bold text-gray-700">상세 후원 계획서 (Markdown)</label>
                        <span class="text-xs text-brand-primary bg-brand-bg px-2 rounded">자동변수: {{TARGET_AMOUNT}}</span>
                    </div>
                    <textarea id="edit-plan-doc" class="w-full border p-4 rounded h-80 font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none">${appData.docs.plan}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">예산 배분 계획 (Markdown)</label>
                    <textarea id="edit-budget-doc" class="w-full border p-4 rounded h-60 font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none">${appData.docs.budget}</textarea>
                </div>
            </div>
        </div>
    `;
}

function renderToolsForm() {
    return `
        <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-lg font-bold border-b pb-2 mb-4 flex items-center gap-2"><i data-lucide="settings"></i> 도구 및 설정</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- QR Code -->
                <div class="space-y-4">
                    <h4 class="font-bold text-sm text-gray-700">QR 코드 생성</h4>
                    <div class="bg-gray-50 p-4 rounded-xl border flex items-start gap-4">
                        <div id="admin-qr-preview" class="w-32 h-32 bg-white border flex items-center justify-center text-xs text-gray-400 rounded overflow-hidden shadow-sm">
                            No QR
                        </div>
                        <div class="flex-1 space-y-2">
                            <p class="text-xs text-gray-500 mb-2">현재 페이지 주소로 QR코드를 생성합니다. 인쇄물이나 포스터에 활용하세요.</p>
                            <button id="btn-gen-qr" class="w-full bg-brand-primary text-white text-sm py-2 rounded shadow-sm hover:bg-brand-dark transition-colors">QR 코드 생성</button>
                            <a id="btn-down-qr" href="#" download="tbfa_qr.png" class="hidden w-full bg-gray-700 text-white text-sm py-2 rounded text-center block hover:bg-gray-900">이미지 다운로드</a>
                        </div>
                    </div>
                </div>

                <!-- Config -->
                <div class="space-y-4">
                    <h4 class="font-bold text-sm text-gray-700">예약 배포 및 관리</h4>
                    <div class="bg-gray-50 p-4 rounded-xl border space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">배포 예정 일시 (예약)</label>
                            <input type="datetime-local" id="edit-publish-date" value="${appData.meta.publishDate || ''}" class="w-full border p-2 rounded text-sm">
                            <p class="text-xs text-gray-400 mt-1">설정 시, 해당 시간 전까지 일반 방문자에게는 "준비 중" 화면이 표시됩니다. (관리자는 접근 가능)</p>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">관리자 연락처 (비밀번호 찾기용)</label>
                            <input type="text" id="edit-admin-phone" value="${appData.meta.adminPhone}" class="w-full border p-2 rounded text-sm">
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-8 pt-4 border-t text-right">
                <button onclick="store.reset()" class="text-red-500 text-xs hover:underline font-bold">⚠ 데이터 전체 초기화 (복구 불가)</button>
            </div>
        </div>
    `;
}

function generateAdminQR() {
    const container = document.getElementById('admin-qr-preview');
    const downloadBtn = document.getElementById('btn-down-qr');

    const url = window.location.href.split('#')[0];
    
    container.innerHTML = '<div class="loader"></div>';
    

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(url)}`;
    
    const img = new Image();
    img.src = qrUrl;
    img.alt = "QR Code";
    img.className = "w-full h-full object-contain";
    img.crossOrigin = "Anonymous"; // Required for canvas export
    
    img.onload = () => {
        container.innerHTML = '';
        container.appendChild(img);
        

        fetch(qrUrl)
            .then(res => res.blob())
            .then(blob => {
                const objectURL = URL.createObjectURL(blob);
                downloadBtn.href = objectURL;
                downloadBtn.classList.remove('hidden');
            })
            .catch(() => {

                downloadBtn.href = qrUrl;
                downloadBtn.target = "_blank";
                downloadBtn.classList.remove('hidden');
            });
    };
}

function saveAllChanges() {
    try {
        let hasChanges = false;


        const heroTitle = document.getElementById('edit-hero-title');
        if (heroTitle) {
            appData.hero.title = heroTitle.value;
            appData.hero.subtitle = document.getElementById('edit-hero-subtitle').value;
            appData.hero.targetAmount = parseInt(document.getElementById('edit-target-amount').value);
            
            appData.sections.story = document.getElementById('edit-title-story').value;
            appData.sections.mission = document.getElementById('edit-title-mission').value;
            appData.sections.posters = document.getElementById('edit-title-posters').value;
            appData.sections.plan = document.getElementById('edit-title-plan').value;
            hasChanges = true;
        }


        const storyTitles = document.querySelectorAll('.edit-story-title');
        if (storyTitles.length > 0) {
             const contents = document.querySelectorAll('.edit-story-content');
             const steps = document.querySelectorAll('.edit-story-step');
             const ids = document.querySelectorAll('.edit-story-id');
             
             appData.story = Array.from(storyTitles).map((_, i) => ({
                 id: ids[i].value,
                 step: steps[i].value,
                 title: storyTitles[i].value,
                 content: contents[i].value,
                 image: appData.story[i].image // Preserve image
             }));
             hasChanges = true;
        }


        const planDoc = document.getElementById('edit-plan-doc');
        if (planDoc) {
            appData.docs.plan = planDoc.value;
            appData.docs.budget = document.getElementById('edit-budget-doc').value;
            hasChanges = true;
        }


        const pubDate = document.getElementById('edit-publish-date');
        if (pubDate) {
            appData.meta.publishDate = pubDate.value || null;
            appData.meta.adminPhone = document.getElementById('edit-admin-phone').value;
            hasChanges = true;
        }

        if(hasChanges) {
            store.saveData(appData);
            alert('모든 변경사항이 저장되었습니다.\n메인 화면이 업데이트됩니다.');
        } else {
            alert('변경된 내용이 없거나 저장할 수 없는 상태입니다.');
        }
    } catch (e) {
        console.error(e);
        alert('저장 중 오류가 발생했습니다.');
    }
}
