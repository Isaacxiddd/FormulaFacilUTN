# FormulaFacil UTN

Juego educativo para repasar fórmulas matemáticas del ingreso a la **UTN FRBA**. Asociá conceptos con sus fórmulas en formato LaTeX, con modo práctica incluido.

## Stack

- HTML5 / CSS3 / JavaScript (ES Modules nativos)
- [MathJax 3](https://www.mathjax.org/) — renderizado LaTeX
- [pnpm](https://pnpm.io/) + Vercel (deploy automático)

## Estructura

```
formulafacil/
├── index.html               # Entry point
├── styles.css               # Estilos (light + dark mode)
├── app.js                   # Bootstrap de la app
├── core/
│   ├── state.js             # Estado global
│   ├── router.js            # Navegación y cambio de temas/modos
│   ├── game.js              # Lógica del juego (classic + practice)
│   ├── themes.js            # Config de cada tema
│   ├── ui.js                # Modales, tips, scoreboard
│   ├── audio.js             # Efectos de sonido
│   ├── utils.js             # Shuffle, delay, randInt
│   ├── mathjax-check.js     # Detección de render + observer + fallback CDN
│   └── darkmode.js          # Modo oscuro (clase + localStorage)
├── modules/
│   ├── geometry/            # Figuras 2D y 3D (13 figuras)
│   ├── functions/           # Funciones
│   ├── inequalities/        # Inecuaciones
│   ├── absolute/            # Valor absoluto
│   ├── intervals/           # Intervalos
│   ├── trigonometria/       # identidades trigonométricas
│   ├── logaritmos/          # Propiedades de logaritmos
│   ├── vectores/            # Vectores
│   ├── homograficas/        # Funciones homográficas
│   └── inyectivas/          # Inyectividad y sobreyectividad
├── audio/
│   ├── correcto.mp3
│   └── incorrecto.mp3
├── logo-utn.png
├── logofmt.png
├── fueguito.png
└── fueguito3.png
```

## Modos

| Modo | Descripción |
|------|-------------|
| **Classic** | Asociá cada figura/concepto con su fórmula. Lleva score, racha y tips. |
| **Practice** | Ejercicios con opciones múltiples. Dificultad ajustable (Easy / Medium / Hard / Mixed). |

## Instalación

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Deploy en Vercel

Conectá el repo a Vercel. El `vercel.json` ya apunta `rootDirectory` a `formulafacil/`.

```bash
npx vercel --prod
```

## Enlaces

- Producción: https://formulafacil-utn.vercel.app
- Neocities: https://formulafacilutn.neocities.org

---

Proyecto hecho por [Isaac Garcia](https://github.com/Isaacxiddd) como herramienta de estudio para el ingreso a la UTN.
