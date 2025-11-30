export const DataStore = {
    get() {
        const data = localStorage.getItem('tbfa_data');
        if (data) {
            return JSON.parse(data);
        }
        return this.init();
    },
    save(data) {
        localStorage.setItem('tbfa_data', JSON.stringify(data));
    },
    reset() {
        localStorage.removeItem('tbfa_data');
        return this.init();
    },
    init() {
        const defaultData = {
            hero: {
                title: "선생님의 명예 회복과<br>남겨진 가족을 위해",
                subtitle: "제주중학교 사건 故 현승준 선생님의 억울함을 알리고<br>유가족의 생계와 치유를 지원합니다."
            },
            settings: {
                targetAmount: 200000000,
                baseAmount: 12500000,
                footerDesc: "본 캠페인은 교사유가족협의회에서 운영하며,<br>모금된 후원금은 전액 유가족에게 전달됩니다.",
                accountOwner: "유가족대표",
                accountBank: "농협",
                accountNumber: "351-1234-5678-90"
            },
            donations: [
                { name: "김철수", amount: 50000, aiMsg: "힘내세요", date: "2025-11-28" },
                { name: "익명", amount: 100000, aiMsg: "응원합니다", date: "2025-11-27" },
                { name: "박영희", amount: 30000, aiMsg: "정의가 승리하길", date: "2025-11-26" }
            ],
            budget: [
                { label: "생활 안정", value: 40, color: "#FF6384" },
                { label: "법률/명예회복", value: 30, color: "#36A2EB" },
                { label: "치유 지원", value: 20, color: "#FFCE56" },
                { label: "자녀 교육", value: 10, color: "#4BC0C0" }
            ],
            comments: [
                { 
                    text: "끝까지 함께하겠습니다. 힘내세요.", 
                    author: "시민1", 
                    approved: true, 
                    date: "2025-11-20", 
                    time: "14:30:00",
                    device: "Mobile",
                    ip: "211.34.12.156" 
                },
                { 
                    text: "진실은 반드시 밝혀집니다.", 
                    author: "동료교사", 
                    approved: true, 
                    date: "2025-11-22",
                    time: "09:15:22",
                    device: "Desktop",
                    ip: "58.123.45.67"
                }
            ],
            petitions: [],
            stats: [],
            resources: [
                { 
                    id: "letter",
                    title: "제주유가족 아내의 편지", 
                    type: "LETTER", 
                    content: `<div class="popup-content story-letter">
    <div class="letter-header">
        <h3>📨 하늘로 보내는 편지</h3>
        <span class="date">2025. 05. 30</span>
    </div>
    <div class="letter-body">
        <p>"남편 현승준 선생님의 이야기가 너무 빨리 잊혀질까 두렵습니다."</p>
        <p>
            집에서도 밤낮없이 학생들과 소통하려 했던 사람, 
            그렇게 열정적인 사람도 악성 민원을 피할 길은 없었습니다.
            남편이 떠난 후 우리 가족의 삶은 완전히 무너졌습니다.
            아이들은 아빠를 찾으며 불안에 떨고 있습니다.
        </p>
        <blockquote class="highlight-quote">
            "단 하나, 남편에게 마지막으로 해주고 싶은 것이 있다면 
            <strong>'현승준'이라는 명예로운 이름</strong>을 지켜주고 싶습니다.
            남아있는 두 아이에게 자랑스러운 아빠의 이름을 남겨주고 싶습니다."
        </blockquote>
        <p class="letter-footer">- 故 현승준 교사의 아내 드림 -</p>
    </div>
</div>`
                },
                { 
                    id: "budget",
                    title: "후원금 사용 계획서", 
                    type: "PLAN", 
                    content: `<div class="popup-content donation-plan">
    <h3>💰 후원금 사용 계획</h3>
    <p class="plan-summary">교육청의 지원 부재 속, 유가족의 생계와 명예 회복을 위해 사용됩니다.</p>
    
    <div class="fund-goal">
        <span class="label">목표 모금액</span>
        <span class="amount">200,000,000원</span>
    </div>

    <ul class="budget-breakdown">
        <li>
            <div class="item-info">
                <strong>생활 안정 자금 (40%)</strong>
                <span>가장의 부재 및 아내의 휴직으로 인한 긴급 생계비</span>
            </div>
            <div class="progress-bar"><div style="width: 40%;"></div></div>
        </li>
        <li>
            <div class="item-info">
                <strong>법률 및 명예회복 (30%)</strong>
                <span>순직 인정 소송 비용 및 진상규명 법률 자문</span>
            </div>
            <div class="progress-bar"><div style="width: 30%;"></div></div>
        </li>
        <li>
            <div class="item-info">
                <strong>유가족 치유 지원 (20%)</strong>
                <span>아내와 두 자녀의 장기 심리상담 및 트라우마 치료</span>
            </div>
            <div class="progress-bar"><div style="width: 20%;"></div></div>
        </li>
        <li>
            <div class="item-info">
                <strong>자녀 교육비 (10%)</strong>
                <span>남겨진 두 자녀의 학업 유지를 위한 장학 기금</span>
            </div>
            <div class="progress-bar"><div style="width: 10%;"></div></div>
        </li>
    </ul>
    <div class="notice">* 투명한 집행을 위해 회계 법인을 통해 감사를 진행합니다.</div>
</div>`
                },
                { 
                    id: "press",
                    title: "언론 보도 모음집", 
                    type: "PRESS", 
                    content: `<div class="popup-content press-clip">
    <h3>📰 주요 언론 보도</h3>
    <div class="article-list">
        <a href="#" class="article-item">
            <span class="press">시사IN</span>
            <strong class="title">제주를 떠나본 적 없는 한 교육자의 삶과 죽음</strong>
            <span class="desc">"학교는 삶을 인정받는 곳"이라 믿었던 20년차 교사의 마지막 선택...</span>
            <span class="date">2025.05.22</span>
        </a>
        <a href="#" class="article-item">
            <span class="press">뉴시스</span>
            <strong class="title">교사노조 "개인번호 노출이 결정적 원인... 책임 전가 구조"</strong>
            <span class="desc">악성 민원 22분 뒤 번개탄 구매, 시스템의 부재가 부른 참사</span>
            <span class="date">2025.05.26</span>
        </a>
        <a href="#" class="article-item">
            <span class="press">교육언론[창]</span>
            <strong class="title">유가족 "학교가 남편 골든타임 놓쳤다... 가해자 없는 조사"</strong>
            <span class="desc">교육청 진상조사 결과에 유족 강력 반발, 재조사 요구</span>
            <span class="date">2025.10.29</span>
        </a>
        <a href="#" class="article-item">
            <span class="press">제주MBC</span>
            <strong class="title">"원점에서 진상조사 재개하라" 5만 교사 서명 전달</strong>
            <span class="desc">유가족과 시민단체, 특별감사 권한 갖춘 독립 기구 요구</span>
            <span class="date">2025.11.10</span>
        </a>
    </div>
</div>`
                },
                { 
                    id: "status",
                    title: "제주사건 스테이터스", 
                    type: "STATUS", 
                    content: `<div class="popup-content status-board">
    <h3>🚨 사건 진행 현황 (2025.11 기준)</h3>
    
    <div class="status-steps">
        <div class="step completed">
            <div class="icon">✅</div>
            <div class="text">
                <strong>교육활동 침해 인정</strong>
                <span>2025.10.30 교권보호위 결정</span>
            </div>
        </div>
        
        <div class="step processing warning">
            <div class="icon">⚠️</div>
            <div class="text">
                <strong>진상규명 및 감사</strong>
                <span>교육청 조사 불신 -> 유족 '독립조사기구' 요구 중</span>
            </div>
        </div>

        <div class="step pending">
            <div class="icon">⏳</div>
            <div class="text">
                <strong>순직(공무상 재해) 인정</strong>
                <span>인사혁신처 심의 준비 단계 (서명 운동 진행 중)</span>
            </div>
        </div>
    </div>

    <div class="action-call">
        <p>아직 현승준 선생님은 '순직'을 인정받지 못했습니다.<br>여러분의 서명이 필요합니다.</p>
        <button class="btn-sign" onclick="document.querySelector('.modal-close-btn').click(); window.location.hash='community';">순직 인정 서명하기</button>
    </div>
</div>`
                }
            ],
            posters: [
                { title: "거리 캠페인용", url: "https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?auto=format&fit=crop&q=80&w=1000" },
                { title: "SNS 공유용", url: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&q=80&w=1000" },
                { title: "추모 포스터", url: "https://images.unsplash.com/photo-1518644730709-0835105d9daa?auto=format&fit=crop&q=80&w=1000" },
                { title: "모금 안내", url: "https://images.unsplash.com/photo-1532629345422-7515f3d16335?auto=format&fit=crop&q=80&w=1000" }
            ]
        };
        this.save(defaultData);
        return defaultData;
    }
};
