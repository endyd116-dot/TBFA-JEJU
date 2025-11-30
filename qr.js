export const QR = {
    generate(elementId, url = window.location.href) {
        const container = document.getElementById(elementId);
        if (!container) return;
        

        container.innerHTML = '';
        
        try {
            new QRCode(container, {
                text: url,
                width: 128,
                height: 128,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        } catch (e) {
            console.error("QR Code generation failed", e);
            container.textContent = "QR 생성 오류";
        }
    }
};
