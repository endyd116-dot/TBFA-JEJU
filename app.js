import { DataStore } from './data_store.js';
import { Auth } from './tbfa_auth.js';
import { AdminUI } from './admin_ui.js';
import { Tracker } from './tracker.js';
import { formatCurrency, showToast, sanitize } from './utils.js';

let commentTimer = null;
let commentPage = 0;
let donorTimer = null; // legacy ticker (unused with CSS ticker)
let signCanvas, signCtx, isSigning = false, signDirty = false;
let bgAudio = null;
let bgAudioType = 'audio'; // 'audio' | 'youtube'
let isAudioPlaying = false;
let ytIframe = null;
let isAudioMuted = true;
const BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

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
    updateMetaTags(updated);
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
    if(heroImg) heroImg.src = data.hero.image || heroImg.dataset.fallback || BLANK_IMG;
    

    document.getElementById('footer-desc-text').innerHTML = data.settings.footerDesc;
    const phoneEl = document.getElementById('footer-phone-text');
    if(phoneEl) phoneEl.textContent = data.settings.footerPhone || '';
    const emailEl = document.getElementById('footer-email-text');
    const emailLink = document.getElementById('footer-email-link');
    if(emailEl) emailEl.textContent = data.settings.footerEmail || '';
    if(emailLink) emailLink.href = `mailto:${data.settings.footerEmail || ''}`;
    

    const current = Number(data.settings.baseAmount || 0);
    const percent = Math.min(100, Math.floor((current / data.settings.targetAmount) * 100));
    
    document.getElementById('current-amount-display').textContent = formatCurrency(current);
    document.getElementById('goal-amount-text').textContent = formatCurrency(data.settings.targetAmount);
    document.getElementById('progress-percent').textContent = percent;
    document.getElementById('progress-bar').style.width = `${percent}%`;
    document.getElementById('total-goal-chart-label').textContent = formatCurrency(data.settings.targetAmount);
    const donateSideImg = document.getElementById('donate-side-image');
    if(donateSideImg) donateSideImg.src = data.settings.donateImage || donateSideImg.src;
    updateMetaTags(data);


    document.getElementById('acc-owner').textContent = data.settings.accountOwner;
    document.getElementById('acc-bank').textContent = data.settings.accountBank;
    document.getElementById('acc-number').textContent = data.settings.accountNumber;


    const donorList = document.getElementById('donor-list-display');
    const donors = data.donations.slice(0, 20);
    if(donors.length === 0) {
        donorList.innerHTML = '<div class="donor-row text-gray-400">아직 후원이 없습니다.</div>';
    } else {
        const rows = donors.map(d => 
            `<div class="donor-row"><span class="font-bold text-primary">${sanitize(d.name)}</span>님 <span class="font-bold">${formatCurrency(d.amount)}원</span> 후원 - "${sanitize(d.aiMsg)}"</div>`
        ).join('');
        const duration = Math.max(8, donors.length * 2);
        donorList.innerHTML = `<div class="donor-ticker" style="--donor-count:${donors.length}; --donor-duration:${duration}s;">${rows}${rows}</div>`;
    }


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
    renderComments(approvedComments, commentList);


    renderStories();
    renderPromises(data);
    renderPlanList(data);
    applyFlowTexts(data);
    applySectionOrder(data.settings?.sectionOrder);
    renderPetitions(data);
    renderSignatures(data);
    setupBackgroundAudio(data.settings?.musicUrl);
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


    const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    // 파일 업로드는 사용하지 않고, URL/텍스트만 처리합니다.

    document.getElementById('petition-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('pet-name').value;
        const meta = Tracker.getVisitorInfo();
        const fileInput = document.getElementById('pet-file');
        const file = fileInput?.files?.[0];
        let fileName = file ? file.name : '';
        const now = new Date();

        let fileUrl = '';
        if(file) {
            showToast('현재는 파일 업로드를 지원하지 않습니다. URL로만 등록해주세요.');
            return;
        }

        data.petitions.push({
            name,
            date: now.toISOString(),
            ip: meta.ip,
            fileName,
            fileUrl,
            timestamp: now.toISOString()
        });
        DataStore.save(data);
        showToast('서명이 제출되었습니다. 감사합니다.');
        e.target.reset();
        document.getElementById('pet-file-name').classList.add('hidden');
        renderPetitions(data);
    });

    document.getElementById('sign-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('sign-name').value;
        const phoneRaw = document.getElementById('sign-phone').value;
        const digits = phoneRaw.replace(/\D/g, '');
        if(!(digits.length === 10 || digits.length === 11)) {
            showToast('연락처를 숫자 10~11자리로 입력해주세요.');
            return;
        }
        const phone = digits.length === 11
            ? `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`
            : `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
        const ssn = document.getElementById('sign-ssn').value;
        const signData = document.getElementById('sign-data').value;
        if(!signData) {
            showToast('서명을 입력해주세요.');
            return;
        }
        const now = new Date();
        data.signatures = data.signatures || [];
        data.signatures.push({
            name,
            phone,
            ssn,
            timestamp: now.toISOString(),
            signData
        });
        DataStore.save(data);
        showToast('서명이 완료되었습니다.');
        e.target.reset();
        document.getElementById('sign-data').value = '';
        signDirty = false;
        document.getElementById('sign-status').textContent = '서명을 입력하세요.';
        renderSignatures(data);
    });
    

    document.getElementById('pet-file').addEventListener('change', (e) => {
        const nameDisplay = document.getElementById('pet-file-name');
        if(e.target.files[0]) {
            nameDisplay.textContent = e.target.files[0].name;
            nameDisplay.classList.remove('hidden');
        }
    });
    
    // Signature pad
    const signModal = document.getElementById('sign-modal');
    const openPad = document.getElementById('open-sign-pad');
    const closePad = document.getElementById('sign-modal-close');
    signCanvas = document.getElementById('sign-canvas');
    signCtx = signCanvas ? signCanvas.getContext('2d') : null;

    const setStatus = (msg) => { const s = document.getElementById('sign-status'); if(s) s.textContent = msg; };

    const startSign = (x, y) => {
        if(!signCtx) return;
        signCtx.beginPath();
        signCtx.moveTo(x, y);
        isSigning = true;
    };
    const drawSign = (x, y) => {
        if(!isSigning || !signCtx) return;
        signCtx.lineTo(x, y);
        signCtx.strokeStyle = '#111827';
        signCtx.lineWidth = 2;
        signCtx.lineCap = 'round';
        signCtx.stroke();
        signDirty = true;
    };
    const endSign = () => { isSigning = false; };

    if(signCanvas) {
        const getPos = (e) => {
            const rect = signCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        };
        signCanvas.addEventListener('mousedown', (e)=>{ const p=getPos(e); startSign(p.x,p.y);} );
        signCanvas.addEventListener('mousemove', (e)=>{ const p=getPos(e); drawSign(p.x,p.y);} );
        signCanvas.addEventListener('mouseup', endSign);
        signCanvas.addEventListener('mouseleave', endSign);
        signCanvas.addEventListener('touchstart', (e)=>{ const p=getPos(e); startSign(p.x,p.y); e.preventDefault(); });
        signCanvas.addEventListener('touchmove', (e)=>{ const p=getPos(e); drawSign(p.x,p.y); e.preventDefault(); });
        signCanvas.addEventListener('touchend', endSign);
    }

    const clearSign = () => {
        if(signCtx && signCanvas) {
            signCtx.clearRect(0,0,signCanvas.width, signCanvas.height);
            signDirty=false;
            setStatus('서명을 입력하세요.');
        }
    };

    if(openPad) openPad.addEventListener('click', () => {
        if(signModal) signModal.classList.remove('hidden');
        // resize canvas to visible size for proper dataURL
        if(signCanvas) {
            const rect = signCanvas.getBoundingClientRect();
            if(rect.width && rect.height) {
                signCanvas.width = rect.width;
                signCanvas.height = rect.height;
            }
        }
        clearSign();
    });
    if(closePad) closePad.addEventListener('click', () => {
        if(signModal) signModal.classList.add('hidden');
    });
    const clearBtn = document.getElementById('sign-clear');
    if(clearBtn) clearBtn.addEventListener('click', clearSign);
    const saveBtn = document.getElementById('sign-save');
    if(saveBtn) saveBtn.addEventListener('click', () => {
        if(!signDirty) { setStatus('서명을 입력해주세요.'); return; }
        const dataUrl = signCanvas.toDataURL('image/png');
        const hidden = document.getElementById('sign-data');
        if(hidden) hidden.value = dataUrl;
        setStatus('서명이 저장되었습니다.');
        if(signModal) signModal.classList.add('hidden');
    });

    document.getElementById('download-petition-btn').addEventListener('click', () => {
        const latest = DataStore.get();
        const url = latest.settings?.petitionFormUrl;
        if(url) {
            window.open(url, '_blank');
        } else {
            showToast('관리자가 아직 양식을 등록하지 않았습니다.');
        }
    });

    document.getElementById('main-donate-cms-btn').addEventListener('click', () => {
        const link = data.settings?.donateMainUrl;
        if(link) window.open(link, '_blank');
        else window.location.href = '#donate';
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
            const url = data.settings?.donateKakaoUrl || 'https://qr.kakaopay.com/Ej8e5jZ';
            btn.onclick = () => window.open(url, '_blank');
        } else {
            title.textContent = '해피빈 기부';
            const url = data.settings?.donateHappyUrl || 'https://happybean.naver.com';
            btn.onclick = () => window.open(url, '_blank');
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
        const kakaoBtn = document.getElementById('poster-kakao-share-btn');

        if (linkList) {
            const links = (DataStore.get().settings?.shareLinks || []).filter(l=>l.url);
            linkList.innerHTML = links.map(l => `
                ${(function(){
                    const isNaver = /네이버/i.test(l.label);
                    const base = 'w-full font-bold py-2.5 rounded-lg flex items-center px-3';
                    if(isNaver) {
                        return `<button class="${base} border border-[#03C75A] text-[#03C75A] justify-center hover:bg-[#03C75A] hover:text-white" onclick="window.open('${l.url}','_blank','noopener')">
                            <span>${sanitize(l.label)}</span>
                        </button>`;
                    }
                    return '';
                })()}
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
        if (kakaoBtn) kakaoBtn.onclick = () => {
            const kakaoUrl = `https://accounts.kakao.com/login/?continue=${encodeURIComponent('https://sharer.kakao.com/picker/link?app_key=3e6ddd834b023f24221217e370daed18&short_key=0231c9c7-2aa6-49b2-af60-c845721e70f1')}`;
            window.open(kakaoUrl, '_blank', 'width=600,height=700');
        };
        
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    };
}

