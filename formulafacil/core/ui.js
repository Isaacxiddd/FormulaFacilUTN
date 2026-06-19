// ══════════════════════════════════════════════════════════════
// MÓDULO DE INTERFAZ DE USUARIO
// ══════════════════════════════════════════════════════════════

import { gameState } from './state.js';
import { getThemeConfig } from './themes.js';
import { playAudioWithPitch, playAudio } from './audio.js';
import { delay } from './utils.js';
import { monitorMathJaxRendering, verifyMathRendering } from './mathjax-check.js';

// ══════════════════════════════════════════════════════════════
// SISTEMA DE TIPS
// ══════════════════════════════════════════════════════════════

const figureTips = {
    "Cuadrado": [
        "El área es lado al cuadrado",
        "Todos los lados son iguales",
        "El perímetro es 4 veces el lado"
    ],
    "Rectángulo": [
        "El área es base por altura",
        "Lados opuestos son iguales",
        "El perímetro es 2 veces la suma de base y altura"
    ],
    "Triángulo": [
        "El área es base por altura sobre 2",
        "La suma de ángulos internos es 180°",
        "El perímetro es la suma de los tres lados"
    ],
    "Círculo": [
        "π ≈ 3.14159",
        "El diámetro es 2 veces el radio",
        "La circunferencia es 2πr"
    ],
    "Esfera": [
        "El volumen es (4/3)πr³",
        "El área superficial es 4πr²",
        "Todos los puntos están a igual distancia del centro"
    ],
    "Cilindro": [
        "El volumen es πr²h",
        "El área lateral es 2πrh",
        "Las bases son círculos iguales"
    ],
    "Cono": [
        "El volumen es (1/3)πr²h",
        "El área lateral es πrl",
        "Tiene una base circular y un vértice"
    ],
    "Prisma": [
        "El volumen es área de base por altura",
        "Las caras laterales son paralelogramos",
        "Tiene dos bases iguales y paralelas"
    ],
    "Pirámide": [
        "El volumen es (1/3)área de base por altura",
        "Las caras laterales son triángulos",
        "Tiene una base poligonal y un vértice"
    ],
    "Tetraedro": [
        "Todos sus lados son triángulos equiláteros",
        "Tiene 4 caras, 6 aristas y 4 vértices",
        "Es un poliedro regular"
    ],
    "Cubo": [
        "Todas las caras son cuadrados iguales",
        "Tiene 6 caras, 12 aristas y 8 vértices",
        "Es un prisma regular de base cuadrada"
    ],
    "Paralelepípedo": [
        "Todas las caras son paralelogramos",
        "Las caras opuestas son iguales",
        "Incluye al cubo como caso especial"
    ],
    "Recta": [
        "La pendiente mide la inclinación",
        "La ordenada al origen es donde cruza el eje Y",
        "Dos puntos determinan una recta única"
    ],
    "Función cuadrática": [
        "Su gráfica es una parábola",
        "El vértice es el punto máximo o mínimo",
        "El eje de simetría pasa por el vértice"
    ]
};

export function showTip(figureName) {
    if (gameState.currentMode !== 'classic') return;

    const tips = figureTips[figureName];
    if (!tips || tips.length === 0) return;

    const tip = tips[Math.floor(Math.random() * tips.length)];

    hideTip();

    document.getElementById('tipFigureName').textContent = figureName;
    document.getElementById('tipText').textContent = tip;

    const toast = document.getElementById('tipToast');
    toast.classList.add('visible');

    const bar = document.getElementById('tipBar');
    bar.style.width = '100%';
    void bar.offsetWidth;

    const DURATION = 4000;
    const TICK = 50;
    let elapsed = 0;

    gameState.tipBarInterval = setInterval(() => {
        elapsed += TICK;
        const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
        bar.style.width = pct + '%';
        if (pct <= 0) {
            clearInterval(gameState.tipBarInterval);
            gameState.tipBarInterval = null;
        }
    }, TICK);

    gameState.tipTimeout = setTimeout(() => {
        hideTip();
    }, DURATION);
}

export function hideTip() {
    if (gameState.tipTimeout) { 
        clearTimeout(gameState.tipTimeout); 
        gameState.tipTimeout = null; 
    }
    if (gameState.tipBarInterval) { 
        clearInterval(gameState.tipBarInterval); 
        gameState.tipBarInterval = null; 
    }
    document.getElementById('tipToast').classList.remove('visible');
}

// ══════════════════════════════════════════════════════════════
// ANIMACIONES
// ══════════════════════════════════════════════════════════════

