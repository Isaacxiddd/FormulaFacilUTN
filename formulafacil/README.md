<div align="center">

# 📐 FormulaFacil UTN

### Juego educativo para repasar fórmulas del ingreso a la **UTN FRBA**

![GitHub last commit](https://img.shields.io/github/last-commit/Isaacxiddd/FormulaFacilUTN?color=6a1b9a&style=flat-square)
![GitHub repo size](https://img.shields.io/github/repo-size/Isaacxiddd/FormulaFacilUTN?color=8e24aa&style=flat-square)
![Visitas](https://img.shields.io/badge/visitas-7.078-9c27b0?style=flat-square)
![Usos](https://img.shields.io/badge/usos-26.379-ab47bc?style=flat-square)
![MathJax](https://img.shields.io/badge/MathJax-3.2-4a148c?style=flat-square)
![Vercel](https://img.shields.io/badge/deploy-Vercel-6a1b9a?style=flat-square)

[![Vercel](https://img.shields.io/badge/🔗_Producción-Vercel-6a1b9a?style=for-the-badge)](https://formulafacil-utn.vercel.app)
[![Neocities](https://img.shields.io/badge/🔗_Alternativo-Neocities-8e24aa?style=for-the-badge)](https://formulafacilutn.neocities.org)

</div>

---

## 🧠 ¿Qué es esto?

Memorizá fórmulas matemáticas jugando. Asociá figuras con sus fórmulas en formato LaTeX, resolvé ejercicios en modo práctica, y seguí tu progreso con rachas y precisión. Diseñado específicamente para el contenido del **ingreso a la UTN FRBA**.

---

## 🚀 Stack

| Tecnología | Uso |
|---|---|
| **HTML5** | Estructura semántica |
| **CSS3** | Flexbox, Grid, animaciones, modo oscuro |
| **JavaScript (ES Modules)** | Lógica modular sin frameworks |
| **MathJax 3** | Renderizado de LaTeX en vivo |
| **pnpm** | Package manager |
| **Vercel** | Deploy automático |

### ¿Por qué vanilla JS y no un framework?

El proyecto arrancó como una herramienta de estudio personal. Usar ES Modules nativos mantiene el peso mínimo (~0 dependencias), el renderizado es instantáneo y no requiere build step. Con pnpm + Vercel el deploy es trivial.

### ¿Por qué MathJax y no KaTeX?

MathJax 3 tiene mejor soporte de expresiones complejas (matrices, casos, integrales) sin precompilación. KaTeX es más rápido pero requiere un paso de build o renderizado inline que complica el contenido dinámico. Para un proyecto educativo donde las fórmulas se generan en runtime, MathJax es más práctico.

---

## 📁 Estructura

```
formulafacil/
├── index.html                 # Entry point
├── styles.css                 # ~2800 líneas de CSS (light + dark)
├── app.js                     # Bootstrap + inicialización
├── core/
│   ├── state.js               # Estado global inmutable por convención
│   ├── router.js              # Ruteo de temas/modos
│   ├── game.js                # Lógica de matching y practice
│   ├── themes.js              # Config centralizada de temas
│   ├── ui.js                  # Modales, tips, scoreboard
│   ├── audio.js               # Feedback sonoro progresivo
│   ├── utils.js               # shuffle, randInt, delay
│   ├── mathjax-check.js       # Fallback CDN + observer + loading
│   └── darkmode.js            # Modo oscuro con localStorage
├── modules/                   # Datos por tema (modulares)
│   ├── geometry/              # 13 figuras 2D y 3D
│   ├── functions/
│   ├── inequalities/
│   ├── absolute/
│   ├── intervals/
│   ├── trigonometria/         # 20+ identidades
│   ├── logaritmos/
│   ├── vectores/
│   ├── homograficas/
│   └── inyectivas/
├── audio/                     # FX (correcto/incorrecto)
├── *.png                      # Recursos estáticos
```

### ¿Por qué esta estructura?

Separar `core/` de `modules/` permite agregar un tema nuevo créando una carpeta con `data.js` + `practice.js` y registrándolo en `themes.js` — sin tocar el resto del código.

---

## 🎮 Modos de juego

### Classic
Armá pares entre figura y fórmula. El sistema lleva:
- **Aciertos** acumulados
- **Precisión** porcentual
- **Racha** con animación progresiva del fueguito (cambia de color/intensidad cada 3, 5, 8 aciertos consecutivos)
- **Tips** interactivos cuando te equivocás

### Practice
Ejercicios con opciones múltiples y 4 dificultades:
| Dificultad | Descripción |
|---|---|
| **Easy** | Fórmulas directas, valores enteros |
| **Medium** | Operaciones combinadas |
| **Hard** | Ejercicios con pasos múltiples |
| **Mixed** | Aleatorio |

---

## 🧪 MathJax cross-device

Uno de los problemas más reportados era que en algunos dispositivos (especialmente iOS y Android con conexión lenta) MathJax no renderizaba y se veía LaTeX crudo (`\[A = \pi r^2\]`).

**Soluciones implementadas:**

- **MutationObserver** que detecta nuevo contenido LaTeX y gatilla `typesetPromise()` automáticamente
- **Doble CDN**: si el primario (cdnjs) falla, prueba con jsDelivr
- **Loading indicator** con spinner mientras MathJax procesa
- **Retry mechanism** con hasta 5 reintentos y 1s de intervalo
- **Fallback visual** si después de todo no rinde, muestra un aviso amigable
- **Evento `mathjax-ready`** para sincronizar la UI

```js
// core/mathjax-check.js - Fragmento del observer
const observer = new MutationObserver(() => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => forceMathJaxTypeset(), 300);
});
observer.observe(document.body, { childList: true, subtree: true });
```

---

## ⚙️ Instalación local

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

O directamente con cualquier servidor estático:

```bash
npx serve formulafacil -l 3000
```

---

## 🚢 Deploy

```bash
pnpm vercel --prod
```

El `vercel.json` ya tiene `rootDirectory: "formulafacil"` y `framework: null` (static site). Conectá el repo a Vercel y deploya automáticamente desde `main`.

---

## 📊 Estadísticas

| Métrica | Valor |
|---|---|
| Visitas | **7.078** |
| Usos | **26.379** |
| Temas disponibles | **10** |
| Fórmulas totales | **65+** |
| Líneas de CSS | ~2.800 |
| Dependencias | **0** (producción) |

---

## 🧩 Roadmap

- [x] Modo clásico (matching)
- [x] Modo práctica (multiple choice)
- [x] Modo oscuro con persistencia
- [x] MathJax cross-device con fallback
- [x] pnpm + Vercel
- [ ] Guardar progreso del usuario (localStorage)
- [ ] Estadísticas históricas por tema
- [ ] Más temas (derivadas, integrales)
- [ ] i18n (inglés)

---

<div align="center">

**Hecho por [Isaac Garcia](https://github.com/Isaacxiddd)** · Estudiante de Ing. en Sistemas · UTN FRBA

*Si te sirve, dejá una estrella ⭐*

</div>
