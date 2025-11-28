<!DOCTYPE html>
<html lang="ko" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>제주중학교 사건 유가족 후원 | 교사유가족 협의회</title>
    <meta name="description" content="제주중학교 사건 故 현승준 선생님의 명예 회복과 남겨진 유가족의 생계 및 치유를 위한 공식 후원 페이지입니다.">
    <meta property="og:title" content="제주중학교 사건 유가족을 지켜주세요">
    <meta property="og:image" content="https://images.unsplash.com/photo-1595208224363-982529b564c6?q=80&w=1024&auto=format&fit=crop">


    <!-- Fonts & CDNs -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>


    <!-- Tailwind Config -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: { DEFAULT: '#0099FF', dark: '#0077CC', light: '#E5F5FF' }, 
                        text: { main: '#1E293B', sub: '#475569' }
                    },
                    fontFamily: {
                        sans: ['"Noto Sans KR"', 'sans-serif'],
                        serif: ['"Nanum Myeongjo"', 'serif'], 
                    },
                    boxShadow: {
                        'soft': '0 10px 40px -10px rgba(0, 153, 255, 0.15)'
                    }
                }
            }
        }
    </script>


    <!-- Custom Styles -->
    <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-slide-up { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .admin-tab-btn.active { background-color: #f0f9ff; color: #0099FF; border-right: 3px solid #0099FF; }
    </style>
</head>
<body class="bg-white text-text-main font-sans antialiased selection:bg-primary selection:text-white overflow-x-hidden">


    <!-- Toast Notification -->
    <div class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
        <div id="toast-notification" class="bg-gray-800/95 backdrop-blur text-white px-6 py-3 rounded-full shadow-xl font-medium -translate-y-32 opacity-0 transition-all duration-500 flex items-center gap-3 min-w-[200px] justify-center">
            <i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i>
            <span id="toast-message">알림</span>
        </div>
    </div>


    <!-- Resource Modal -->
    <div id="resource-modal" class="fixed inset-0 z-[5000] hidden flex items-center justify-center px-4 opacity-0 transition-opacity duration-300">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeModal('resource-modal')"></div>
        <div class="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative z-10 transform scale-95 transition-all duration-300">
            <button onclick="closeModal('resource-modal')" class="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1"><i data-lucide="x" class="w-5 h-5"></i></button>
            <h3 class="text-2xl font-serif font-bold text-gray-900 mb-6 border-b pb-4" id="res-modal-title"></h3>
            <div class="prose prose-sm max-w-none max-h-[60vh] overflow-y-auto text-gray-700 whitespace-pre-line leading-relaxed" id="res-modal-desc"></div>
        </div>
    </div>


    <!-- Payment Modal -->
    <div id="payment-modal" class="fixed inset-0 z-[5000] hidden flex items-center justify-center px-4 opacity-0 transition-opacity duration-300">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeModal('payment-modal')"></div>
        <div class="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-300">
            <button onclick="closeModal('payment-modal')" class="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1"><i data-lucide="x" class="w-5 h-5"></i></button>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4"><i data-lucide="coins" class="w-8 h-8"></i></div>
                <h3 class="text-xl font-bold text-gray-900">후원 정보 입력</h3>
            </div>
            <div class="space-y-3 mb-4">
                <input type="text" id="donate-name" placeholder="후원자 성함" class="w-full border border-gray-200 p-3 rounded-xl outline-none text-sm">
                <input type="number" id="donate-amount" placeholder="후원 금액 (원)" class="w-full border border-gray-200 p-3 rounded-xl outline-none text-sm">
                <input type="text" id="donate-msg" placeholder="응원 메시지 (선택)" class="w-full border border-gray-200 p-3 rounded-xl outline-none text-sm">
            </div>
            <button id="payment-confirm-btn" class="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3.5 rounded-xl shadow-md transition-all">후원하기</button>
        </div>
    </div>


    <!-- Header -->
    <header class="fixed w-full top-0 z-40 py-4 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div class="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <a href="#" class="flex items-center gap-3 group" onclick="window.scrollTo(0,0); return false;">
                <div class="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/30"><i data-lucide="heart-handshake" class="w-5 h-5"></i></div>
                <div class="flex flex-col">
                    <span class="font-serif font-bold text-lg text-gray-900 leading-none">교사유가족협의회</span>
                </div>
            </a>
            <nav class="hidden md:flex gap-8 text-sm font-medium text-text-sub items-center">
                <a href="#story" class="hover:text-primary transition-colors">현실과 진실</a>
                <a href="#promises" class="hover:text-primary transition-colors">3가지 약속</a>
                <a href="#resources" class="hover:text-primary transition-colors">자료 패키지</a>
                <a href="#community" class="hover:text-primary transition-colors">탄원서 서명</a>
            </nav>
            <a href="#donate" class="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/20 text-sm flex items-center gap-2">
                <span>후원하기</span><i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>
        </div>
    </header>


    <!-- Hero -->
    <section class="pt-32 pb-20 px-6 min-h-[90vh] flex items-center relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-white">
        <div class="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
            <div class="order-2 lg:order-1 space-y-8 animate-slide-up">
                <div class="inline-flex items-center gap-2 bg-white border border-blue-100 text-primary px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                    <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span><span>제주중학교 사건 긴급 지원</span>
                </div>
                <h1 class="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight text-gray-900">
                    <span id="hero-title-text">로딩 중...</span>
                </h1>
                <div class="text-lg text-text-sub leading-relaxed max-w-xl font-light" id="hero-subtitle-text"></div>
                <div class="flex flex-wrap gap-4 pt-4">
                    <a href="#story" class="bg-white border-2 border-gray-200 text-gray-600 px-8 py-4 rounded-full font-bold hover:border-primary hover:text-primary transition-all">사연 보기</a>
                    <a href="#donate" class="bg-primary text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-blue-200 hover:bg-primary-dark transition-all">마음 보태기</a>
                </div>
            </div>
            <div class="order-1 lg:order-2 relative animate-slide-up">
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1024&auto=format&fit=crop" class="rounded-[2.5rem] shadow-2xl w-full object-cover aspect-square filter brightness-90 grayscale-[20%]">
                <div class="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl hidden md:block animate-float">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary"><i data-lucide="users" class="w-5 h-5"></i></div>
                        <div><p class="text-xs text-gray-500 font-bold uppercase">Supporters</p><p class="text-lg font-bold text-gray-900"><span id="hero-supporter-count">0</span>명 참여중</p></div>
                    </div>
                </div>
            </div>
        </div>
    </section>


    <!-- Story -->
    <section id="story" class="py-24 bg-white">
        <div class="max-w-5xl mx-auto px-6 text-center mb-12">
            <h3 class="text-3xl font-serif font-bold text-gray-900">우리가 기억해야 할 이야기</h3>
            <div class="w-16 h-1 bg-primary mx-auto mt-6 rounded-full"></div>
        </div>
        <div id="story-container" class="max-w-5xl mx-auto px-6 space-y-12"></div>
    </section>


    <!-- Promises -->
    <section id="promises" class="py-24 bg-gray-50">
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-16">
                <h3 class="text-3xl font-serif font-bold text-gray-900">가족을 지키는 3가지 약속</h3>
                <p class="mt-4 text-gray-500" id="mission-intro-text"></p>
            </div>
            <div class="grid md:grid-cols-3 gap-8" id="promises-grid"></div>
        </div>
    </section>


    <!-- Resources -->
    <section id="resources" class="py-20 bg-white border-y border-gray-100">
        <div class="max-w-7xl mx-auto px-6">
            <h2 class="text-3xl font-serif font-bold mb-10 text-gray-900">관련 자료 및 증빙</h2>
            <div class="grid md:grid-cols-4 gap-6" id="resources-grid"></div>
        </div>
    </section>


    <!-- Community & Petition -->
    <section id="community" class="py-24 bg-white">
        <div class="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
            <div>
                <h3 class="text-2xl font-bold mb-6 flex items-center gap-2"><i data-lucide="message-circle" class="w-6 h-6"></i> 응원의 한마디</h3>
                <div id="comments-list" class="space-y-4 mb-6 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-2xl border border-gray-100 custom-scrollbar"></div>
                <form id="comment-form" class="bg-white p-4 rounded-2xl border border-gray-200">
                    <div class="flex gap-2 mb-2">
                        <input type="text" id="comment-author" placeholder="이름" class="w-1/3 border p-2 rounded-lg text-sm" required>
                        <input type="text" id="comment-text" placeholder="메시지 남기기" class="flex-1 border p-2 rounded-lg text-sm" required>
                    </div>
                    <div class="flex justify-between items-center">
                        <label class="flex items-center gap-2 text-xs text-gray-500"><input type="checkbox" id="comment-private"> 비공개</label>
                        <button type="submit" class="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold">등록</button>
                    </div>
                </form>
            </div>
            <div class="bg-blue-50 rounded-[2.5rem] p-10 border border-blue-100">
                <h3 class="text-3xl font-serif font-bold text-gray-900 mb-4">순직 인정 탄원서</h3>
                <p class="text-gray-600 mb-8">선생님의 명예 회복을 위해 힘을 보태주세요.</p>
                <div class="bg-white p-6 rounded-2xl text-center mb-8 shadow-sm">
                    <span class="block text-xs text-gray-400 uppercase">Total Signatures</span>
                    <span id="petition-count" class="text-4xl font-mono font-bold text-primary">0</span> 명
                </div>
                <form id="petition-form" class="space-y-4">
                    <input type="text" placeholder="서명자 성명" class="w-full p-3 rounded-xl border border-gray-200 text-sm" required>
                    <button type="submit" class="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-primary-dark transition-all">서명 제출하기</button>
                </form>
            </div>
        </div>
    </section>


    <!-- Posters -->
    <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-6">
            <h2 class="text-3xl font-serif font-bold mb-10 text-center">캠페인 포스터</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6" id="poster-grid"></div>
        </div>
    </section>


    <!-- Donation -->
    <section id="donate" class="py-32 bg-primary text-white relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div class="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <h2 class="text-4xl md:text-6xl font-serif font-bold mb-6">당신의 손길이 희망입니다</h2>
            <p class="text-blue-100 text-lg mb-12">작은 정성이 모여 큰 기적을 만듭니다.</p>
            
            <div class="bg-white text-gray-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-w-lg mx-auto">
                <div class="mb-8">
                    <div class="flex justify-between items-end mb-2">
                        <span class="text-xs font-bold text-gray-400">목표 달성률</span>
                        <span class="text-sm font-bold text-primary"><span id="progress-percent">0</span>%</span>
                    </div>
                    <div class="flex items-baseline gap-2 mb-4 justify-center">
                        <span class="text-4xl font-bold" id="current-amount-display">0</span>
                        <span class="text-gray-400 text-lg">/ <span id="goal-amount-text">0</span>원</span>
                    </div>
                    <div class="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                        <div id="progress-bar" class="bg-gradient-to-r from-primary to-blue-400 h-full rounded-full transition-all duration-1000" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <button onclick="openModal('payment-modal')" class="bg-[#FEE500] text-[#3C1E1E] py-4 rounded-2xl font-bold text-sm">카카오페이</button>
                    <button onclick="openModal('payment-modal')" class="bg-[#00C73C] text-white py-4 rounded-2xl font-bold text-sm">해피빈</button>
                </div>
                <div class="bg-blue-50 p-5 rounded-2xl border-2 border-transparent hover:border-primary transition-all text-left cursor-pointer" onclick="Utils.copyAccount()">
                    <span class="text-xs text-gray-500 font-bold block mb-1">계좌이체 (예금주: <span id="acc-owner"></span>)</span>
                    <div class="font-mono font-bold text-lg text-gray-800"><span id="acc-bank"></span> <span id="acc-number"></span></div>
                </div>
                <div id="donor-ticker" class="mt-6 h-8 overflow-hidden text-sm text-gray-500"></div>
            </div>
            
            <div class="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-lg mx-auto">
                <h4 class="font-bold mb-4 text-white">예산 배정 계획</h4>
                <div class="h-48 relative flex justify-center"><canvas id="budgetChart"></canvas></div>
            </div>
        </div>
    </section>


    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-16 px-6 text-sm">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
            <div class="space-y-4 max-w-md">
                <h4 class="text-white font-bold text-lg">교사유가족협의회</h4>
                <p id="footer-desc-text"></p>
            </div>
            <div class="text-right space-y-2">
                <button onclick="openModal('admin-modal')" class="text-xs text-gray-600 hover:text-white flex items-center gap-1 justify-end ml-auto"><i data-lucide="lock" class="w-3 h-3"></i> 관리자 로그인</button>
                <p>문의: <strong class="text-gray-300" id="footer-phone"></strong> (<span id="footer-contact-name"></span>)</p>
                <p>이메일: <span id="footer-email"></span></p>
            </div>
        </div>
    </footer>


    <!-- Admin Modal -->
    <div id="admin-modal" class="fixed inset-0 z-[9900] hidden flex items-center justify-center px-4 opacity-0 transition-opacity duration-300">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeModal('admin-modal')"></div>
        <div class="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-300">
            <button onclick="closeModal('admin-modal')" class="absolute top-5 right-5 text-gray-400"><i data-lucide="x" class="w-5 h-5"></i></button>
            <h3 class="text-xl font-bold text-center mb-6">관리자 접속</h3>
            <form id="login-form" class="space-y-4">
                <input type="text" id="admin-id" placeholder="아이디" class="w-full bg-gray-50 border p-3 rounded-xl" required>
                <input type="password" id="admin-pw" placeholder="비밀번호" class="w-full bg-gray-50 border p-3 rounded-xl" required>
                <div id="login-error" class="text-red-500 text-xs font-bold hidden text-center">정보가 일치하지 않습니다</div>
                <button type="submit" class="w-full bg-primary text-white font-bold py-3.5 rounded-xl">로그인</button>
            </form>
        </div>
    </div>


    <!-- Admin Dashboard -->
    <div id="admin-dashboard" class="fixed inset-0 bg-gray-50 z-[10000] hidden flex flex-col md:flex-row">
        <aside class="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 h-full z-20">
            <div class="p-5 border-b font-bold text-gray-800 flex gap-2 items-center"><i data-lucide="settings" class="w-5 h-5 text-primary"></i> Admin Center</div>
            <nav class="p-3 space-y-1">
                <button onclick="AdminUI.switchTab('donation')" data-tab="donation" class="admin-tab-btn w-full text-left px-4 py-3 rounded-xl font-bold text-sm text-gray-600 flex gap-2 active"><i data-lucide="credit-card" class="w-4 h-4"></i> 후원 관리</button>
                <button onclick="AdminUI.switchTab('flow')" data-tab="flow" class="admin-tab-btn w-full text-left px-4 py-3 rounded-xl font-bold text-sm text-gray-600 flex gap-2"><i data-lucide="layers" class="w-4 h-4"></i> 텍스트 편집</button>
                <button onclick="AdminUI.switchTab('community')" data-tab="community" class="admin-tab-btn w-full text-left px-4 py-3 rounded-xl font-bold text-sm text-gray-600 flex gap-2"><i data-lucide="message-circle" class="w-4 h-4"></i> 커뮤니티</button>
                <button onclick="AdminUI.switchTab('stats')" data-tab="stats" class="admin-tab-btn w-full text-left px-4 py-3 rounded-xl font-bold text-sm text-gray-600 flex gap-2"><i data-lucide="bar-chart-2" class="w-4 h-4"></i> 통계/QR</button>
            </nav>
            <div class="mt-auto p-4"><button onclick="AuthService.logout()" class="w-full text-red-500 text-sm font-bold border border-red-100 rounded-lg py-2">로그아웃</button></div>
        </aside>
        <main class="flex-1 overflow-y-auto relative">
            <header class="sticky top-0 bg-white/80 backdrop-blur border-b px-6 py-4 flex justify-between items-center z-10">
                <h2 class="font-bold text-gray-800" id="admin-header-title">대시보드</h2>
                <div class="flex gap-2">
                    <button onclick="document.getElementById('admin-dashboard').classList.add('hidden')" class="text-sm border px-4 py-2 rounded-lg font-bold">미리보기</button>
                </div>
            </header>
            <div class="p-6 md:p-10 max-w-5xl mx-auto" id="admin-content-area"></div>
        </main>
    </div>


    <!-- Logic -->
    <script>
        // --- Utils ---
        const Utils = {
            formatCurrency(amount) { return new Intl.NumberFormat('ko-KR').format(amount); },
            showToast(message, type='success') {
                const toast = document.getElementById('toast-notification');
                document.getElementById('toast-message').textContent = message;
                const icon = toast.querySelector('i');
                icon.setAttribute('data-lucide', type === 'error' ? 'alert-circle' : 'check-circle');
                icon.className = `w-5 h-5 ${type === 'error' ? 'text-red-400' : 'text-green-400'}`;
                lucide.createIcons();
                toast.classList.remove('opacity-0', '-translate-y-32');
                setTimeout(() => toast.classList.add('opacity-0', '-translate-y-32'), 3000);
            },
            copyAccount() {
                const text = `${db.get('config').bankName} ${db.get('config').bankAccount}`;
                navigator.clipboard.writeText(text).then(() => this.showToast('계좌번호가 복사되었습니다.'));
            }
        };


        // --- DB (LocalStorage) ---
        const DB_KEY = 'TBFA_JEJU_DATA_V1';
        const DEFAULTS = {
            config: {
                goalAmount: 50000000, currentAmount: 12500000,
                bankName: "농협", bankAccount: "301-1234-5678-91", bankOwner: "교사유가족협의회",
                contactPhone: "010-7151-6993", contactName: "김광일 정책국장", contactEmail: "endy0718@naver.com",
                heroTitle: "선생님의 명예 회복과<br />유가족의 내일을 지켜주세요",
                heroSubtitle: "제주중학교 故 현승준 선생님의 억울한 죽음 뒤에 남겨진 가족들을 위한 긴급 지원 모금입니다.",
                missionIntro: "보내주신 후원금은 유가족의 생계와 법률 대응을 위해 전액 사용됩니다.",
                footerDesc: "본 캠페인은 기부금품법을 준수하며 투명하게 운영됩니다."
            },
            donations: [
                { name: "김미영", amount: 50000, msg: "힘내세요", date: "2025-11-27" },
                { name: "제주도민", amount: 100000, msg: "응원합니다", date: "2025-11-27" }
            ],
            comments: [
                { id: 1, author: "동료교사", text: "잊지 않겠습니다.", date: "2025-11-27", approved: true }
            ],
            petitions: 1248,
            visits: []
        };


        class DB {
            constructor() {
                if(!localStorage.getItem(DB_KEY)) localStorage.setItem(DB_KEY, JSON.stringify(DEFAULTS));
                this.data = JSON.parse(localStorage.getItem(DB_KEY));
            }
            get(key) { return this.data[key]; }
            save() { localStorage.setItem(DB_KEY, JSON.stringify(this.data)); renderContent(); }
            updateConfig(cfg) { this.data.config = {...this.data.config, ...cfg}; this.save(); }
            addDonation(d) { this.data.donations.unshift(d); this.data.config.currentAmount += parseInt(d.amount); this.save(); }
            addComment(c) { this.data.comments.unshift(c); this.save(); }
            updatePetition() { this.data.petitions++; this.save(); return this.data.petitions; }
            addVisit() { this.data.visits.push({t: new Date().toISOString()}); this.save(); }
        }
        const db = new DB();


        // --- Auth ---
        const AuthService = {
            login(id, pw) {
                if(id === 'tbfa' && pw === 'tbfa1') {
                    sessionStorage.setItem('is_admin', 'true');
                    return true;
                }
                return false;
            },
            logout() { sessionStorage.removeItem('is_admin'); location.reload(); },
            isAdmin() { return sessionStorage.getItem('is_admin') === 'true'; }
        };


        // --- Admin UI ---
        const AdminUI = {
            init() {
                if(AuthService.isAdmin()) {
                    document.getElementById('admin-dashboard').classList.remove('hidden');
                    document.getElementById('admin-dashboard').classList.add('flex');
                    this.renderTab('donation');
                }
            },
            switchTab(tab) {
                document.querySelectorAll('.admin-tab-btn').forEach(b => {
                    b.classList.remove('active', 'bg-primary/5', 'text-primary');
                    b.classList.add('text-gray-600');
                    if(b.dataset.tab === tab) {
                        b.classList.remove('text-gray-600');
                        b.classList.add('active', 'bg-primary/5', 'text-primary');
                    }
                });
                this.renderTab(tab);
            },
            renderTab(tab) {
                const c = document.getElementById('admin-content-area');
                const cfg = db.get('config');
                document.getElementById('admin-header-title').textContent = tab.toUpperCase();
                
                if(tab === 'donation') {
                    c.innerHTML = `
                        <div class="bg-white p-6 rounded-2xl shadow-sm mb-6">
                            <h3 class="font-bold mb-4">목표 금액 설정</h3>
                            <div class="flex gap-4">
                                <input type="number" id="adm-goal" value="${cfg.goalAmount}" class="border p-2 rounded w-full">
                                <button onclick="db.updateConfig({goalAmount: parseInt(document.getElementById('adm-goal').value)}); Utils.showToast('저장됨')" class="bg-primary text-white px-4 rounded font-bold">저장</button>
                            </div>
                        </div>
                        <div class="bg-white p-6 rounded-2xl shadow-sm">
                            <h3 class="font-bold mb-4">최근 후원 내역</h3>
                            ${db.get('donations').map(d => `<div class="border-b p-3 flex justify-between"><span>${d.name}</span><span class="font-bold">${Utils.formatCurrency(d.amount)}원</span></div>`).join('')}
                        </div>`;
                } else if(tab === 'flow') {
                    c.innerHTML = `
                        <div class="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                            <div><label class="block text-sm font-bold mb-1">메인 타이틀</label><input id="adm-title" value="${cfg.heroTitle.replace(/"/g, '&quot;')}" class="w-full border p-2 rounded"></div>
                            <div><label class="block text-sm font-bold mb-1">서브 타이틀</label><textarea id="adm-sub" class="w-full border p-2 rounded h-20">${cfg.heroSubtitle}</textarea></div>
                            <button onclick="db.updateConfig({heroTitle: document.getElementById('adm-title').value, heroSubtitle: document.getElementById('adm-sub').value}); Utils.showToast('저장됨')" class="bg-primary text-white px-6 py-2 rounded font-bold">적용하기</button>
                        </div>`;
                } else if(tab === 'stats') {
                    c.innerHTML = `
                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="bg-white p-6 rounded-2xl shadow-sm">
                                <h3 class="font-bold mb-4">접속 통계</h3>
                                <p class="text-2xl font-bold text-primary">${db.get('visits').length} <span class="text-sm text-gray-500">Total Visits</span></p>
                            </div>
                            <div class="bg-white p-6 rounded-2xl shadow-sm text-center">
                                <div id="qr-target" class="flex justify-center mb-4"></div>
                                <p class="text-xs text-gray-500">https://flo.host/TBFA.JEJU</p>
                            </div>
                        </div>`;
                    setTimeout(() => new QRCode(document.getElementById('qr-target'), { text: "https://flo.host/TBFA.JEJU", width: 128, height: 128 }), 100);
                } else if(tab === 'community') {
                    const comments = db.get('comments');
                    c.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                        ${comments.map((cm, i) => `
                            <div class="flex justify-between items-center p-3 border rounded bg-gray-50">
                                <div><span class="font-bold">${cm.author}</span>: ${cm.text} ${!cm.approved ? '<span class="text-red-500 text-xs">[대기]</span>' : ''}</div>
                                ${!cm.approved ? `<button onclick="approveComment(${i})" class="text-green-600 text-sm font-bold">승인</button>` : ''}
                            </div>
                        `).join('')}
                    </div>`;
                }
            }
        };
        
        window.approveComment = (idx) => {
            const comments = db.get('comments');
            comments[idx].approved = true;
            db.data.comments = comments;
            db.save();
            AdminUI.renderTab('community');
        };


        // --- Main Render ---
        function renderContent() {
            const cfg = db.get('config');
            const textIds = { 'hero-title-text': cfg.heroTitle, 'hero-subtitle-text': cfg.heroSubtitle, 'mission-intro-text': cfg.missionIntro, 'footer-desc-text': cfg.footerDesc, 'acc-bank': cfg.bankName, 'acc-number': cfg.bankAccount, 'acc-owner': cfg.bankOwner, 'footer-phone': cfg.contactPhone, 'footer-contact-name': cfg.contactName, 'footer-email': cfg.contactEmail };
            
            for(const [id, txt] of Object.entries(textIds)) {
                const el = document.getElementById(id);
                if(el) el.innerHTML = txt;
            }


            // Donation Stats
            const percent = Math.min(100, Math.floor((cfg.currentAmount / cfg.goalAmount) * 100));
            document.getElementById('progress-percent').innerText = percent;
            document.getElementById('progress-bar').style.width = `${percent}%`;
            document.getElementById('current-amount-display').innerText = Utils.formatCurrency(cfg.currentAmount);
            document.getElementById('goal-amount-text').innerText = Utils.formatCurrency(cfg.goalAmount);
            document.getElementById('hero-supporter-count').innerText = db.get('donations').length + 120;


            // Lists
            const donors = db.get('donations');
            document.getElementById('donor-ticker').innerHTML = donors.length ? 
                donors.map(d => `<div class="py-1"><strong>${d.name}</strong>님 ${Utils.formatCurrency(d.amount)}원 후원</div>`).join('') : '첫 후원자가 되어주세요.';
            
            const comments = db.get('comments').filter(c => c.approved);
            document.getElementById('comments-list').innerHTML = comments.length ? 
                comments.map(c => `<div class="bg-white p-3 rounded-xl border"><div class="flex justify-between text-xs text-gray-400 mb-1"><span>${c.isPrivate?'비공개':c.author}</span><span>${c.date}</span></div><p class="text-sm text-gray-700">${c.isPrivate?'비공개 메시지입니다':c.text}</p></div>`).join('') : '<p class="text-center text-gray-400 py-4 text-sm">응원의 메시지를 남겨주세요.</p>';


            document.getElementById('petition-count').innerText = Utils.formatCurrency(db.get('petitions'));
            renderChart(cfg.goalAmount, cfg.currentAmount);
        }


        function renderChart(goal, current) {
            const ctx = document.getElementById('budgetChart');
            if(!ctx) return;
            if(window.myChart) window.myChart.destroy();
            window.myChart = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: ['모금액', '잔여'], datasets: [{ data: [current, Math.max(0, goal-current)], backgroundColor: ['#ffffff', 'rgba(255,255,255,0.2)'], borderWidth: 0 }] },
                options: { plugins: { legend: { display: false } }, cutout: '75%' }
            });
        }


        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            db.addVisit();
            renderContent();
            AdminUI.init();
            
            // Event Listeners
            document.getElementById('login-form').addEventListener('submit', (e) => {
                e.preventDefault();
                if(AuthService.login(document.getElementById('admin-id').value, document.getElementById('admin-pw').value)) {
                    closeModal('admin-modal');
                    AdminUI.init();
                    Utils.showToast('관리자 로그인 성공');
                } else {
                    document.getElementById('login-error').classList.remove('hidden');
                }
            });


            document.getElementById('payment-confirm-btn').addEventListener('click', () => {
                const amt = document.getElementById('donate-amount').value;
                if(amt > 0) {
                    db.addDonation({
                        name: document.getElementById('donate-name').value || '익명',
                        amount: amt,
                        msg: document.getElementById('donate-msg').value,
                        date: new Date().toISOString().split('T')[0]
                    });
                    closeModal('payment-modal');
                    Utils.showToast('후원이 완료되었습니다.');
                }
            });


            document.getElementById('comment-form').addEventListener('submit', (e) => {
                e.preventDefault();
                db.addComment({
                    author: document.getElementById('comment-author').value,
                    text: document.getElementById('comment-text').value,
                    date: new Date().toISOString().split('T')[0],
                    approved: false, // Needs admin approval
                    isPrivate: document.getElementById('comment-private').checked
                });
                Utils.showToast('메시지가 등록되었습니다 (승인 대기)');
                e.target.reset();
            });


            document.getElementById('petition-form').addEventListener('submit', (e) => {
                e.preventDefault();
                db.updatePetition();
                Utils.showToast('서명이 완료되었습니다.');
                renderContent();
            });


            // Static Content Generators (Promises, Resources, Posters)
            const promises = [
                {icon:'scale', t:'법률 지원', d:'순직 인정을 위한 행정 소송 비용 지원'},
                {icon:'home', t:'생계 유지', d:'가장의 부재로 인한 긴급 생계비 지원'},
                {icon:'heart', t:'심리 치유', d:'유가족 심리 상담 및 치료비 지원'}
            ];
            document.getElementById('promises-grid').innerHTML = promises.map(p => `
                <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div class="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center mb-4"><i data-lucide="${p.icon}"></i></div>
                    <h4 class="font-bold text-lg mb-2">${p.t}</h4><p class="text-gray-500 text-sm">${p.d}</p>
                </div>`).join('');


            const resources = ['상세 후원 계획서', '사건 경위 보고서', '언론 보도 모음', '탄원서 양식'];
            document.getElementById('resources-grid').innerHTML = resources.map(r => `
                <div class="bg-gray-50 p-6 rounded-2xl border hover:border-primary cursor-pointer transition-colors" onclick="openResource('${r}')">
                    <div class="flex justify-between mb-4"><i data-lucide="file-text" class="text-gray-400"></i><i data-lucide="arrow-up-right" class="text-gray-300"></i></div>
                    <h4 class="font-bold text-gray-800">${r}</h4>
                </div>`).join('');
                
            const posters = [
                 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8', 'https://images.unsplash.com/photo-1555848962-6e79363ec58f',
                 'https://images.unsplash.com/photo-1509062522246-3755977927d7', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac'
            ];
            document.getElementById('poster-grid').innerHTML = posters.map(img => `
                <div class="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden relative group">
                    <img src="${img}?q=80&w=400&auto=format&fit=crop" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                </div>`).join('');


            lucide.createIcons();
        });


        // Modal helpers
        window.openModal = (id) => {
            const m = document.getElementById(id);
            m.classList.remove('hidden');
            setTimeout(() => { m.classList.remove('opacity-0'); m.querySelector('div[class*="transform"]').classList.replace('scale-95','scale-100'); }, 10);
        };
        window.closeModal = (id) => {
            const m = document.getElementById(id);
            m.classList.add('opacity-0');
            m.querySelector('div[class*="transform"]').classList.replace('scale-100','scale-95');
            setTimeout(() => m.classList.add('hidden'), 300);
        };
        window.openResource = (title) => {
            document.getElementById('res-modal-title').innerText = title;
            document.getElementById('res-modal-desc').innerText = "본 문서는 보안상의 이유로 실제 배포 시 PDF 다운로드 링크로 대체됩니다.\n\n(샘플 텍스트입니다)";
            openModal('resource-modal');
        };
    </script>
</body>
</html>
