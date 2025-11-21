/**
 * data_store.js
 * 데이터 중앙 관리, 초기 콘텐츠(스토리/계획서) 설정, 방문자 통계 로직(IP 중복 방지)
 */

const IMG_DEFAULT = "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80"; // Default Background
const IMG_MOM = "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&q=80"; // 40s Korean Mom concept (Sad/Struggle)
const IMG_POSTER = "https://images.unsplash.com/photo-1555881400-74d7acaacd81?auto=format&fit=crop&q=80"; // Poster concept


const ADMIN_PW_HASH = "f52fbd32b2b3b86ff88ef6c49062d285f22a96362e26444f7f8f980397767533";

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const defaultContent = {
    meta: {
        title: "제주중학교 사건 유가족 후원 - 교사유가족협의회",
        description: "선생님의 억울한 죽음과 남겨진 가족들의 생계를 위한 후원에 동참해주세요.",
        publishDate: null, // ISO String for scheduled release
        adminPhone: "01028075242",
        adminPwHash: ADMIN_PW_HASH
    },
    sections: {
        story: "기억해야 할 이야기",
        mission: "우리의 3가지 약속",
        posters: "함께 나누는 마음",
        plan: "후원 참여 안내"
    },
    hero: {
        title: "멈춰버린 시간, 남겨진 가족을 위해",
        subtitle: "학교 폭력 문제 해결을 위해 홀로 싸우다 떠나신 선생님. 그 억울한 죽음 뒤, 남겨진 아내와 두 아이에게는 당신의 따뜻한 손길이 절실합니다.",
        targetAmount: 50000000, // 5천만원
        currentAmount: 12500000
    },
    story: [
        {
            id: "reality-1",
            step: "REALITY",
            title: "비극의 전말: 선생님을 죽음으로 내몬 조롱과 외면",
            content: `제주중학교 고 현승준 선생님은 학교 폭력 없는 교실을 만들기 위해 백방으로 뛰던 참된 교육자였습니다. 하지만 돌아온 것은 학교와 시스템의 철저한 외면이었습니다.\n\n\"당신이 선생 자격이 있어?\", \"교육청에 신고해서 옷 벗게 하겠다\"는 학부모의 조롱 섞인 문자와 악성 민원은 밤낮없이 선생님의 숨통을 조여왔습니다. 선생님은 문제를 해결하기 위해 최선을 다했지만, 아무도 그의 목소리를 들어주지 않았습니다. 결국 고립된 선생님은 견딜 수 없는 고통 속에서 생을 마감하는 비극적인 선택을 할 수밖에 없었습니다. 이것은 자살이 아닌 사회적 타살입니다.`,
            image: IMG_POSTER
        },
        {
            id: "reality-2",
            step: "THE AFTERMATH",
            title: "남겨진 현실: 멈춰버린 시간 속 가족들의 비명",
            content: `선생님이 떠난 후, 단란했던 가정은 지옥으로 변했습니다. 평소 집안일을 도맡아 해주던 자상한 남편이 사라지자 집안은 순식간에 난장판이 되었습니다. 빨래는 산더미처럼 쌓이고, 아이들의 식사를 챙기는 것조차 버겁습니다.\n\n40대 초반의 아내는 하루에도 수십 번씩 쓰러지고 싶은 충동을 느낍니다. 극심한 스트레스로 인한 이명과 두통, 공황장애로 정신과 약 없이는 단 하루도 버틸 수 없습니다. 하지만 \"엄마, 배고파\"라고 말하는 아이들의 눈망울 때문에 억지로 몸을 일으킵니다.\n\n설상가상으로 경제적 위기까지 닥쳤습니다. 아빠를 잃은 불안감에 시달리는 둘째 아이는 심리치료가 시급하지만, 당장의 생활비가 부족해 치료를 중단해야 했습니다. \"돈 때문에 내 아이를 치료하지 못한다\"는 죄책감은 아내의 가슴을 매일같이 후벼 팝니다.`,
            image: IMG_MOM
        },
        {
            id: "mission",
            step: "MISSION",
            title: "우리의 3가지 약속: 유가족을 위한 실질적 지원",
            content: `교사유가족협의회는 여러분의 후원금을 운영비를 제외한 전액, 유가족에게 전달합니다.\n\n1. **법률·행정 지원**: 순직 인정을 위한 행정 소송과 변호사 비용을 전액 지원하여 선생님의 억울함을 반드시 풀겠습니다.\n2. **심리·정신과 치료**: 아내와 두 아이가 경제적 걱정 없이 전문적인 심리 치료를 받을 수 있도록 장기적으로 지원합니다.\n3. **긴급 생계 지원**: 가장의 부재로 인한 당장의 생활고를 해결하고, 아이들이 학업을 포기하지 않도록 생계비를 지원합니다.`,
            image: IMG_DEFAULT
        },
        {
            id: "epilogue",
            step: "EPILOGUE",
            title: "다시 피어날 희망을 심어주세요",
            content: `우리의 연대는 단순한 기부를 넘어섭니다. 이 가족에게 \"당신들은 혼자가 아닙니다\"라고 말해주는 가장 강력한 위로이자, 정의입니다.\n\n언젠가 아내와 아이들이 아빠와의 행복했던 추억을 떠올리며 다시 웃을 수 있도록, 무너진 일상을 일으켜 세워주세요. 여러분의 작은 관심이 한 가족의 우주를 구원할 수 있습니다.`,
            image: IMG_DEFAULT
        }
    ],
    posters: [
        { src: IMG_POSTER, title: "제주중학교 사건 유가족을 도울 수 있는 페이지" },
        { src: IMG_POSTER, title: "제주중학교 사건 유가족을 도울 수 있는 페이지" },
        { src: IMG_POSTER, title: "제주중학교 사건 유가족을 도울 수 있는 페이지" },
        { src: IMG_POSTER, title: "제주중학교 사건 유가족을 도울 수 있는 페이지" }
    ],
    docs: {
        plan: `
# 상세 후원 계획서

### 1. 사업 개요
본 프로젝트는 제주중학교 사건으로 고통받는 유가족의 **법적 권리 회복**, **심리적 치유**, **경제적 자립**을 지원하기 위한 긴급 모금 캠페인입니다.

### 2. 세부 전략
1.  **법률 지원 (Justice)**
    *   전문 변호인단 선임 및 순직 인정을 위한 행정 소송 진행
    *   악성 민원인에 대한 법적 대응 검토 및 지원
2.  **심리 케어 (Healing)**
    *   유가족 전원 주 1회 이상 심리 상담 제공 (아내, 자녀 2명)
    *   **중단된 둘째 자녀의 놀이 치료 즉시 재개 및 장기 지원**
3.  **생활 안정 (Livelihood)**
    *   긴급 생계비 및 자녀 교육비 매월 정액 지원
    *   부채 상환 등 긴급한 재정 문제 해결 지원

### 3. 투명성 확보
*   운영비를 제외한 **전액**이 유가족에게 전달됩니다.
*   매월 1일, 홈페이지를 통해 기부금 사용 내역을 상세히 공개합니다.

### 4. 목표 금액
**총 {{TARGET_AMOUNT}}원**
        `,
        budget: `
# 예산 배분 계획 (총 목표액: {{TARGET_AMOUNT}}원)

| 항목 | 비율 | 비고 |
|:---:|:---:|:---|
| **법률/행정비** | 40% | 변호사 선임, 소송 인지대, 공증비 |
| **심리 치료비** | 30% | 가족 3인 장기 심리 상담, 병원 진료비 |
| **긴급 생계비** | 20% | 당장의 생활비, 공과금, 자녀 학비 |
| **운영비** | 10% | 홍보물 제작, 서버/도메인 비용, 발송비 |

### 💡 운영비 관련 안내
운영비(10%)는 본 캠페인을 널리 알리기 위한 최소한의 실비(홍보물, 서버 등)로만 사용됩니다. 집행 후 남은 운영비 잔액은 **전액 유가족 생계비로 추가 전달**됩니다. 후원자님의 소중한 마음이 헛되이 쓰이지 않도록 철저히 관리하겠습니다.
        `
    }
};

