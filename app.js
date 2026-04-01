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
let CURRENT_DATA = null;
let ACTIVE_DONATE_LINK = '';
let ACTIVE_DONATE_TYPE = 'regular';
const DONATE_FOCUS_SELECTOR = '#donate-modal input, #donate-modal textarea';

const copyText = async (text, allowFallback = true) => {
    if (!text) return false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }
    if (!allowFallback) return false;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let ok = false;
    try {
        ok = document.execCommand('copy');
    } catch (err) {
        ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
};

const updateAccountVisibility = (isAuthed) => {
    const accPlaceholder = document.getElementById('acc-placeholder');
    const accDetails = document.getElementById('acc-details');
    if (!accPlaceholder || !accDetails) return;
    const data = CURRENT_DATA || DataStore.get();
    const bank = data?.settings?.accountBank || '';
    const number = data?.settings?.accountNumber || '';
    if (isAuthed) {
        accPlaceholder.textContent = `${bank} ${number}`.trim();
        accPlaceholder.classList.remove('text-sm', 'text-gray-500');
        accPlaceholder.classList.add('text-lg', 'md:text-xl', 'text-gray-800', 'font-bold');
        accPlaceholder.classList.remove('hidden');
        accPlaceholder.style.display = 'inline';
        accDetails.classList.add('hidden');
        accDetails.style.display = 'none';
    } else {
        accPlaceholder.textContent = '정기,일시 후원회원 버튼을 눌러주세요';
        accPlaceholder.classList.remove('text-lg', 'md:text-xl', 'text-gray-800', 'font-bold');
        accPlaceholder.classList.add('text-sm', 'text-gray-500');
        accPlaceholder.classList.remove('hidden');
        accPlaceholder.style.display = 'inline';
        accDetails.classList.add('hidden');
        accDetails.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const latest = await DataStore.loadRemote();
    initApp(latest);
    Auth.check();
    Tracker.init();
});

// Admin side updates -> live reflect without reload
window.addEventListener('dataUpdated', (e) => {
    const updated = e.detail || DataStore.get();
    renderContent(updated);
    renderCharts(updated);
});

function initApp(preloaded) {
    const data = preloaded || DataStore.get();
    renderContent(data);
    setupEventListeners(data);
    renderCharts(data);
    applySectionOrder(data);
    lucide.createIcons();
}

