export const formatCurrency = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num);
};

export const showToast = (msg) => {
    const toast = document.getElementById('toast-notification');
    const message = document.getElementById('toast-message');
    if (toast && message) {
        message.textContent = msg;
        toast.classList.remove('opacity-0', '-translate-y-24');
        setTimeout(() => {
            toast.classList.add('opacity-0', '-translate-y-24');
        }, 3000);
    }
};

export const sanitize = (str) => {
    if (typeof str !== 'string') return '';
    if (window.DOMPurify) {
        return window.DOMPurify.sanitize(str);
    }
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
};

export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};
