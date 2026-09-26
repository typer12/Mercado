// ==========================
// CONFIG
// ==========================
const UTM_STORAGE_KEY = 'utm_params';

// parâmetros permitidos (controle total)
const ALLOWED_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid'
];

// ==========================
// LIMPA VALORES BUGADOS
// ==========================
function cleanValue(value) {
  try {
    value = decodeURIComponent(value);

    // remove sujeira tipo ? dentro do valor
    if (value.includes('?')) value = value.split('?')[0];

    // remove encoding quebrado
    if (value.includes('%3F')) value = value.split('%3F')[0];

    return value;
  } catch {
    return value;
  }
}

// ==========================
// CAPTURA UTMs DA URL
// ==========================
function getParamsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const result = {};

  params.forEach((value, key) => {
    if (!ALLOWED_PARAMS.includes(key)) return;

    result[key] = cleanValue(value);
  });

  return result;
}

// ==========================
// SALVA UTMs (primeira origem vence)
// ==========================
function saveUTMs() {
  const current = getParamsFromUrl();
  const saved = JSON.parse(localStorage.getItem(UTM_STORAGE_KEY) || '{}');

  Object.keys(current).forEach(key => {
    let value = current[key];

    // 🔥 limpa antes de salvar
    value = cleanValue(value);

    if (!saved[key]) {
      saved[key] = value;
    }
  });

  localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(saved));
}

// ==========================
// RECUPERA UTMs
// ==========================
function getUTMs() {
  return JSON.parse(localStorage.getItem(UTM_STORAGE_KEY) || '{}');
}

// ==========================
// APLICA UTMs NOS LINKS (ANTI-DUPLICAÇÃO)
// ==========================
function applyUTMsToLinks() {
  const utms = getUTMs();
  const links = document.querySelectorAll('a:not([data-utm-applied])');

  links.forEach(link => {
    try {
      if (!link.href || link.href.startsWith('javascript:') || link.href.includes('#')) return;

      const url = new URL(link.href, window.location.href);

      Object.keys(utms).forEach(key => {
        const value = utms[key];

        // evita duplicação real
        if (url.searchParams.get(key) === value) return;

        url.searchParams.set(key, value);
      });

      link.href = url.toString();

      // marca como já processado
      link.setAttribute('data-utm-applied', 'true');

    } catch (e) {
      console.warn('Erro ao aplicar UTM:', link.href);
    }
  });
}

// ==========================
// REDIRECT COM UTMs
// ==========================
window.redirectWithParams = function(path) {
  const utms = getUTMs();
  const url = new URL(path, window.location.href);

  Object.keys(utms).forEach(key => {
    let value = utms[key];

    // 🔥 limpeza extra ANTES de aplicar
    try {
      value = decodeURIComponent(value);

      if (value.includes('?')) value = value.split('?')[0];
      if (value.includes('%3F')) value = value.split('%3F')[0];
    } catch {}

    // só aplica se realmente diferente
    if (url.searchParams.get(key) !== value) {
      url.searchParams.set(key, value);
    }
  });

  window.location.href = url.toString();
};

// ==========================
// INIT (RODA UMA VEZ)
// ==========================
(function initUTMSystem() {
  if (window.__utm_initialized__) return;
  window.__utm_initialized__ = true;

  // salva UTMs da entrada
  saveUTMs();

  // aplica nos links quando DOM carregar
  document.addEventListener('DOMContentLoaded', () => {
    applyUTMsToLinks();
  });
})();