function renderContent(data) {
    CURRENT_DATA = data;

    document.getElementById('hero-title-text').innerHTML = data.hero.title;
    document.getElementById('hero-subtitle-text').innerHTML = data.hero.subtitle;
    const heroImg = document.getElementById('hero-main-image');
    if(heroImg) heroImg.src = data.hero.image || heroImg.dataset.fallback || BLANK_IMG;
    const heroOverlay = document.getElementById('hero-overlay-text');
    if(heroOverlay) heroOverlay.innerHTML = sanitize(data.hero.overlay || '');
    const headerLogo = document.getElementById('header-logo');
    const headerIcon = document.getElementById('header-icon');
    if (headerLogo) {
        const logo = data.settings?.logoUrl;
        if (logo) {
            headerLogo.src = logo;
            headerLogo.classList.remove('hidden');
            if (headerIcon) headerIcon.classList.add('hidden');
        } else {
            headerLogo.src = '';
            headerLogo.classList.add('hidden');
            if (headerIcon) headerIcon.classList.remove('hidden');
        }
    }
    const siteTitle = document.getElementById('header-site-title');
    const siteSubtitle = document.getElementById('header-site-subtitle');
    if (siteTitle) siteTitle.textContent = data.settings?.siteTitle || '교사유가족협의회';
    if (siteSubtitle) siteSubtitle.textContent = data.settings?.siteSubtitle || "Teacher's Family Association";

    const blogLink = (data.settings?.shareLinks || [])[0]?.url || '';
    const headerBlog = document.getElementById('header-blog-link');
    if (headerBlog && blogLink) headerBlog.href = blogLink;
    const heroBlog = document.getElementById('hero-blog-link');
    if (heroBlog && blogLink) heroBlog.href = blogLink;
    

    document.getElementById('footer-desc-text').innerHTML = data.settings.footerDesc;
    const phoneEl = document.getElementById('footer-phone-text');
    if(phoneEl) phoneEl.textContent = data.settings.footerPhone || '';
    const emailEl = document.getElementById('footer-email-text');
    const emailLink = document.getElementById('footer-email-link');
    if(emailEl) emailEl.textContent = data.settings.footerEmail || '';
    if(emailLink) emailLink.href = `mailto:${data.settings.footerEmail || ''}`;

    const footerModals = Array.isArray(data.settings?.footerModals) ? data.settings.footerModals : [];
    [0, 1].forEach((idx) => {
        const btn = document.getElementById(`footer-modal-btn-${idx}`);
        if (btn) btn.classList.add('hidden');
    });
    footerModals.forEach((modal, idx) => {
        const title = modal?.title || `푸터 모달 ${idx + 1}`;
        const btn = document.getElementById(`footer-modal-btn-${idx}`);
        const titleEl = document.getElementById(`footer-modal-title-${idx}`);
        const bodyEl = document.getElementById(`footer-modal-body-${idx}`);
        const blocks = Array.isArray(modal?.blocks) ? modal.blocks : [];
        const hasContent = blocks.some((block) => {
            if (!block || !block.type) return false;
            const value = (block.value || '').trim();
            return value.length > 0;
        });
        if (btn) {
            btn.textContent = title;
            btn.classList.toggle('hidden', !hasContent);
        }
        if (titleEl) titleEl.textContent = title;
        if (bodyEl) {
            const html = blocks.map((block) => {
                if (!block || !block.type) return '';
                if (block.type === 'html') {
                    return `<div class="mb-3">${sanitize(block.value || '')}</div>`;
                }
                if (block.type === 'image' && block.value) {
                    return `<div class="mb-3"><img src="${sanitize(block.value)}" alt="footer modal image" class="w-full rounded-xl"></div>`;
                }
                return '';
            }).join('');
            bodyEl.innerHTML = html || '<div class="text-sm text-gray-400">표시할 내용이 없습니다.</div>';
        }
    });
    

    const current = Number(data.settings.baseAmount || 0);
    const percent = Math.min(100, Math.floor((current / data.settings.targetAmount) * 100));
    
    document.getElementById('current-amount-display').textContent = formatCurrency(current);
    document.getElementById('goal-amount-text').textContent = formatCurrency(data.settings.targetAmount);
    document.getElementById('progress-percent').textContent = percent;
    document.getElementById('progress-bar').style.width = `${percent}%`;
    document.getElementById('total-goal-chart-label').textContent = formatCurrency(data.settings.targetAmount);
    const donateSideImg = document.getElementById('donate-side-image');
    if(donateSideImg) donateSideImg.src = data.settings.donateImage || donateSideImg.dataset.fallback || '';


    document.getElementById('acc-owner').textContent = data.settings.accountOwner;
    document.getElementById('acc-bank').textContent = data.settings.accountBank;
    document.getElementById('acc-number').textContent = data.settings.accountNumber;
    const donateAuthOk = sessionStorage.getItem('tbfa_donate_auth_ok') === 'true';
    updateAccountVisibility(donateAuthOk);


    const donorList = document.getElementById('donor-list-display');
    const donors = data.donations.slice(0, 100);
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
    const limit = Number(data.settings?.commentsDisplayLimit || 0) || 0;
    const approvedComments = data.comments
        .filter(c => c.approved)
        .slice()
        .sort((a, b) => {
            const ta = new Date(a.timestamp || a.date || a.time || 0).getTime();
            const tb = new Date(b.timestamp || b.date || b.time || 0).getTime();
            return tb - ta;
        })
        .slice(0, limit > 0 ? limit : undefined);
    renderComments(approvedComments, commentList);


    renderStories(data);
    renderPromises(data);
    renderPlanList(data);
    applyFlowTexts(data);
    applySectionOrder(data.settings?.sectionOrder);
    renderPetitions(data);
    renderSignatures(data);
    renderSignResources(data);
    renderDonateFormFields(data);
    applyDonateTerms(data);
    setupBackgroundAudio(data.settings?.musicUrl);
}