export function animateFire(streakLevel) {
    const fireEmoji = document.querySelector('img.fire-emoji');
    if (!fireEmoji) return;
    
    if (streakLevel >= 10) {
        fireEmoji.src = 'fueguito3.png';
    } else {
        fireEmoji.src = 'fueguito.png';
    }
    
    fireEmoji.classList.remove('excited', 'jump');
    void fireEmoji.offsetWidth;
    
    if (streakLevel >= 5) {
        fireEmoji.classList.add('excited');
        setTimeout(() => fireEmoji.classList.remove('excited'), 600);
    } else {
        fireEmoji.classList.add('jump');
        setTimeout(() => fireEmoji.classList.remove('jump'), 400);
    }
    
    fireEmoji.classList.remove('streak-low', 'streak-medium', 'streak-high', 'streak-extreme');
    
    if (streakLevel >= 8) {
        fireEmoji.classList.add('streak-extreme');
    } else if (streakLevel >= 5) {
        fireEmoji.classList.add('streak-high');
    } else if (streakLevel >= 3) {
        fireEmoji.classList.add('streak-medium');
    } else if (streakLevel >= 1) {
        fireEmoji.classList.add('streak-low');
    }
}

export function resetFireAnimation() {
    const fireEmoji = document.querySelector('img.fire-emoji');
    if (!fireEmoji) return;
    
    fireEmoji.classList.remove(
        'excited', 'jump', 
        'streak-low', 'streak-medium', 'streak-high', 'streak-extreme'
    );
}

export function updateScoreboard() {
    const accuracy = gameState.totalAttempts === 0 ? 0 : Math.round((gameState.correctAttempts / gameState.totalAttempts) * 100);
    document.getElementById('accuracy').textContent = accuracy + '%';
    
    const streakElement = document.getElementById('streakCount');
    const currentStreak = parseInt(streakElement.textContent);
    
    if (gameState.streak > currentStreak) {
        const baseSpeed = 200;
        const accelerationFactor = Math.max(0.3, 1 - (gameState.streak * 0.05));
        const animSpeed = baseSpeed * accelerationFactor;
        
        streakElement.style.transition = `transform ${animSpeed}ms ease-out, opacity ${animSpeed}ms ease-out`;
        streakElement.style.transform = 'translateY(-25px)';
        streakElement.style.opacity = '0';
        
        setTimeout(() => {
            streakElement.textContent = gameState.streak;
            streakElement.style.transition = `transform ${animSpeed * 1.2}ms ease-out, opacity ${animSpeed * 1.2}ms ease-out`;
            streakElement.style.transform = 'translateY(25px)';
            streakElement.style.opacity = '0';
            
            setTimeout(() => {
                streakElement.style.transition = `transform ${animSpeed * 0.8}ms ease-out, opacity ${animSpeed * 0.8}ms ease-out`;
                streakElement.style.transform = 'translateY(0)';
                streakElement.style.opacity = '1';
            }, 50);
        }, animSpeed);
    } else {
        streakElement.textContent = gameState.streak;
    }
}

// ══════════════════════════════════════════════════════════════
// MODALES
// ══════════════════════════════════════════════════════════════

export function openFiguresModal(scrollToIndex = null) {
    const modal = document.getElementById('figuresModal');
    modal.classList.add('active');
    renderFiguresGallery(scrollToIndex);
}

export function closeFiguresModal() {
    const modal = document.getElementById('figuresModal');
    modal.classList.remove('active');
}

export function openFormulasModal(scrollToIndex = null) {
    const modal = document.getElementById('formulasModal');
    modal.classList.add('active');
    renderFormulasList(scrollToIndex);
}

export function closeFormulasModal() {
    const modal = document.getElementById('formulasModal');
    modal.classList.remove('active');
}

