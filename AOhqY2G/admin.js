import { State } from './state.js';

const ADMIN_PASSWORD = '01028075242';

function formatInputNumber(value) {
    const num = value.toString().replace(new RegExp('[^0-9]', 'g'), '');
    if (!num) return '';
    return new Intl.NumberFormat('ko-KR').format(num);
}

function parseFormattedNumber(value) {
    return parseInt(value.toString().replace(new RegExp('[^0-9]', 'g'), '')) || 0;
}

document.getElementById('adminLoginBtn').addEventListener('click', () => {
    document.getElementById('loginPrompt').classList.remove('hidden');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
});

document.getElementById('authBtn').addEventListener('click', () => {
    if (document.getElementById('adminPassword').value === ADMIN_PASSWORD) {
        document.getElementById('loginPrompt').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        initAdminPanel();
    } else {
        alert('비밀번호가 올바르지 않습니다.');
    }
});

function initAdminPanel() {
    loadFundSettings();
    renderCategoryManager();
    renderAdminList();
    updateFormCategorySelect();
}

function renderCategoryManager() {
    const categories = State.getCategories();
    const list = document.getElementById('categoryManagerList');
    list.innerHTML = categories.map((cat, index) => `
        <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
            <input type="text" value="${cat}" onchange="window.updateCategoryName(${index}, this.value)" 
                class="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0">
            <button onclick="window.deleteCategory(${index})" class="text-red-400 hover:text-red-600 p-1">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

window.addCategory = () => {
    const cats = State.getCategories();
    cats.push(`신규 카테고리 ${cats.length + 1}`);
    State.saveCategories(cats);
    renderCategoryManager();
    updateFormCategorySelect();
};

window.updateCategoryName = (index, name) => {
    const cats = State.getCategories();
    cats[index] = name;
    State.saveCategories(cats);
    updateFormCategorySelect();
};

window.deleteCategory = (index) => {
    if (confirm('이 카테고리를 삭제하시겠습니까? 관련 지출 내역의 분류가 유지되지 않을 수 있습니다.')) {
        const cats = State.getCategories();
        cats.splice(index, 1);
        State.saveCategories(cats);
        renderCategoryManager();
        updateFormCategorySelect();
    }
};

function updateFormCategorySelect() {
    const cats = State.getCategories();
    const select = document.getElementById('formCategory');
    const filterSelect = document.getElementById('filterCategory');
    
    const options = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    select.innerHTML = options;
    
    const currentFilter = filterSelect.value;
    filterSelect.innerHTML = `<option value="all">전체 항목 보기</option>` + options;
    filterSelect.value = currentFilter;
}

function loadFundSettings() {
    const settings = State.getSettings();
    document.getElementById('fundTotal').value = formatInputNumber(settings.totalFund);
    document.getElementById('fundSpent').value = settings.manualSpent !== null ? formatInputNumber(settings.manualSpent) : '';
    document.getElementById('fundRemain').value = settings.manualRemain !== null ? formatInputNumber(settings.manualRemain) : '';
}

document.getElementById('fundInfoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = {
        totalFund: parseFormattedNumber(document.getElementById('fundTotal').value),
        manualSpent: document.getElementById('fundSpent').value === '' ? null : parseFormattedNumber(document.getElementById('fundSpent').value),
        manualRemain: document.getElementById('fundRemain').value === '' ? null : parseFormattedNumber(document.getElementById('fundRemain').value)
    };
    State.saveSettings(settings);
    alert('기금 기본 정보가 임시 저장되었습니다.');
});

document.getElementById('finalSaveBtn').addEventListener('click', () => {
    State.finalCommit();
    alert('모든 변경사항이 브라우저에 안전하게 최종 저장되었습니다.');
});


document.getElementById('exportJsonBtn').addEventListener('click', () => {
    const data = State.exportFullState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tbfa_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
});

document.getElementById('importJsonBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
});

document.getElementById('importFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target.result);
            if (State.importFullState(json)) {
                alert('데이터가 성공적으로 복구되었습니다. 페이지가 새로고침됩니다.');
                window.location.reload();
            } else {
                alert('데이터 형식이 올바르지 않습니다.');
            }
        } catch (err) {
            alert('파일을 읽는 중 오류가 발생했습니다.');
        }
    };
    reader.readAsText(file);
});


document.getElementById('downloadHtmlBtn').addEventListener('click', async () => {
    const data = State.exportFullState();
    const response = await fetch(window.location.href);
    let htmlContent = await response.text();
    
    const dataScript = `\n<script>window.__INITIAL_DATA__ = ${JSON.stringify(data)};</script>\n`;
    
    if (htmlContent.includes('<head>')) {
        htmlContent = htmlContent.replace('<head>', '<head>' + dataScript);
    } else {
        htmlContent = dataScript + htmlContent;
    }
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settlement_report_with_data.html';
    a.click();
});

const adminForm = document.getElementById('adminForm');
adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    const fileInput = document.getElementById('formImages');
    
    let proofUrls = [];
    if (fileInput.files.length > 0) {
        for (let file of fileInput.files) {
            if (file.size > 2 * 1024 * 1024) {
                alert(`파일(${file.name}) 용량이 너무 큽니다. 2MB 이하의 이미지만 권장합니다.`);
                return;
            }
            const base64 = await toBase64(file);
            proofUrls.push(base64);
        }
    } else if (editId) {
        const existing = State.getData().find(i => i.id === editId);
        if (existing) proofUrls = existing.proofs || [];
    }

    const entry = {
        id: editId || Date.now().toString(),
        date: document.getElementById('formDate').value,
        category: document.getElementById('formCategory').value,
        item: document.getElementById('formItem').value,
        amount: parseFormattedNumber(document.getElementById('formAmount').value),
        recipient: document.getElementById('formRecipient').value,
        proofs: proofUrls
    };
    
    let currentData = State.getData();
    if (editId) {
        currentData = currentData.map(i => i.id === editId ? entry : i);
    } else {
        currentData.push(entry);
    }

    State.saveData(currentData);
    adminForm.reset();
    document.getElementById('editId').value = '';
    document.getElementById('imageEditIndicator').classList.add('hidden');
    document.getElementById('fileStatus').innerText = '파일을 클릭하거나 드래그하세요';
    renderAdminList();
    alert('내역이 업데이트되었습니다.');
});

function renderAdminList() {
    const data = State.getData();
    const list = document.getElementById('adminList');
    
    if (data.length === 0) {
        list.innerHTML = '<div class="col-span-full py-10 text-center text-slate-400">내역이 없습니다.</div>';
        return;
    }

    list.innerHTML = data.sort((a, b) => new Date(b.date) - new Date(a.date)).map(item => `
        <div class="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center group">
            <div class="truncate mr-4">
                <div class="text-[10px] text-slate-400 font-bold">${item.date} | ${item.category}</div>
                <div class="font-bold text-slate-800 text-sm truncate">${item.item}</div>
                <div class="text-blue-600 font-black text-xs">${formatInputNumber(item.amount)}원</div>
            </div>
            <div class="flex gap-1 shrink-0">
                <button onclick="window.editEntry('${item.id}')" class="p-2 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                <button onclick="window.deleteEntry('${item.id}')" class="p-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

window.editEntry = (id) => {
    const item = State.getData().find(i => i.id === id);
    if (!item) return;
    document.getElementById('editId').value = item.id;
    document.getElementById('formDate').value = item.date;
    document.getElementById('formCategory').value = item.category;
    document.getElementById('formItem').value = item.item;
    document.getElementById('formAmount').value = formatInputNumber(item.amount);
    document.getElementById('formRecipient').value = item.recipient;
    document.getElementById('imageEditIndicator').classList.remove('hidden');
    document.querySelector('#adminPanel .overflow-y-auto').scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteEntry = (id) => {
    if (confirm('정말로 삭제하시겠습니까?')) {
        State.saveData(State.getData().filter(i => i.id !== id));
        renderAdminList();
    }
};

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

['fundTotal', 'fundSpent', 'fundRemain', 'formAmount'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
        const val = e.target.value;
        e.target.value = formatInputNumber(val);
    });
});