function setupEventListeners(data) {
    const signSavedIndicator = document.getElementById('sign-saved-indicator');
    const donateModal = document.getElementById('donate-modal');
    const donateForm = document.getElementById('regular-donate-form');
    const donateSubmitBtn = document.getElementById('donate-submit-btn');
    const donateFields = data.settings?.donateFields || [];
    const DONATE_DRAFT_KEY = 'donate_form_draft';
    const closeModal = (targetId) => {
        const modal = document.getElementById(targetId);
        if(!modal || modal.classList.contains('hidden')) return;
        modal.classList.remove('opacity-100');
        setTimeout(() => modal.classList.add('hidden'), 300);
        if (targetId === 'donate-modal') {
            document.body.classList.remove('modal-open');
        }
    };

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            closeModal(targetId);
        });
    });

    [0, 1].forEach((idx) => {
        const btn = document.getElementById(`footer-modal-btn-${idx}`);
        if (!btn) return;
        btn.addEventListener('click', () => {
            const modal = document.getElementById(`footer-modal-${idx}`);
            if (!modal) return;
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('opacity-100'), 10);
        });
    });


    document.getElementById('footer-login-trigger').addEventListener('click', () => {
        const modal = document.getElementById('admin-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('login-submit-btn');
        const spinner = submitBtn?.querySelector('.login-btn-spinner');
        const label = submitBtn?.querySelector('.login-btn-text');
        if (submitBtn) submitBtn.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
        if (label) label.textContent = '로그인 중...';
        const id = document.getElementById('admin-id').value;
        const pw = document.getElementById('admin-pw').value;
        
        let ok = false;
        try {
            ok = await Auth.login(id, pw);
        } finally {
            if (!ok) {
                if (submitBtn) submitBtn.disabled = false;
                if (spinner) spinner.classList.add('hidden');
                if (label) label.textContent = '로그인';
            }
        }
        
        if(ok) {
            // 최신 DB 데이터로 동기화 후 관리자 UI 렌더
            const fresh = await DataStore.loadRemote();
            if (fresh) {
                renderContent(fresh);
                renderCharts(fresh);
            }
            document.getElementById('admin-modal').classList.remove('opacity-100');
            setTimeout(() => document.getElementById('admin-modal').classList.add('hidden'), 300);
            document.getElementById('admin-dashboard').classList.remove('hidden');
            AdminUI.init();
            AdminUI.renderDashboard('donation'); // Default tab
            if (submitBtn) submitBtn.disabled = false;
            if (spinner) spinner.classList.add('hidden');
            if (label) label.textContent = '로그인';
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


    document.getElementById('comment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const author = document.getElementById('comment-author').value;
        const text = document.getElementById('comment-text').value;
        const isPrivate = document.getElementById('comment-private').checked;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        toggleLoading(submitBtn, true, '전송 중...');
        

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
        try {
            const res = await fetch('/.netlify/functions/submit-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    author: newComment.author,
                    realName: newComment.realName,
                    ip: newComment.ip,
                    device: newComment.device,
                    isPrivate
                })
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok || result.error) {
                console.error('Comment submit failed', result);
                showToast('응원 전달에 실패했습니다. 잠시 후 다시 시도해주세요.');
                return;
            }
            // 로컬에 추가(비승인 상태)
            data.comments.unshift(newComment);
            DataStore.save(data);
            showToast('응원이 전달되었습니다. (승인 후 표시)');
            e.target.reset();
        } catch (err) {
            console.error('Comment submit error', err);
            showToast('응원 전달에 실패했습니다. 네트워크를 확인해주세요.');
        } finally {
            toggleLoading(submitBtn, false);
        }
    });


    const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    document.getElementById('petition-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        toggleLoading(submitBtn, true, '제출 중...');
        const name = document.getElementById('pet-name').value;
        const meta = Tracker.getVisitorInfo();
        const fileInput = document.getElementById('pet-file');
        const file = fileInput?.files?.[0];
        let fileName = file ? file.name : '';
        const now = new Date();

        const recipient = data.settings?.petitionEmail || '';
        if(!recipient) {
            showToast('관리자가 수신 이메일을 설정하지 않았습니다.');
            return;
        }

        const fileContent = file ? await readFileAsDataUrl(file) : '';
        // 이메일 전송
        try {
            const res = await fetch('/.netlify/functions/send-petition-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipient,
                    name,
                    file: file ? { name: file.name, type: file.type, content: fileContent } : {},
                    smtp: {
                        host: data.settings?.smtpHost || '',
                        port: data.settings?.smtpPort || '',
                        user: data.settings?.smtpUser || '',
                        pass: data.settings?.smtpPass || '',
                        from: data.settings?.fromEmail || ''
                    }
                })
            });
            const msg = await res.json().catch(() => ({}));
            if(!msg.ok) {
                console.warn('메일 전송 안됨', msg);
                showToast('메일 전송이 설정되지 않았습니다. 관리자 이메일 설정/SMTP를 확인하세요.');
            }
        } catch (err) {
            console.error('메일 전송 실패', err);
            showToast('메일 전송에 실패했습니다.');
        }

        let fileUrl = '';
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
        toggleLoading(submitBtn, false);
    });

    document.getElementById('sign-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        toggleLoading(submitBtn, true, '제출 중...');
        const name = document.getElementById('sign-name').value;
        const phoneRaw = document.getElementById('sign-phone').value;
        const digits = phoneRaw.replace(/\D/g, '');
        if(!(digits.length === 10 || digits.length === 11)) {
            showToast('연락처를 숫자 10~11자리로 입력해주세요.');
            toggleLoading(submitBtn, false);
            return;
        }
        const phone = digits.length === 11
            ? `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`
            : `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
        const ssn = document.getElementById('sign-ssn').value;
        const signData = document.getElementById('sign-data').value;
        if(!signData) {
            showToast('서명을 입력해주세요.');
            toggleLoading(submitBtn, false);
            return;
        }
        const now = new Date();
        (async () => {
            try {
                const res = await fetch('/.netlify/functions/submit-signature', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, ssn, signData })
                });
                const result = await res.json().catch(() => ({}));
                if (!res.ok || result.error) {
                    console.error('Sign submit failed', result);
                    showToast('서명 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
                    return;
                }
                // 로컬에도 반영
                data.signatures = data.signatures || [];
                data.signatures.unshift({
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
            } catch (err) {
                console.error('Sign submit error', err);
                showToast('서명 저장에 실패했습니다. 네트워크를 확인해주세요.');
            } finally {
                toggleLoading(submitBtn, false);
            }
        })();
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
            if (signSavedIndicator) {
                signSavedIndicator.textContent = '서명 미저장';
                signSavedIndicator.classList.remove('text-primary');
                signSavedIndicator.classList.add('text-gray-500');
            }
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
        if (signSavedIndicator) {
            signSavedIndicator.textContent = '서명 저장 완료';
            signSavedIndicator.classList.remove('text-gray-500');
            signSavedIndicator.classList.add('text-primary');
        }
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

    const openDonateModal = (link, type = 'regular') => {
        ACTIVE_DONATE_LINK = link || data.settings?.donateMainUrl || data.settings?.donateHappyUrl || '';
        ACTIVE_DONATE_TYPE = type;
        sessionStorage.setItem('tbfa_donate_auth_ok', 'false');
        updateAccountVisibility(false);
        if (donateModal) {
            donateModal.classList.remove('hidden');
            requestAnimationFrame(() => donateModal.classList.add('opacity-100', 'flex'));
            document.body.classList.add('modal-open');
            // 스크롤 초기화 및 포커스 보정
            setTimeout(() => {
                const scroller = donateModal.querySelector('.donate-scroll');
                if (scroller) scroller.scrollTop = 0;
                const alignFocus = (el) => {
                    if (!scroller || !el) return;
                    const top = el.offsetTop - 24;
                    scroller.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
                };
                donateModal.querySelectorAll(DONATE_FOCUS_SELECTOR).forEach(el => {
                    el.removeEventListener('focus', el.__donateFocusHandler || (()=>{}));
                    const handler = () => alignFocus(el);
                    el.__donateFocusHandler = handler;
                    el.addEventListener('focus', handler);
                });
            }, 50);
        } else if (ACTIVE_DONATE_LINK) {
            window.open(ACTIVE_DONATE_LINK, '_blank');
        }
    };

    const mainDonateBtn = document.getElementById('main-donate-cms-btn');
    if(mainDonateBtn) {
        mainDonateBtn.addEventListener('click', () => {
            openDonateModal(data.settings?.donateMainUrl || data.settings?.donateHappyUrl || '', 'regular');
        });
    }
    const altDonateBtn = document.getElementById('alt-donate-btn');
    if(altDonateBtn) {
        altDonateBtn.addEventListener('click', () => {
            openDonateModal(data.settings?.donateHappyUrl || data.settings?.donateMainUrl || '', 'one-time');
        });
    }
    
    document.getElementById('account-info-box').addEventListener('click', () => {
        const donateAuthOk = sessionStorage.getItem('tbfa_donate_auth_ok') === 'true';
        if (!donateAuthOk) {
            showToast('인증후에 계좌 열람이 가능합니다.');
            return;
        }
        const text = `${data.settings.accountBank} ${data.settings.accountNumber}`;
        copyText(text).then((ok) => {
            if (ok) showToast('계좌번호가 복사되었습니다.');
            else showToast('계좌 복사에 실패했습니다.');
        });
    });

    if (donateForm) {
        const fields = Array.from(donateForm.querySelectorAll('input[type="text"], input[type="tel"]'));
        const terms = document.getElementById('donate-terms');

        // 드래프트 복원
        try {
            const draft = JSON.parse(localStorage.getItem(DONATE_DRAFT_KEY) || '{}');
            fields.forEach(f => { if(draft[f.name]) f.value = draft[f.name]; });
            if (terms && draft.terms) terms.checked = true;
        } catch {}

        const saveDraft = () => {
            const payload = {};
            fields.forEach(f => payload[f.name] = f.value);
            if (terms) payload.terms = terms.checked;
            try { localStorage.setItem(DONATE_DRAFT_KEY, JSON.stringify(payload)); } catch {}
        };
        const validateDonate = () => {
            const filled = fields.every(f => (f.value || '').trim().length > 0);
            const ok = filled && terms && terms.checked;
            if (donateSubmitBtn) {
                donateSubmitBtn.disabled = !ok;
            }
        };
        fields.forEach(f => f.addEventListener('input', () => { saveDraft(); validateDonate(); }));
        if (terms) terms.addEventListener('change', () => { saveDraft(); validateDonate(); });
        validateDonate();

        donateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            sessionStorage.setItem('tbfa_donate_auth_ok', 'false');
            updateAccountVisibility(false);
            toggleLoading(donateSubmitBtn, true, '제출 중...');
            const link = ACTIVE_DONATE_LINK || data.settings?.donateMainUrl || data.settings?.donateHappyUrl || '';
            if (!link) {
                showToast('이동할 후원 URL이 설정되지 않았습니다.');
                toggleLoading(donateSubmitBtn, false);
                return;
            }
            // 제출 데이터 저장 (서버)
            const payload = {};
            const snapshot = donateFields.map((f,i)=>({
                name: (f.name && f.name.trim()) ? f.name.trim() : `field_${i}`,
                label: f.label || ''
            }));
            snapshot.forEach(s => {
                const input = donateForm.querySelector(`[name="${s.name}"]`);
                payload[s.name] = input ? input.value : '';
            });
            try {
                const res = await fetch('/.netlify/functions/submit-donate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ form: payload, fieldsSnapshot: snapshot })
                });
                const result = await res.json().catch(() => ({}));
                if (!res.ok || result.error) {
                    showToast('신청 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
                    toggleLoading(donateSubmitBtn, false);
                    return;
                }
                // 로컬에도 반영
                data.settings.donateSubmissions = data.settings.donateSubmissions || [];
                data.settings.donateSubmissions.unshift({
                    form: payload,
                    fieldsSnapshot: snapshot,
                    timestamp: new Date().toISOString()
                });
                DataStore.save(data);
                window.dispatchEvent(new CustomEvent('dataUpdated', { detail: data }));
                sessionStorage.setItem('tbfa_donate_auth_ok', 'true');
                updateAccountVisibility(true);
                if (donateModal) closeModal('donate-modal');
                if (ACTIVE_DONATE_TYPE === 'one-time') {
                    const modal = document.getElementById('one-time-confirm-modal');
                    const accountText = document.getElementById('one-time-account-text');
                    if (accountText) {
                        accountText.textContent = `${data.settings.accountBank} ${data.settings.accountNumber}`.trim();
                    }
                    if (modal) {
                        modal.classList.remove('hidden');
                        setTimeout(() => modal.classList.add('opacity-100'), 10);
                    }
                    showToast('계좌 복사 버튼을 눌러 복사해주세요.');
                } else {
                    showToast('신청이 접수되었습니다. 후원 페이지로 이동합니다.');
                    // 토스트가 보일 시간을 준 뒤 이동
                    setTimeout(() => {
                        window.open(link, '_blank');
                    }, 1200);
                }
            } catch (err) {
                console.error('Donate submit failed', err);
                sessionStorage.setItem('tbfa_donate_auth_ok', 'false');
                updateAccountVisibility(false);
                showToast('신청 저장에 실패했습니다. 네트워크를 확인해주세요.');
            } finally {
                toggleLoading(donateSubmitBtn, false);
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape') {
            closeModal('poster-modal');
            closeModal('donate-modal');
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
            title.textContent = '일시후원 계좌이체 하기';
            const url = data.settings?.donateHappyUrl || 'http://aq.gy/f/nwor^';
            btn.onclick = () => window.open(url, '_blank');
        }
    };

    const oneTimeCopyBtn = document.getElementById('one-time-copy-btn');
    if (oneTimeCopyBtn) {
        oneTimeCopyBtn.addEventListener('click', () => {
            const data = CURRENT_DATA || DataStore.get();
            const text = `${data.settings.accountBank} ${data.settings.accountNumber}`.trim();
            copyText(text).then((ok) => {
                if (ok) showToast('계좌번호가 복사되었습니다.');
                else showToast('계좌 복사에 실패했습니다.');
            });
        });
    }
    const oneTimeNextBtn = document.getElementById('one-time-next-btn');
    if (oneTimeNextBtn) {
        oneTimeNextBtn.addEventListener('click', () => {
            const link = ACTIVE_DONATE_LINK || data.settings?.donateHappyUrl || data.settings?.donateMainUrl || '';
            if (!link) {
                showToast('이동할 후원 URL이 설정되지 않았습니다.');
                return;
            }
            window.open(link, '_blank');
            closeModal('one-time-confirm-modal');
        });
    }

    window.openResource = (idx) => {
        const data = CURRENT_DATA || DataStore.get();
        const item = data.resources[idx];
        if(!item) return;

        const modal = document.getElementById('resource-modal');
        const container = document.getElementById('res-modal-container');
        document.getElementById('res-modal-title').textContent = item.title;

        const contentContainer = document.getElementById('res-modal-desc');

        // SETTLEMENT 타입: 정산 보고 전체 UI 렌더링
        if(item.type === 'SETTLEMENT') {
            container.classList.remove('max-w-2xl');
            container.classList.add('max-w-7xl');
            contentContainer.classList.remove('prose', 'prose-sm');
            renderSettlementUI(contentContainer, data);
        } else {
            container.classList.remove('max-w-7xl');
            container.classList.add('max-w-2xl');
            contentContainer.classList.add('prose', 'prose-sm');
            contentContainer.innerHTML = item.content;
        }

        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    };

    // 정산 보고 UI 렌더링 함수
    function renderSettlementUI(container, data) {
        const s = data.settlement || { data: [], settings: { totalFund: 0, manualSpent: null, manualRemain: null }, categories: [] };
        const entries = s.data || [];
        const settings = s.settings || { totalFund: 0, manualSpent: null, manualRemain: null };
        const categories = s.categories || [];

        const calculatedExpenses = entries.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
        const totalFund = settings.totalFund || 0;
        const totalExpenses = settings.manualSpent !== null && settings.manualSpent !== undefined ? settings.manualSpent : calculatedExpenses;
        const remainingBalance = settings.manualRemain !== null && settings.manualRemain !== undefined ? settings.manualRemain : (totalFund - totalExpenses);

        const fmt = (v) => new Intl.NumberFormat('ko-KR').format(v);

        // 카테고리별 합산
        const catSummary = {};
        categories.forEach(c => catSummary[c] = 0);
        entries.forEach(item => {
            if(catSummary.hasOwnProperty(item.category)) {
                catSummary[item.category] += (parseInt(item.amount) || 0);
            }
        });

        const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = `
            <div class="space-y-6">
                <!-- Dashboard -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div class="lg:col-span-1 grid grid-cols-1 gap-3">
                        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">총 후원 모금액</p>
                            <h3 class="text-xl font-black text-[#0f172a]">${fmt(totalFund)} <span class="text-xs font-normal text-slate-400 ml-1">KRW</span></h3>
                        </div>
                        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <p class="text-[10px] font-bold text-red-500 uppercase mb-1">누적 집행액</p>
                            <h3 class="text-xl font-black text-red-600">${fmt(totalExpenses)} <span class="text-xs font-normal text-slate-400 ml-1">KRW</span></h3>
                        </div>
                        <div class="bg-[#0f172a] p-5 rounded-2xl shadow-xl">
                            <p class="text-[10px] font-bold text-blue-400 uppercase mb-1">잔여 기금 총액</p>
                            <h3 class="text-xl font-black text-white">${fmt(remainingBalance)} <span class="text-xs font-normal text-slate-500/50 ml-1">KRW</span></h3>
                        </div>
                    </div>
                    <div class="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm min-h-[250px]">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2"><i data-lucide="pie-chart" class="w-4 h-4 text-blue-500"></i> 목적별 집행 현황</h4>
                            <span class="text-[9px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-bold">REAL-TIME DATA</span>
                        </div>
                        <div style="height:200px"><canvas id="settlement-chart"></canvas></div>
                    </div>
                </div>

                <!-- Filter -->
                <div class="flex justify-end">
                    <select id="settlement-filter" class="text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none font-bold">
                        <option value="all">전체 항목 보기</option>
                        ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>

                <!-- Table -->
                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase border-b">
                                <tr>
                                    <th class="px-4 py-3">일자</th>
                                    <th class="px-3 py-3">분류</th>
                                    <th class="px-3 py-3">항목명</th>
                                    <th class="px-3 py-3 text-right">금액</th>
                                    <th class="px-3 py-3 hidden sm:table-cell">수취인</th>
                                    <th class="px-4 py-3 text-center">증빙</th>
                                </tr>
                            </thead>
                            <tbody id="settlement-table-body" class="divide-y text-sm">
                                ${sorted.length === 0 ? '' : sorted.map(item => `
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="px-4 py-4 whitespace-nowrap text-slate-400 font-medium tabular-nums text-xs">${item.date}</td>
                                        <td class="px-3 py-4"><span class="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 truncate max-w-[100px]">${item.category}</span></td>
                                        <td class="px-3 py-4 font-bold text-slate-800 text-xs">${item.item}</td>
                                        <td class="px-3 py-4 text-right font-black text-slate-900 tabular-nums text-xs">${fmt(item.amount)} 원</td>
                                        <td class="px-3 py-4 text-slate-600 font-medium text-xs hidden sm:table-cell">${item.recipient}</td>
                                        <td class="px-4 py-4 text-center">
                                            <button onclick="window._viewSettlementProof('${item.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><i data-lucide="file-text" class="w-4 h-4"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${sorted.length === 0 ? '<div class="py-16 text-center text-slate-300">내역이 없습니다.</div>' : ''}
                </div>
            </div>
        `;

        // 증빙 보기
        window._viewSettlementProof = (id) => {
            const item = entries.find(i => i.id === id);
            if(!item) return;
            const proofModal = document.getElementById('settlement-proof-modal');
            if(!proofModal) {
                // 동적 증빙 모달 생성
                const m = document.createElement('div');
                m.id = 'settlement-proof-modal';
                m.className = 'fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[6000] hidden flex items-center justify-center p-4';
                m.innerHTML = `
                    <div class="bg-white w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div class="p-6 border-b flex justify-between items-center">
                            <h5 id="stl-proof-title" class="font-bold">증빙 자료</h5>
                            <button onclick="document.getElementById('settlement-proof-modal').classList.add('hidden')" class="p-2 bg-slate-100 rounded-lg"><i data-lucide="x" class="w-4 h-4"></i></button>
                        </div>
                        <div id="stl-proof-content" class="p-6 overflow-y-auto"></div>
                    </div>
                `;
                document.body.appendChild(m);
            }
            document.getElementById('stl-proof-title').innerText = `${item.date} | ${item.item}`;
            const content = document.getElementById('stl-proof-content');
            if(item.proofs && item.proofs.length > 0) {
                content.innerHTML = item.proofs.map(p => `<div class="space-y-2 border-b pb-6 last:border-0"><img src="${p}" alt="증빙" class="w-full rounded-lg shadow-sm"></div>`).join('');
            } else {
                content.innerHTML = '<p class="py-16 text-center text-slate-300">증빙 자료가 없습니다.</p>';
            }
            document.getElementById('settlement-proof-modal').classList.remove('hidden');
            if(window.lucide) lucide.createIcons();
        };

        // 필터 이벤트
        const filterEl = document.getElementById('settlement-filter');
        if(filterEl) {
            filterEl.addEventListener('change', () => {
                const val = filterEl.value;
                const filtered = val === 'all' ? sorted : sorted.filter(i => i.category === val);
                const tbody = document.getElementById('settlement-table-body');
                if(!tbody) return;
                tbody.innerHTML = filtered.length === 0 ? '' : filtered.map(item => `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-4 py-4 whitespace-nowrap text-slate-400 font-medium tabular-nums text-xs">${item.date}</td>
                        <td class="px-3 py-4"><span class="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 truncate max-w-[100px]">${item.category}</span></td>
                        <td class="px-3 py-4 font-bold text-slate-800 text-xs">${item.item}</td>
                        <td class="px-3 py-4 text-right font-black text-slate-900 tabular-nums text-xs">${fmt(item.amount)} 원</td>
                        <td class="px-3 py-4 text-slate-600 font-medium text-xs hidden sm:table-cell">${item.recipient}</td>
                        <td class="px-4 py-4 text-center">
                            <button onclick="window._viewSettlementProof('${item.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><i data-lucide="file-text" class="w-4 h-4"></i></button>
                        </td>
                    </tr>
                `).join('');
            });
        }

        // Chart.js 렌더링
        setTimeout(() => {
            const ctx = document.getElementById('settlement-chart');
            if(!ctx || !window.Chart) return;
            const labels = Object.keys(catSummary).map(l => l.includes('.') ? l.split('. ')[1] : l);
            const values = Object.values(catSummary);
            new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: '누적 집행액',
                        data: values,
                        backgroundColor: ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
                        borderRadius: 6,
                        barThickness: 24
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `합계: ${fmt(c.raw)} 원` } } },
                    scales: {
                        x: { beginAtZero: true, ticks: { callback: (v) => v >= 10000 ? (v/10000)+'만' : v } },
                        y: { ticks: { font: { weight: 'bold' } } }
                    }
                }
            });
            if(window.lucide) lucide.createIcons();
        }, 100);
    }

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
        const data = CURRENT_DATA || DataStore.get();
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
            const links = (data.settings?.shareLinks || []).filter(l=>l.url);
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

    window.openSignResource = (idx) => {
        const data = CURRENT_DATA || DataStore.get();
        const item = data.signResources && data.signResources[idx];
        if(!item) return;
        const modal = document.getElementById('resource-modal');
        document.getElementById('res-modal-title').textContent = item.title || '';
        const contentContainer = document.getElementById('res-modal-desc');
        contentContainer.innerHTML = item.content || '';
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

function renderDonateFormFields(data) {
    const container = document.getElementById('donate-form-fields');
    if (!container) return;
    let draft = {};
    try { draft = JSON.parse(localStorage.getItem('donate_form_draft') || '{}'); } catch {}
    const fields = (data.settings?.donateFields || []).map((f,i) => ({
        ...f,
        _name: (f.name && f.name.trim()) ? f.name.trim() : `field_${i}`
    }));
    container.innerHTML = fields.map(f => `
        <div>
            <label class="text-xs text-gray-500">${sanitize(f.label || '')}</label>
            <input type="${f._name === 'phone' ? 'tel' : 'text'}" name="${sanitize(f._name)}" placeholder="${sanitize(f.placeholder || '')}" class="w-full border rounded-lg p-3 bg-gray-50" ${f.required ? 'required' : ''} value="${sanitize(draft[f._name] || '')}">
        </div>
    `).join('');
    // 약관 체크 복원
    const terms = document.getElementById('donate-terms');
    if (terms && draft.terms) terms.checked = true;
}

function applyDonateTerms(data) {
    const box = document.getElementById('donate-terms-content');
    if(!box) return;
    const terms = data.settings?.donateTerms || '';
    box.innerHTML = sanitize(terms || '캠페인 약관이 준비중입니다.').replace(/\n/g, '<br>');
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

function renderStories(data) {
    const container = document.getElementById('story-container');
    if(!container) return;
    const src = data && Array.isArray(data.storyBlocks) ? data.storyBlocks : DataStore.get().storyBlocks || [];
    const blocks = Array.isArray(src) ? src : [];
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

function renderSignResources(data) {
    const grid = document.getElementById('sign-resources-grid');
    if(!grid) return;
    const items = (data.signResources || []);
    if(items.length === 0) {
        grid.innerHTML = '<div class="text-center text-gray-400 py-4 col-span-full">서명 자료가 없습니다.</div>';
        return;
    }
    grid.innerHTML = items.map((r,i)=>`
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer" onclick="window.openSignResource(${i})">
            <div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <i data-lucide="file-text" class="w-6 h-6"></i>
            </div>
            <h4 class="font-bold text-gray-800 mb-1">${sanitize(r.title || '')}</h4>
            <p class="text-xs text-gray-400">${r.type || ''}</p>
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
    if(totalEl) {
        const online = data.signatures?.length || 0;
        const uploaded = data.petitions?.length || 0;
        totalEl.textContent = online + uploaded;
    }
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
            const formatDate = (c) => {
                const src = c.timestamp || c.date || c.time;
                const dt = src ? new Date(src) : null;
                return (dt && !isNaN(dt)) ? dt.toLocaleDateString('ko-KR') : '';
            };
            container.innerHTML = slice.map(c => `
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p class="text-gray-800 mb-2 leading-relaxed">${sanitize(c.text)}</p>
                    ${c.reply && c.reply.text ? `
                        <div class="mt-2 border-l-4 border-gray-200 pl-3 py-2 bg-gray-50 rounded">
                            <div class="text-xs font-bold text-gray-600 mb-1">관리자 답변</div>
                            <div class="text-sm text-gray-700 whitespace-pre-line">${sanitize(c.reply.text)}</div>
                        </div>` : ''}
                    <div class="flex justify-between items-center text-xs text-gray-400 mt-2">
                        <span class="font-bold text-gray-600">${sanitize(c.author)}</span>
                        <span>${formatDate(c)}</span>
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

    const firstBtn = document.getElementById('comments-first');
    const prevBtn = document.getElementById('comments-prev');
    const nextBtn = document.getElementById('comments-next');
    const lastBtn = document.getElementById('comments-last');
    const pagination = document.getElementById('comments-pagination');
    const renderPagination = () => {
        if (!pagination) return;
        pagination.innerHTML = '';
        if (pages <= 1) return;
        const middleCount = 5;
        const addPageBtn = (page) => {
            const btn = document.createElement('button');
            btn.textContent = String(page);
            btn.className = 'border border-gray-300 px-2 py-1 rounded hover:bg-gray-50';
            if (page - 1 === commentPage) {
                btn.classList.add('bg-gray-100', 'text-gray-800');
            }
            btn.addEventListener('click', () => {
                if (commentPage === page - 1) return;
                commentPage = page - 1;
                renderPage(commentPage);
                updateControls();
            });
            pagination.appendChild(btn);
        };
        const addEllipsis = () => {
            const span = document.createElement('span');
            span.textContent = '...';
            span.className = 'px-1 text-gray-400';
            pagination.appendChild(span);
        };
        if (pages <= middleCount + 2) {
            for (let p = 1; p <= pages; p++) addPageBtn(p);
            return;
        }
        addPageBtn(1);
        let start = Math.max(2, (commentPage + 1) - Math.floor(middleCount / 2));
        let end = start + middleCount - 1;
        if (end > pages - 1) {
            end = pages - 1;
            start = Math.max(2, end - middleCount + 1);
        }
        if (start > 2) addEllipsis();
        for (let p = start; p <= end; p++) addPageBtn(p);
        if (end < pages - 1) addEllipsis();
        addPageBtn(pages);
    };
    const updateControls = () => {
        renderPagination();
        const atStart = commentPage === 0;
        const hasPages = pages > 1;
        if (prevBtn) {
            prevBtn.disabled = atStart;
            prevBtn.classList.toggle('opacity-40', atStart);
            prevBtn.classList.toggle('cursor-not-allowed', atStart);
        }
        if (firstBtn) {
            firstBtn.disabled = atStart;
            firstBtn.classList.toggle('opacity-40', atStart);
            firstBtn.classList.toggle('cursor-not-allowed', atStart);
        }
        if (nextBtn) {
            nextBtn.disabled = !hasPages;
            nextBtn.classList.toggle('opacity-40', !hasPages);
            nextBtn.classList.toggle('cursor-not-allowed', !hasPages);
        }
        if (lastBtn) {
            lastBtn.disabled = !hasPages;
            lastBtn.classList.toggle('opacity-40', !hasPages);
            lastBtn.classList.toggle('cursor-not-allowed', !hasPages);
        }
    };
    updateControls();
    if (firstBtn) {
        firstBtn.onclick = () => {
            if (commentPage === 0) return;
            commentPage = 0;
            renderPage(commentPage);
            updateControls();
        };
    }
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (commentPage === 0) return;
            commentPage -= 1;
            renderPage(commentPage);
            updateControls();
        };
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (commentPage >= pages - 1) {
                commentPage = 0;
            } else {
                commentPage += 1;
            }
            renderPage(commentPage);
            updateControls();
        };
    }
    if (lastBtn) {
        lastBtn.onclick = () => {
            if (commentPage === pages - 1) return;
            commentPage = pages - 1;
            renderPage(commentPage);
            updateControls();
        };
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
const toggleLoading = (btn, loading, label) => {
    if (!btn) return;
    const createSpinner = () => {
        const spinner = document.createElement('span');
        spinner.className = 'inline-block w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin';
        return spinner;
    };
    if (loading) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = '';
        btn.append(createSpinner(), document.createTextNode(` ${label || '처리 중...'}`));
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
    } else {
        btn.textContent = btn.dataset.originalText || btn.textContent;
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
};