function renderFiguresGallery(scrollToIndex = null) {
    const gallery = document.getElementById('figuresGallery');
    gallery.innerHTML = '';
    
    const themeConfig = getThemeConfig(gameState.currentTheme);
    
    gameState.currentDataSource.forEach((item, index) => {
        const figureItem = document.createElement('div');
        figureItem.className = 'figure-item';
        figureItem.dataset.index = index;
        figureItem.id = `figure-gallery-${index}`;
        
        const is3D = index >= themeConfig.index3DStart;
        
        if (is3D) {
            if (item.is3D && item.svg3D) {
                figureItem.innerHTML = `
                    <div class="figure-item-name">${item.name}</div>
                    ${item.svg3D}
                `;
            } else {
                figureItem.innerHTML = `
                    <div class="figure-item-name">${item.name}</div>
                    <div class="figure-3d-container">
                        <div class="figure-3d">
                            ${item.svg}
                        </div>
                    </div>
                `;
            }
        } else if (gameState.currentTheme === 'functions' || gameState.currentTheme === 'inequalities') {
            figureItem.innerHTML = `
                <div class="figure-item-name">${item.name}</div>
                <div class="function-icon-large">${item.icon || '📐'}</div>
                ${item.svg || ''}
            `;
        } else {
            figureItem.innerHTML = `
                <div class="figure-item-name">${item.name}</div>
                ${item.svg}
            `;
        }
        
        figureItem.addEventListener('click', () => {
            closeFiguresModal();
            setTimeout(() => {
                // Buscar el índice correcto de la fórmula por nombre
                const formulasSource = getFormulasSource(gameState.currentTheme);
                const formulaIndex = formulasSource.findIndex(formula => formula.name === item.name);
                openFormulasModal(formulaIndex);
            }, 300);
        });
        
        gallery.appendChild(figureItem);
        
        if (is3D && item.is3D && item.svg3D) {
            setTimeout(() => {
                if (typeof initializeFigureSegments === 'function') {
                    initializeFigureSegments(figureItem);
                }
            }, 100);
        }
    });
    
    if (scrollToIndex !== null) {
        setTimeout(() => {
            const element = document.getElementById(`figure-gallery-${scrollToIndex}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-flash');
                setTimeout(() => {
                    element.classList.remove('highlight-flash');
                }, 2000);
            }
        }, 100);
    }
}

function renderFormulasList(scrollToIndex = null) {
    const list = document.getElementById('formulasList');
    list.innerHTML = '';
    
    const formulasSource = getFormulasSource(gameState.currentTheme);
    
    formulasSource.forEach((formula, index) => {
        const formulaDetail = document.createElement('div');
        formulaDetail.className = 'formula-detail';
        formulaDetail.dataset.index = index;
        formulaDetail.id = `formula-detail-${index}`;
        
        // Buscar la figura relacionada por nombre en lugar de por índice
        const relatedItem = gameState.currentDataSource.find(item => item.name === formula.name);
        let figurePreview = '';
        
        if (gameState.currentTheme === 'geometry') {
            if (relatedItem.is3D && relatedItem.svg3D) {
                figurePreview = `
                    <div class="formula-figure-preview">
                        <div class="formula-figure-preview-title">Figura 3D:</div>
                        <div class="formula-figure-preview-3d">
                            ${relatedItem.svg3D}
                        </div>
                    </div>
                `;
            } else {
                figurePreview = `
                    <div class="formula-figure-preview">
                        <div class="formula-figure-preview-title">Figura:</div>
                        <div class="formula-figure-preview-svg">
                            ${relatedItem.svg}
                        </div>
                    </div>
                `;
            }
        } else if (gameState.currentTheme === 'functions' || gameState.currentTheme === 'inequalities') {
            figurePreview = `
                <div class="formula-figure-preview">
                    <div class="formula-figure-preview-icon">${relatedItem.icon || '📐'}</div>
                    <div class="formula-figure-preview-name">${relatedItem.name}</div>
                </div>
            `;
        }
        
        const formulasHTML = formula.formulas.map(f => `\\[${f}\\]`).join('');
        const variablesHTML = formula.variables.map(v => `<li>${v}</li>`).join('');
        const stepsHTML = formula.example.steps.map((step, i) => 
            `<div class="example-step"><strong>Paso ${i + 1}:</strong> ${step}</div>`
        ).join('');
        
        formulaDetail.innerHTML = `
            <div class="formula-detail-header">
                <div class="formula-detail-main">
                    <div class="formula-detail-title">${formula.name}</div>
                    
                    <div class="formula-expression">
                        ${formulasHTML}
                    </div>
                    
                    <div class="formula-explanation">
                        <strong>Explicación:</strong> ${formula.explanation}
                    </div>
                </div>
                
                ${figurePreview}
            </div>
            
            <div class="formula-variables">
                <h4>Variables:</h4>
                <ul>
                    ${variablesHTML}
                </ul>
            </div>
            
            <div class="formula-example">
                <h4>📖 Ejercicio Resuelto</h4>
                <p><strong>Problema:</strong> ${formula.example.problem}</p>
                ${stepsHTML}
            </div>
        `;
        
        list.appendChild(formulaDetail);
        
        if (gameState.currentTheme === 'geometry' && relatedItem.is3D && relatedItem.svg3D) {
            setTimeout(() => {
                if (typeof initializeFigureSegments === 'function') {
                    initializeFigureSegments(formulaDetail);
                }
            }, 100);
        }
    });
    
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise().then(() => {
            if (!verifyMathRendering(list)) {
                monitorMathJaxRendering(list, 3);
            }
        }).catch(() => {});
    }
    
    if (scrollToIndex !== null) {
        setTimeout(() => {
            const element = document.getElementById(`formula-detail-${scrollToIndex}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                element.classList.add('highlight-flash');
                setTimeout(() => {
                    element.classList.remove('highlight-flash');
                }, 2000);
            }
        }, 100);
    }
}

function getFormulasSource(theme) {
    const config = getThemeConfig(theme);
    return config.formulas;
}