function setupBackgroundAudio(url) {
    const toggle = document.getElementById('audio-toggle');
    const iconEl = document.getElementById('audio-toggle-icon');
    if (!toggle) return;

    if (!url) {
        toggle.classList.add('hidden');
        if (bgAudio) bgAudio.pause();
        if (ytIframe && ytIframe.parentNode) ytIframe.parentNode.removeChild(ytIframe);
        isAudioPlaying = false;
        return;
    }

    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    const isYoutube = !!ytMatch;

    if (!bgAudio) {
        bgAudio = new Audio();
        bgAudio.loop = true;
    }
    bgAudioType = isYoutube ? 'youtube' : 'audio';
    isAudioMuted = true;
    isAudioPlaying = false;

    const updateIcon = () => {
        if (iconEl) {
            // 스피커 이모지를 단색으로 보이도록 그레이스케일 처리
            iconEl.textContent = isAudioPlaying && !isAudioMuted ? '🔊' : '🔇';
            iconEl.style.filter = 'grayscale(1)';
        }
        toggle.setAttribute('aria-pressed', isAudioPlaying ? 'true' : 'false');
        toggle.classList.remove('hidden');
    };

    const sendYT = (cmd) => {
        if (!ytIframe || !ytIframe.contentWindow) return;
        ytIframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: cmd,
            args: []
        }), '*');
    };

    const playAudio = async (forceMuted = false) => {
        isAudioMuted = forceMuted;
        if (bgAudioType === 'youtube') {
            sendYT('playVideo');
            if (forceMuted) sendYT('mute'); else sendYT('unMute');
            isAudioPlaying = true;
            updateIcon();
            return true;
        }
        bgAudio.muted = forceMuted;
        try {
            await bgAudio.play();
            if (!forceMuted) bgAudio.muted = false;
            isAudioPlaying = true;
            updateIcon();
            return true;
        } catch (err) {
            console.warn('Autoplay blocked or failed', err);
            isAudioPlaying = false;
            updateIcon();
            return false;
        }
    };

    const pauseAudio = () => {
        if (bgAudioType === 'youtube') {
            sendYT('pauseVideo');
            isAudioPlaying = false;
            isAudioMuted = false;
            updateIcon();
            return;
        }
        bgAudio.pause();
        isAudioPlaying = false;
        isAudioMuted = true;
        updateIcon();
    };

    toggle.onclick = () => {
        if (!bgAudio) return;
        if (isAudioPlaying) {
            pauseAudio();
        } else {
            playAudio(false);
        }
    };

    updateIcon(); // 시작 아이콘 표시 (볼륨)

    if (isYoutube) {
        const videoId = ytMatch[1];
        const src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&loop=1&playlist=${videoId}&controls=0&rel=0&playsinline=1&mute=0`;
        if (!ytIframe) {
            ytIframe = document.createElement('iframe');
            ytIframe.id = 'bg-audio-yt';
            ytIframe.style.position = 'absolute';
            ytIframe.style.width = '0';
            ytIframe.style.height = '0';
            ytIframe.style.border = '0';
            ytIframe.style.opacity = '0';
            ytIframe.setAttribute('allow', 'autoplay');
            document.body.appendChild(ytIframe);
        }
        ytIframe.src = src;
        // muted autoplay, then unmute
        setTimeout(() => {
            playAudio(true).then(() => {
                setTimeout(() => { playAudio(false); }, 400);
            });
        }, 500);
    } else {
        bgAudio.src = url;
        // Try autoplay on load (muted first), and also hook a first user interaction to start playback if blocked
        playAudio(true).then((ok) => {
            if (ok) setTimeout(() => { playAudio(false); }, 400);
        });
        const kickstart = () => { playAudio(false); window.removeEventListener('pointerdown', kickstart); window.removeEventListener('keydown', kickstart); };
        window.addEventListener('pointerdown', kickstart, { once: true });
        window.addEventListener('keydown', kickstart, { once: true });
    }
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
        <div class="rounded-2xl p-6 md:p-8 shadow-lg" style="background:${sanitize(b.bg || '#f3f4f6')}">
            <div class="grid md:grid-cols-2 gap-12 items-center ${b.position === 'left' ? 'md:flex-row-reverse' : ''}">
                <div class="space-y-6 ${b.position === 'left' ? 'order-2 md:order-2' : ''}">
                    <h4 class="text-2xl font-bold font-serif text-gray-900">${sanitize(b.title)}</h4>
                    <p class="text-gray-700 leading-relaxed">${sanitize(b.content)}</p>
                </div>
                <div class="rounded-xl h-80 overflow-hidden ${b.position === 'left' ? 'order-1 md:order-1' : ''}">
                     <img src="${sanitize(b.image || '')}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700">
                </div>
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

function renderPetitions(data) {
    const table = document.getElementById('petition-table');
    if(!table) return;
    const rows = data.petitions || [];
    if(rows.length === 0) {
        table.innerHTML = '<div class="text-center text-gray-400 py-6">아직 제출된 서명이 없습니다.</div>';
        return;
    }
    table.innerHTML = `
        <table class="min-w-full text-left text-sm">
            <thead class="text-xs text-gray-500 border-b">
                <tr>
                    <th class="py-2 px-2">성명</th>
                    <th class="py-2 px-2">문서</th>
                    <th class="py-2 px-2">제출 시간</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                ${rows.slice().reverse().map(r => {
                    const ts = r.timestamp || r.date;
                    const dt = ts ? new Date(ts) : null;
                    const formatted = dt && !isNaN(dt) ? dt.toLocaleString('ko-KR') : '';
                    return `<tr>
                        <td class="py-2 px-2">${sanitize(r.name)}</td>
                        <td class="py-2 px-2">${sanitize(r.fileName || '업로드 없음')}</td>
                        <td class="py-2 px-2 text-gray-500 text-xs">${formatted}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
}

function renderSignatures(data) {
    const totalEl = document.getElementById('sign-total-count');
    if(totalEl) totalEl.textContent = data.signatures?.length || 0;
}

function renderComments(approvedComments, container) {
    if(!container) return;
    if(commentTimer) {
        clearInterval(commentTimer);
        commentTimer = null;
    }
    if(approvedComments.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">첫 번째 응원 메시지를 남겨주세요.</div>';
        return;
    }

    const pageSize = 4;
    const pages = Math.ceil(approvedComments.length / pageSize);
    container.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    container.style.transformOrigin = 'center bottom';
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';

    const renderPage = (page) => {
        const start = page * pageSize;
        const slice = approvedComments.slice(start, start + pageSize);
        container.style.opacity = '0';
        container.style.transform = 'translateY(8px)';
        setTimeout(() => {
            container.innerHTML = slice.map(c => `
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p class="text-gray-800 mb-2 leading-relaxed">${sanitize(c.text)}</p>
                    <div class="flex justify-between items-center text-xs text-gray-400">
                        <span class="font-bold text-gray-600">${sanitize(c.author)}</span>
                        <span>${c.date}</span>
                    </div>
                </div>
            `).join('');
            requestAnimationFrame(() => {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            });
        }, 180);
    };

    commentPage = 0;
    renderPage(commentPage);

    if(approvedComments.length > pageSize) {
        commentTimer = setInterval(() => {
            commentPage = (commentPage + 1) % pages;
            renderPage(commentPage);
        }, 5000);
    }
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
    const baseOrder = ['hero','story','promises','plan','resources','posters','community','sign','donate'];
    const data = typeof order === 'object' && order.settings ? order : { settings: { sectionOrder: order } };
    let sectionIds = data.settings?.sectionOrder && data.settings.sectionOrder.length ? data.settings.sectionOrder.slice() : baseOrder.slice();
    // ensure all base sections exist in order
    baseOrder.forEach(id => { if(!sectionIds.includes(id)) sectionIds.push(id); });
    const hidden = new Set(data.settings?.hiddenSections || []);
    const allIds = baseOrder;
    const footer = document.querySelector('footer');
    if(!footer) return;

    const frag = document.createDocumentFragment();
    // Remove from DOM and re-append in order
    sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        if(hidden.has(id)) {
            el.classList.add('hidden');
            return;
        }
        el.classList.remove('hidden');
        if(el.parentElement) el.parentElement.removeChild(el);
        frag.appendChild(el);
    });
    // Append any other sections not listed if not hidden
    allIds.forEach(id => {
        if(sectionIds.includes(id)) return;
        const el = document.getElementById(id);
        if(el && !hidden.has(id)) {
            if(el.parentElement) el.parentElement.removeChild(el);
            frag.appendChild(el);
        }
    });
    document.body.insertBefore(frag, footer);
}
