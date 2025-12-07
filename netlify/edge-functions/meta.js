export default async (request, context) => {
    // Fetch latest data (public GET) from existing function
    let data = {};
    try {
        const apiRes = await fetch(new URL('/.netlify/functions/data', request.url).toString(), { headers: { accept: 'application/json' } });
        if (apiRes.ok) data = await apiRes.json();
    } catch (err) {
        console.warn('Edge meta: data fetch failed', err);
    }

    const hero = data?.hero || {};
    const settings = data?.settings || {};
    const title = stripTags(hero.title) || '컨텐츠 없음';
    const desc = stripTags(hero.subtitle) || '컨텐츠 없음';
    const image = hero.image || settings.donateImage || blankImg;

    const response = await context.next();
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    const html = await response.text();
    const updated = applyMeta(html, { title, desc, image });

    return new Response(updated, {
        status: response.status,
        headers: response.headers
    });
};

const blankImg = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

function stripTags(str) {
    return typeof str === 'string' ? str.replace(/<[^>]*>/g, '').trim() : '';
}

function setMeta(html, selector, content) {
    const regex = new RegExp(`(<meta[^>]+${selector}[^>]+content=\")[^\"]*(\"[^>]*>)`, 'i');
    if (regex.test(html)) {
        return html.replace(regex, `$1${escapeHtml(content)}$2`);
    }
    // Insert before closing head if not present
    return html.replace(/<\/head>/i, `<meta ${selector} content="${escapeHtml(content)}">\n</head>`);
}

function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applyMeta(html, meta) {
    let out = html;
    out = setMeta(out, 'property="og:title"', meta.title);
    out = setMeta(out, 'name="description"', meta.desc);
    out = setMeta(out, 'property="og:description"', meta.desc);
    out = setMeta(out, 'property="og:image"', meta.image || blankImg);
    return out;
}
