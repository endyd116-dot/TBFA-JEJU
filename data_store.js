export const DataStore = {
    _cache: null,
    get() {
        return this._cache || this.init();
    },
    async loadRemote() {
        const existing = this._cache;

        try {
            const res = await fetch('/.netlify/functions/data', { cache: 'no-store' });
            if (!res.ok) throw new Error('remote fetch failed');
            const remote = await res.json();
            if (remote && remote.hero && remote.settings) {
                this._cache = remote;
                return remote;
            }
            if (existing) return existing;
        } catch (err) {
            console.warn('Remote load failed, using local/default', err);
            if (existing) return existing;
        }
        return this.init();
    },
    save(data) {
        this._cache = data;
        // try to persist remotely if admin token present
        const token = sessionStorage.getItem('tbfa_admin_token') || '';
        if (token) {
            fetch('/.netlify/functions/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            }).then(res => {
                if (res.status === 401) {
                    sessionStorage.removeItem('tbfa_admin_token');
                    sessionStorage.removeItem('tbfa_admin_session');
                    alert('관리자 권한이 만료되었습니다. 다시 로그인해주세요.');
                    window.location.href = '/';
                    return;
                }
                if (!res.ok) throw new Error('remote save failed');
            }).catch(err => {
                console.warn('Remote save failed', err);
            });
        }
    },
    reset() {
        this._cache = null;
        return this.init();
    },
    init() {
        const defaultData = {
            hero: {
                title: "선생님의 명예 회복과<br>남겨진 가족을 위해",
                subtitle: "제주중학교 사건 故 현승준 선생님의 억울함을 알리고<br>유가족의 생계와 치유를 지원합니다.",
                image: "",
                overlay: `"하루아침에 남편이 떠나고,<br>아이들의 치료비조차 막막합니다."`
            },
            storyBlocks: [
                {
                    title: "20년의 헌신, 그리고 멈춰버린 시간",
                    content: `현승준 선생님은 제주대학교 사범대를 졸업하고 약 20년간 교단에 섰습니다. 밤낮없이 학생들과 소통하고 학부모들과의 상담을 이어가던 열정적인 교육자였습니다.<br><br>"한 아이도 포기하지 않겠다"던 교육 철학으로 2025년 3학년 부장을 맡아 학교에 나오지 않는 제자들을 끝까지 바른 길로 인도하려 애썼습니다. 하지만 그토록 사랑했던 교정은 그가 마지막 숨을 거둔 장소가 되고 말았습니다.`,
                    image: "https://r2.flowith.net/files/jpeg/YRBIR-teacher_hyun_seung_jun_family_support_campaign_poster_index_1@1024x1024.jpeg",
                    position: "right",
                    bg: "#f3f4f6"
                },
                {
                    title: "멈추지 않았던 알림음과 놓쳐버린 골든타임",
                    content: `2025년 3월, 생활지도 과정에서 시작된 악성 민원은 밤낮을 가리지 않았습니다. 지속적인 인격 모독과 결정적인 악성 문자는 20년 베테랑 교사의 삶을 무너뜨렸습니다.<br><br>2025.05.20 17:04 보호자로부터 결정적인 악성 문자 수신<br>2025.05.22 00:46 학교 창고에서 숨진 채 발견 (골든타임 상실)`,
                    image: "",
                    position: "left",
                    bg: "#f3f4f6"
                },
                {
                    title: `"아빠의 명예라도 지켜주세요"`,
                    content: `남겨진 아내와 어린 두 자녀의 시간은 5월 22일에 멈춰있습니다. 아이들은 엄마마저 사라질까 불안에 떨고 있으며, 가장의 부재로 인해 가계 소득은 전무한 상태입니다.<br><br>사건 발생 5개월이 지났음에도 교육청의 지원은 없었습니다. 유가족은 경제적 빈곤과 트라우마라는 이중고 속에서 "가해자 없는 부실 조사"에 맞서 싸우고 있습니다.`,
                    image: "https://r2.flowith.net/files/jpeg/5QNVJ-korean_family_grief_scene_index_0@1024x1024.jpeg",
                    position: "right",
                    bg: "#f3f4f6"
                }
            ],
            promises: [
                { icon: 'scale', title: '진상 규명', desc: '변호사 선임 및 법적 대응을 통해 억울함을 밝히겠습니다.' },
                { icon: 'home', title: '생계 지원', desc: '긴급 생계비와 주거 안정을 위해 후원금을 사용합니다.' },
                { icon: 'graduation-cap', title: '학업 지속', desc: '두 자녀가 학업을 포기하지 않도록 교육비를 지원합니다.' }
            ],
            settings: {
                targetAmount: 200000000,
                baseAmount: 12500000,
                footerDesc: "본 캠페인은 교사유가족협의회에서 운영하며,<br>모금된 후원금은 전액 유가족에게 전달됩니다.",
                footerPhone: "010-7151-6993",
                footerEmail: "support@email.com",
                accountOwner: "유가족대표",
                accountBank: "농협",
                accountNumber: "351-1234-5678-90",
                sectionOrder: ['hero','story','promises','plan','resources','posters','community','sign','donate'],
                hiddenSections: [],
                musicUrl: "",
                logoUrl: "",
                siteTitle: "교사유가족협의회",
                siteSubtitle: "Teacher's Family Association",
                shareLinks: [
                    { label: "네이버 블로그", url: "https://blog.naver.com" }
                ],
                petitionFormUrl: "",
                petitionEmail: "",
                smtpHost: "",
                smtpPort: "",
                smtpUser: "",
                smtpPass: "",
                fromEmail: "",
                donateMainUrl: "",
                donateKakaoUrl: "https://qr.kakaopay.com/Ej8e5jZ",
                donateHappyUrl: "https://happybean.naver.com",
                donateImage: ""
            },
            flowTexts: {
                storyTitle: "우리가 기억해야 할 이야기",
                storyDesc: "교사와 가족에게 일어난 사건의 흐름을 함께 확인해 주세요.",
                missionTitle: "가족을 지키는 3가지 약속",
                missionDesc: "함께 모은 정성과 후원금이 유가족의 생계와 명예회복에 직접 쓰입니다.",
                planTitle: "세부 후원 계획",
                planDesc: "운영비는 0원이며, 전액 가족 지원에 사용됩니다.",
                resourcesTitle: "행사 자료 패키지",
                resourcesDesc: "투명한 운영을 위한 모든 자료를 확인하세요.",
                postersTitle: "캠페인 포스터 갤러리",
                postersDesc: "이미지를 클릭하여 QR과 함께 공유하세요.",
                commentsTitle: "응원의 한마디",
                commentsNote: "관리자 승인 후 노출",
                donateTitle: "당신의 손길이<br>가족의 내일이 됩니다"
            },
            donations: [
                { name: "김철수", amount: 50000, aiMsg: "힘내세요", date: "2025-11-28", timestamp: "2025-11-28T12:00:00Z" },
                { name: "익명", amount: 100000, aiMsg: "응원합니다", date: "2025-11-27", timestamp: "2025-11-27T12:00:00Z" },
                { name: "박영희", amount: 30000, aiMsg: "정의가 승리하길", date: "2025-11-26", timestamp: "2025-11-26T12:00:00Z" }
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
            signatures: [],
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
            signResources: [],
            posters: [
                { title: "거리 캠페인용", url: "", link: "https://example.com/support", qr: "" },
                { title: "SNS 공유용", url: "", link: "https://example.com/support", qr: "" },
                { title: "추모 포스터", url: "", link: "https://example.com/support", qr: "" },
                { title: "모금 안내", url: "", link: "https://example.com/support", qr: "" }
            ]
        };
        this.save(defaultData);
        return defaultData;
    }
};
