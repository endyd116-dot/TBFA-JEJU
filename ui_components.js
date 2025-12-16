import { DataStore } from './data_store.js';
import { formatCurrency } from './utils.js';
const sanitize = (str) => DOMPurify.sanitize(str || '');

export const UI = {
    init() {
        this.renderAll(DataStore.get());
        window.addEventListener('dataUpdated', (e) => this.renderAll(e.detail));
        if(window.lucide) lucide.createIcons();
        window.showPaymentGuide = (type) => {
             const m = document.getElementById('payment-modal');
             const t = document.getElementById('pay-modal-title');
             const b = document.getElementById('payment-redirect-btn');
             m.classList.remove('hidden'); setTimeout(()=>m.classList.remove('opacity-0'),10);
             if(type === 'kakaopay') { t.textContent = '카카오페이'; b.onclick = () => window.open('https://qr.kakaopay.com/Ej7k6M', '_blank'); }
             else { t.textContent = '일시후원하기(계좌로보내기)'; b.onclick = () => window.open('htthttp://aq.gy/f/nwor^ '_blank'); }
        };
    },
    renderAll(data) {
        this.renderHero(data); this.renderStory(data); this.renderPromises(data); this.renderPlan(data);
        this.renderResources(data); this.renderPosters(data); this.renderCommunity(data); this.renderDonation(data);
        this.renderFooter(data);
        if(window.lucide) lucide.createIcons();
    },
    renderHero(data) {
        document.getElementById('hero-title-text').innerHTML = sanitize(data.hero.title);
        document.getElementById('hero-subtitle-text').innerHTML = sanitize(data.hero.subtitle);
    },
    renderStory(data) {
        document.getElementById('story-container').innerHTML = data.story.map((s, i) => 
            `<div class="flex flex-col md:flex-row gap-12 ${i%2!==0?'md:flex-row-reverse':''}"><div class="flex-1 space-y-6"><h4 class="text-2xl font-bold border-l-4 border-primary pl-4">${sanitize(s.title)}</h4><p class="text-gray-600 leading-loose">${sanitize(s.content)}</p></div><div class="flex-1 bg-gray-100 h-64 rounded-2xl overflow-hidden shadow-lg"><img src="https://images.unsplash.com/photo-1516585427167-a8e023a4eb4c?q=80&w=800" class="w-full h-full object-cover filter brightness-90"></div></div>`
        ).join('');
    },
    renderDonation(data) {
        const total = data.donations.reduce((a,b)=>a+Number(b.amount),0) + (data.settings.baseAmount||0);
        const percent = Math.min(100, Math.round((total/data.settings.targetAmount)*100));
        document.getElementById('current-amount-display').textContent = formatCurrency(total);
        document.getElementById('progress-percent').textContent = percent;
        document.getElementById('progress-bar').style.width = `${percent}%`;
        document.getElementById('goal-amount-text').textContent = formatCurrency(data.settings.targetAmount);
        
        document.getElementById('acc-bank').textContent = data.account.bank;
        document.getElementById('acc-number').textContent = data.account.number;
        document.getElementById('acc-owner').textContent = data.account.owner;
        
        const items = data.donations.slice(0,100).map(d => `<div class="h-8 flex items-center justify-center gap-2"><span class="font-bold">${sanitize(d.name.substring(0,1))}*님</span><span class="text-primary">${formatCurrency(d.amount)}원</span><span class="text-gray-400 text-xs">${sanitize(d.aiMsg)}</span></div>`).join('');
        document.getElementById('donor-list-display').innerHTML = data.donations.length < 5 ? items : `<div class="ticker-wrap"><div class="ticker-move">${items}${items}</div></div>`;
    },
    renderPromises(data) { document.getElementById('promises-grid').innerHTML = data.promises.map(p=>`<div class="bg-white p-8 rounded-3xl shadow-card"><i data-lucide="${p.icon}" class="w-7 h-7 text-primary mb-4"></i><h4 class="font-bold mb-2">${p.title}</h4><p class="text-gray-500">${p.desc}</p></div>`).join(''); },
    renderResources(data) { document.getElementById('resources-grid').innerHTML = data.resources.map((r,i)=>`<div class="bg-white p-6 rounded-2xl border hover:shadow-md cursor-pointer" onclick="window.openResource(${i})"><h4 class="font-bold">${r.title}</h4><p class="text-xs text-gray-500">${r.size}</p></div>`).join(''); 
        window.openResource = (i) => {
            const r = data.resources[i];
            document.getElementById('res-modal-title').textContent = r.title;
            document.getElementById('res-modal-desc').textContent = r.desc;
            document.getElementById('resource-modal').classList.remove('hidden');
            setTimeout(()=>document.getElementById('resource-modal').classList.remove('opacity-0'),10);
        };
    },
    renderPosters(data) { 
        const g = document.getElementById('poster-grid');
        g.innerHTML = data.posters.map((p,i)=>`<div class="poster-item cursor-pointer aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden relative group" data-idx="${i}"><img src="${p.img}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><i data-lucide="zoom-in"></i></div></div>`).join('');
        g.querySelectorAll('.poster-item').forEach(el => el.onclick = () => {
            const p = data.posters[el.dataset.idx];
            document.getElementById('poster-modal-img').src = p.img;
            document.getElementById('poster-modal-qr').innerHTML = '';

            const qrUrl = p.qr || window.location.href;
            new QRCode(document.getElementById('poster-modal-qr'), { text: qrUrl, width: 120, height: 120 });
            document.getElementById('poster-modal').classList.remove('hidden');
            setTimeout(()=>document.getElementById('poster-modal').classList.remove('opacity-0'),10);
        });
    },
    renderCommunity(data) { 
        document.getElementById('comments-list').innerHTML = data.comments.filter(c=>c.approved).map(c=>`<div class="bg-white p-4 rounded border"><b>${c.isPrivate?'익명':c.author}</b>: ${c.isPrivate?'비공개':c.text}</div>`).join(''); 

    },
    renderPlan(data) {
        if(document.getElementById('budgetChart')) {

            const ctx = document.getElementById('budgetChart');

            const chartStatus = Chart.getChart(ctx);
            if (chartStatus) chartStatus.destroy();
            
            new Chart(ctx, {
                type: 'doughnut',
                data: { labels: data.budget.map(b=>b.label), datasets: [{ data: data.budget.map(b=>b.value), backgroundColor: data.budget.map(b=>b.color), borderWidth:0 }] },
                options: { cutout: '75%', plugins: { legend: { display: false } } }
            });
            document.getElementById('total-goal-chart-label').textContent = formatCurrency(data.budget.reduce((a,b)=>a+b.value,0));
        }
        document.getElementById('plan-list').innerHTML = data.budget.map(b=>`<div class="flex justify-between p-3 bg-gray-50 rounded"><span style="color:${b.color}">● ${b.label}</span><b>${formatCurrency(b.value)}원</b></div>`).join('');
    },
    renderFooter(data) { document.getElementById('footer-desc-text').innerHTML = sanitize(data.settings.footerDesc).replace(/\n/g, '<br>'); }
};
