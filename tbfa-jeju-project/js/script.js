/**
 * script.js
 * 메인 페이지 렌더링 및 사용자 인터랙션
 */
import { store } from './data_store.js';

let appData = store.getData();

document.addEventListener('DOMContentLoaded', () => {
    checkReservation();
    renderContent();
    setupInteractions();
    

    window.addEventListener('contentUpdated', () => {
        appData = store.getData();
        renderContent();
    });
});

function checkReservation() {
    const overlay = document.getElementById('reservation-overlay');
    const msg = document.getElementById('release-date-msg');
    

    if (sessionStorage.getItem('tbfa_admin_session') === 'true') {
        overlay.classList.add('hidden');
        return;
    }

    if (appData.meta.publishDate) {
        const now = new Date();
        const release = new Date(appData.meta.publishDate);
        
        if (now < release) {
            overlay.classList.remove('hidden');
            const formattedDate = release.toLocaleString('ko-KR', { 
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });
            msg.textContent = `${formattedDate} 공개 예정`;
            document.body.style.overflow = 'hidden';
        } else {
            overlay.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    } else {
        overlay.classList.add('hidden');
    }
}

function renderContent() {

    document.title = appData.meta.title;


    document.querySelector('.nav-story').textContent = appData.sections.story;
    document.querySelector('.nav-mission').textContent = appData.sections.mission;
    document.querySelector('.nav-posters').textContent = appData.sections.posters;
    document.querySelector('.nav-plan').textContent = appData.sections.plan;


    document.getElementById('hero-title').textContent = appData.hero.title;
    document.getElementById('hero-subtitle').textContent = appData.hero.subtitle;
    document.getElementById('hero-image').src = appData.story[0].image; // Use first story image as hero bg


    const percentage = Math.min(100, Math.round(appData.hero.currentAmount / appData.hero.targetAmount * 100));
    document.getElementById('progress-percentage').textContent = `${percentage}%`;
    document.getElementById('progress-bar').style.width = `${percentage}%`;
    document.getElementById('current-amount').textContent = `${appData.hero.currentAmount.toLocaleString()}원`;
    document.getElementById('goal-amount').textContent = `목표 ${appData.hero.targetAmount.toLocaleString()}원`;


    document.querySelector('.section-title-story').textContent = appData.sections.story;
    document.querySelector('.section-title-mission').textContent = appData.sections.mission;
    document.querySelector('.section-title-posters').textContent = appData.sections.posters;
    document.querySelector('.section-title-plan').textContent = appData.sections.plan;


    const storyContainer = document.getElementById('story-container');
    storyContainer.innerHTML = appData.story.map((item, idx) => `
        <div class="flex flex-col md:flex-row ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''} gap-8 md:gap-16 items-center animate-on-scroll">
            <div class="w-full md:w-1/2">
                <div class="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] group">
                    <img src="${item.image}" alt="Story Image" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700">
                    <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                </div>
            </div>
            <div class="w-full md:w-1/2 space-y-6">
                <div class="inline-block px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-bold tracking-wider mb-2">
                    ${item.step}
                </div>
                <h3 class="font-serif text-3xl font-bold text-brand-dark leading-tight">${item.title}</h3>
                <p class="text-lg text-gray-600 leading-relaxed whitespace-pre-line">${item.content}</p>
            </div>
        </div>
    `).join('');


    const goalsContainer = document.getElementById('goals-container');

    const icons = ['scale', 'heart-handshake', 'home']; 
    goalsContainer.innerHTML = `
        <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-2 transition-transform duration-300">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <i data-lucide="scale" class="w-8 h-8"></i>
            </div>
            <h3 class="text-xl font-bold mb-4 text-brand-dark">법률·행정 지원</h3>
            <p class="text-gray-600">순직 승인 소송 및 진상 규명<br>법률 비용 전액 지원</p>
        </div>
        <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-2 transition-transform duration-300">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                <i data-lucide="heart-handshake" class="w-8 h-8"></i>
            </div>
            <h3 class="text-xl font-bold mb-4 text-brand-dark">심리·정신과 치료</h3>
            <p class="text-gray-600">트라우마 극복을 위한<br>유가족 3인 장기 심리 상담</p>
        </div>
        <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-2 transition-transform duration-300">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                <i data-lucide="home" class="w-8 h-8"></i>
            </div>
            <h3 class="text-xl font-bold mb-4 text-brand-dark">긴급 생계지원금</h3>
            <p class="text-gray-600">가장의 부재로 인한 생활고 해결<br>및 자녀 양육/학업비 지원</p>
        </div>
    `;


    const posterGrid = document.getElementById('poster-grid');
    posterGrid.innerHTML = appData.posters.map(poster => `
        <div class="group relative overflow-hidden rounded-xl shadow-md aspect-[3/4] cursor-pointer">
            <img src="${poster.src}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Poster">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div class="absolute bottom-0 left-0 p-4 w-full">
                <p class="text-white font-bold text-sm md:text-base leading-snug text-center border-t border-white/30 pt-2">
                    ${poster.title}
                </p>
            </div>
            <a href="${poster.src}" download="tbfa_poster.jpg" class="absolute top-4 right-4 bg-white/20 backdrop-blur hover:bg-white hover:text-brand-dark text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <i data-lucide="download" class="w-5 h-5"></i>
            </a>
        </div>
    `).join('');


    const planContent = document.getElementById('plan-content');
    const budgetContent = document.getElementById('budget-content');
    

    const planText = store.parseDoc(appData.docs.plan, appData);
    const budgetText = store.parseDoc(appData.docs.budget, appData);

    planContent.innerHTML = marked.parse(planText);
    budgetContent.innerHTML = marked.parse(budgetText);


    renderBudgetChart();


    generateMainQR();

    lucide.createIcons();
}

function setupInteractions() {

    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });


    document.getElementById('btn-copy-account').addEventListener('click', () => {
        const acc = document.getElementById('bank-account').textContent;
        navigator.clipboard.writeText(acc).then(() => {
            showToast('계좌번호가 복사되었습니다.');
        });
    });


    document.getElementById('btn-share-hero').addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: appData.meta.title,
                text: appData.hero.subtitle,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast('링크가 복사되었습니다.');
        }
    });


    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            mobileMenu.classList.add('hidden');
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    toast.classList.remove('opacity-0');
    setTimeout(() => {
        toast.classList.add('opacity-0');
    }, 3000);
}

function generateMainQR() {
    const container = document.getElementById('qr-container');

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(window.location.href)}`;
    container.innerHTML = `<img src="${qrUrl}" alt="Donate QR" class="w-full h-full object-contain">`;
}

function renderBudgetChart() {
    const canvas = document.getElementById('budgetChart');

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: ['법률/행정비', '심리 치료비', '긴급 생계비', '운영비'],
            datasets: [{
                data: [40, 30, 20, 10],
                backgroundColor: ['#EF4444', '#10B981', '#3B82F6', '#6B7280']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}
