const COOKIE_NAMES = ['auth_token', 'ct0', 'twid'];
const DOMAINS = [
  { url: 'https://twitter.com', domain: '.twitter.com' },
  { url: 'https://www.twitter.com', domain: '.twitter.com' },
  { url: 'https://x.com', domain: '.x.com' },
  { url: 'https://www.x.com', domain: '.x.com' },
];

const foundCookies = {};

function maskValue(val) {
  if (!val) return '—';
  if (val.length <= 8) return val.slice(0, 2) + '****';
  return val.slice(0, 8) + '****';
}

function getBadgeEl(name) {
  return document.getElementById('badge-' + name);
}

function getValueEl(name) {
  return document.getElementById('value-' + name);
}

function setCardState(name, status, value, domain) {
  const badge = getBadgeEl(name);
  const valEl = getValueEl(name);

  badge.className = 'status-badge ' + status;
  badge.textContent = status === 'found' ? 'found' : status === 'missing' ? 'missing' : '...';

  if (status === 'found') {
    valEl.textContent = maskValue(value) + (domain ? '  (' + domain + ')' : '');
  } else {
    valEl.textContent = '—';
  }
}

async function getCookie(name) {
  for (const entry of DOMAINS) {
    try {
      const cookie = await chrome.cookies.get({ url: entry.url, name: name });
      if (cookie && cookie.value) {
        return { value: cookie.value, domain: cookie.domain || entry.domain };
      }
    } catch (_) {}
  }
  return null;
}

function getDomainLabel(cookies) {
  const domains = new Set();
  for (const c of cookies) {
    if (c) domains.add(c.domain);
  }
  if (domains.size === 0) return '';
  return 'Cookies from: ' + Array.from(domains).join(', ');
}

async function refreshCookies() {
  let allFound = true;

  for (const name of COOKIE_NAMES) {
    setCardState(name, 'pending');
    const result = await getCookie(name);

    if (result) {
      foundCookies[name] = result;
      setCardState(name, 'found', result.value, result.domain);
    } else {
      foundCookies[name] = null;
      setCardState(name, 'missing');
      allFound = false;
    }
  }

  const domainInfo = document.getElementById('domain-info');
  const foundEntries = COOKIE_NAMES.map(n => foundCookies[n]).filter(Boolean);
  domainInfo.textContent = foundEntries.length > 0
    ? getDomainLabel(foundEntries)
    : 'No cookies found. Are you logged in to X/Twitter?';

  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.disabled = !allFound;

  if (!allFound) {
    downloadBtn.title = 'All three cookies must be present to download';
  } else {
    downloadBtn.title = '';
  }
}

function buildCookieData() {
  const cookies = [];
  for (const name of COOKIE_NAMES) {
    const found = foundCookies[name];
    if (found) {
      cookies.push({
        name: name,
        value: found.value,
        domain: found.domain,
        path: '/'
      });
    }
  }

  if (cookies.length === COOKIE_NAMES.length) {
    const domainInfo = document.getElementById('domain-info');
    domainInfo.textContent = 'Extension uses domain: ' + cookies[0].domain;
  }

  return cookies;
}

function triggerDownload() {
  const data = buildCookieData();
  if (data.length !== COOKIE_NAMES.length) return;

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'cookies.json';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  refreshCookies();

  document.getElementById('download-btn').addEventListener('click', triggerDownload);
});
