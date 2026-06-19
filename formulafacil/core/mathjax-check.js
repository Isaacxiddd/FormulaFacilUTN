const MATHJAX_CDN_PRIMARY = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js';
const MATHJAX_CDN_FALLBACK = 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js';

let typesetTimer = null;

export function verifyMathJaxLoaded() {
  if (typeof MathJax === 'undefined') {
    console.warn('⚠️ MathJax no está cargado. Intentando carga manual...');
    loadMathJaxWithFallback();
    return false;
  }
  return true;
}

export function verifyMathRendering(container) {
  const elements = container
    ? container.querySelectorAll('.formula-content, .formula-expression, .practice-feedback-body')
    : document.querySelectorAll('.formula-content, .formula-expression, .practice-feedback-body');

  if (elements.length === 0) return true;

  let allRendered = true;

  elements.forEach(el => {
    const html = el.innerHTML;
    if (html.includes('\\[') || html.includes('\\(') || html.includes('$$')) {
      const hasMathJaxClass = el.querySelector('.mjx-chtml, .MathJax, mjx-container');
      if (!hasMathJaxClass) {
        console.warn('⚠️ MathJax no renderizó en elemento:', el, html.substring(0, 100));
        allRendered = false;
      }
    }
  });

  return allRendered;
}

export function forceMathJaxTypeset(container) {
  if (typeof MathJax === 'undefined') return;

  if (typesetTimer) {
    clearTimeout(typesetTimer);
  }

  typesetTimer = setTimeout(() => {
    try {
      if (container) {
        MathJax.typesetPromise([container]).catch(err => {
          console.warn('⚠️ MathJax typesetPromise falló en contenedor:', err);
        });
      } else {
        MathJax.typesetPromise().catch(err => {
          console.warn('⚠️ MathJax typesetPromise falló:', err);
        });
      }
    } catch (err) {
      console.warn('⚠️ Error al invocar MathJax.typesetPromise:', err);
    }
  }, 50);
}

export function monitorMathJaxRendering(container, maxRetries = 5) {
  let attempts = 0;
  const check = () => {
    attempts++;
    const ok = verifyMathRendering(container);
    if (ok) {
      console.log('✅ MathJax renderizado correctamente');
      return;
    }
    if (attempts < maxRetries) {
      console.log(`⏳ Reintentando MathJax (${attempts}/${maxRetries})...`);
      forceMathJaxTypeset(container);
      setTimeout(check, 1000);
    } else {
      console.warn('⚠️ MathJax no pudo renderizar después de varios intentos');
      showMathJaxFallback(container);
    }
  };
  setTimeout(check, 500);
}

export function setupMathJaxObserver() {
  if (typeof MathJax === 'undefined') return null;

  let timeoutId = null;
  const observer = new MutationObserver(() => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      forceMathJaxTypeset();
    }, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
}

function showMathJaxFallback(container) {
  if (!container) container = document;

  const targets = container.querySelectorAll('.formula-content, .formula-expression');
  targets.forEach(el => {
    if (el.querySelector('.mathjax-error')) return;
    const msg = document.createElement('div');
    msg.className = 'mathjax-error';
    msg.style.cssText = 'padding:8px;margin:4px 0;background:#fff3cd;border:1px solid #ffc107;border-radius:6px;color:#856404;font-size:0.85em;text-align:center;';
    msg.textContent = '⚠️ No se pudo renderizar la fórmula. Recargá la página o revisá tu conexión.';
    el.prepend(msg);
  });
}

export function showMathJaxLoading() {
  const el = document.getElementById('mathjax-loading');
  if (!el) return;

  if (typeof MathJax === 'undefined') {
    el.classList.add('show');
    return;
  }

  if (MathJax.startup && MathJax.startup.promise) {
    el.classList.add('show');
    MathJax.startup.promise.then(() => {
      el.classList.remove('show');
    }).catch(() => {
      el.classList.remove('show');
    });
    setTimeout(() => el.classList.remove('show'), 8000);
  }
}

export function hideMathJaxLoading() {
  const el = document.getElementById('mathjax-loading');
  if (el) el.classList.remove('show');
}

document.addEventListener('mathjax-ready', () => {
  hideMathJaxLoading();
});

function loadMathJaxWithFallback() {
  if (document.querySelector('script[data-mathjax]')) return;

  const script = document.createElement('script');
  script.setAttribute('data-mathjax', '');
  script.src = MATHJAX_CDN_PRIMARY;
  script.onerror = () => {
    console.warn('⚠️ CDN primario falló, intentando fallback...');
    script.src = MATHJAX_CDN_FALLBACK;
  };
  document.head.appendChild(script);
}