function getTodayDate() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function initStats() {
    let stats = JSON.parse(localStorage.getItem('tbfa_stats_v4'));
    if (!stats) {
        stats = {
            globalIps: [], // 전체 기간 유니크 IP
            totalVisits: 0,
            daily: {} // YYYY-MM-DD: { visits, ips, mobile, search }
        };
        localStorage.setItem('tbfa_stats_v4', JSON.stringify(stats));
    }
    return stats;
}

export const store = {
    getData: () => {
        const saved = localStorage.getItem('tbfa_content');
        return saved ? JSON.parse(saved) : defaultContent;
    },
    saveData: (data) => {
        localStorage.setItem('tbfa_content', JSON.stringify(data));
        window.dispatchEvent(new Event('contentUpdated'));
    },
    reset: () => {
        if(confirm("정말로 모든 데이터를 초기화하시겠습니까?")) {
            localStorage.removeItem('tbfa_content');
            localStorage.removeItem('tbfa_stats_v4');
            window.location.reload();
        }
    },
    parseDoc: (text, data) => {
        return text.replace(/{{TARGET_AMOUNT}}/g, data.hero.targetAmount.toLocaleString());
    },
    hashPassword: sha256,
    
    trackVisit: async () => {

        if (window.location.hash === '#admin' || sessionStorage.getItem('tbfa_admin_session')) return;

        let ip = 'unknown';
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            ip = data.ip;
        } catch (e) {

            let sid = sessionStorage.getItem('tbfa_sid');
            if(!sid) {
                sid = Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('tbfa_sid', sid);
            }
            ip = 'session-' + sid;
        }

        const stats = initStats();
        const today = getTodayDate();
        let updated = false;


        if (!stats.globalIps.includes(ip)) {
            stats.globalIps.push(ip);
            stats.totalVisits++;
            updated = true;
        }


        if (!stats.daily[today]) {
            stats.daily[today] = {
                visits: 0,
                ips: [],
                mobile: 0,
                search: 0
            };
        }

        const daily = stats.daily[today];
        if (!daily.ips.includes(ip)) {
            daily.ips.push(ip);
            daily.visits++;
            
            const isMobile = /Mobi|Android/i.test(navigator.userAgent);
            if (isMobile) daily.mobile++;

            const ref = document.referrer.toLowerCase();
            if (ref.includes('naver') || ref.includes('google')) daily.search++;
            
            updated = true;
        }

        if (updated) {
            localStorage.setItem('tbfa_stats_v4', JSON.stringify(stats));
        }
    },

    getAnalytics: (period = 'daily') => {
        let stats = initStats();
        if (stats.totalVisits === 0) {
            store.seedDemoData();
            stats = initStats();
        }

        const result = {
            total: stats.totalVisits,
            today: stats.daily[getTodayDate()]?.visits || 0,
            chart: { labels: [], data: [] },
            deviceRatio: { mobile: 0, pc: 0 },
            table: []
        };

        const dates = Object.keys(stats.daily).sort();
        

        const aggMap = {};
        
        dates.forEach(date => {
            const dVal = stats.daily[date];
            let key = date;
            if(period === 'monthly') key = date.slice(0, 7); // YYYY-MM
            if(period === 'yearly') key = date.slice(0, 4); // YYYY

            if(!aggMap[key]) aggMap[key] = { visits: 0, mobile: 0, search: 0 };
            
            aggMap[key].visits += dVal.visits;
            aggMap[key].mobile += dVal.mobile;
            aggMap[key].search += dVal.search;

            result.deviceRatio.mobile += dVal.mobile;
            result.deviceRatio.pc += (dVal.visits - dVal.mobile);
        });

        const aggKeys = Object.keys(aggMap).sort();
        const limit = period === 'daily' ? 30 : 12;
        const sliceKeys = aggKeys.slice(-limit);

        result.chart.labels = sliceKeys;
        result.chart.data = sliceKeys.map(k => aggMap[k].visits);
        result.table = sliceKeys.reverse().map(k => ({
            date: k,
            visits: aggMap[k].visits,
            mobile: aggMap[k].mobile,
            search: aggMap[k].search
        }));

        return result;
    },

    seedDemoData: () => {
        const stats = { globalIps: [], totalVisits: 0, daily: {} };
        const end = new Date();
        for (let i = 60; i >= 0; i--) {
            const d = new Date();
            d.setDate(end.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = Math.floor(Math.random() * 100) + 20;
            const mobile = Math.floor(count * 0.7);
            
            stats.daily[dateStr] = {
                visits: count,
                ips: Array(count).fill('mock'),
                mobile: mobile,
                search: Math.floor(count * 0.4)
            };
            stats.totalVisits += Math.floor(count * 0.3); // simple accum
        }
        localStorage.setItem('tbfa_stats_v4', JSON.stringify(stats));
    }
};
