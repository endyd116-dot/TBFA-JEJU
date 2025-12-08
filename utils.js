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

// 입력 value/속성에 쓸 때 HTML을 제거하고 따옴표까지 엔티티로 변환
export const sanitizeAttr = (str) => {
    if (typeof str !== 'string') return '';
    if (window.DOMPurify) {
        const cleaned = window.DOMPurify.sanitize(str);
        // 엔티티 변환 순서: & 먼저 처리 후 < > "
        return cleaned
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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

export const randomThanks = (() => {
    const messages = [
        "마음 깊이 감사드립니다.",
        "함께해주셔서 큰 힘이 됩니다.",
        "따뜻한 응원 고맙습니다.",
        "소중한 마음 잊지 않겠습니다.",
        "정말 든든합니다, 감사합니다.",
        "함께라서 용기가 납니다.",
        "따뜻한 손길 고맙습니다.",
        "힘이 되는 후원 감사합니다.",
        "귀한 마음에 감사드려요.",
        "큰 위로가 됩니다. 고맙습니다.",
        "응원 덕분에 나아갑니다.",
        "힘을 보태주셔서 감사합니다.",
        "진심 어린 후원에 감사드립니다.",
        "따뜻한 연대에 감사해요.",
        "희망을 나눠주셔서 고맙습니다.",
        "함께 싸워주셔서 감사합니다.",
        "깊은 감사의 마음 전합니다.",
        "든든한 응원 감사합니다.",
        "함께 걸어주셔서 고맙습니다.",
        "따뜻한 관심에 감사해요.",
        "소중한 후원, 고맙습니다.",
        "큰 힘이 되어주셔서 감사합니다.",
        "믿어주셔서 감사합니다.",
        "연대의 마음에 감사드립니다.",
        "격려해주셔서 감사합니다.",
        "응원해주셔서 힘이 납니다.",
        "후원해주셔서 진심으로 감사합니다.",
        "희망을 주셔서 고맙습니다.",
        "마음을 모아주셔서 감사합니다.",
        "변화를 믿어주셔서 감사합니다."
    ];
    return () => messages[Math.floor(Math.random() * messages.length)];
})();
