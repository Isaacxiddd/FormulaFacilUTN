// ══════════════════════════════════════════════════════════════
// MÓDULO DE LÓGICA DEL JUEGO
// ══════════════════════════════════════════════════════════════

import { gameState, mutations, getters } from './state.js';
import { getThemeConfig } from './themes.js';
import { playAudioWithPitch, playAudio, audioCorrecto, audioIncorrecto } from './audio.js';
import { showTip, animateFire, resetFireAnimation, updateScoreboard, hideTip } from './ui.js';
import { shuffle, delay } from './utils.js';
import { monitorMathJaxRendering, verifyMathRendering } from './mathjax-check.js';

// ══════════════════════════════════════════════════════════════
// CREACIÓN DE CARTAS
// ══════════════════════════════════════════════════════════════

export function createFigureCard(item, index, position) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    card.dataset.position = position;
    card.dataset.type = 'figure';
    card.id = `figure-${position}`;
    
    const content = document.createElement('div');
    content.className = 'figure-content';
    
    if (gameState.currentTheme === 'functions' || gameState.currentTheme === 'inequalities') {
        content.innerHTML = `
            <div class="function-card-wrapper">
                <div class="function-icon">${item.icon || '📐'}</div>
                <div class="function-name">${item.name}</div>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="figure-name">${item.name}</div>
            ${item.svg}
        `;
    }
    
    card.appendChild(content);
    card.addEventListener('click', () => handleCardClick(card, 'figure'));
    
    return card;
}

export function createFormulaCard(item, index, position) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    card.dataset.position = position;
    card.dataset.type = 'formula';
    card.id = `formula-${position}`;
    
    const content = document.createElement('div');
    content.className = 'formula-content';
    content.innerHTML = `\\[${item.formulas}\\]`;
    
    card.appendChild(content);
    card.addEventListener('click', () => handleCardClick(card, 'formula'));
    
    return card;
}

export function handleCardClick(card, type) {
    if (gameState.isProcessingAnswer) return;
    
    const allCards = document.querySelectorAll('.card');
    
    if (type === 'figure') {
        if (gameState.selectedFigure !== null) {
            allCards.forEach(c => {
                if (c.dataset.type === 'figure') c.classList.remove('selected');
            });
        }
        
        gameState.selectedFigure = {
            index: parseInt(card.dataset.index),
            position: parseInt(card.dataset.position)
        };
        card.classList.add('selected');
    } else {
        if (gameState.selectedFormula !== null) {
            allCards.forEach(c => {
                if (c.dataset.type === 'formula') c.classList.remove('selected');
            });
        }
        
        gameState.selectedFormula = {
            index: parseInt(card.dataset.index),
            position: parseInt(card.dataset.position)
        };
        card.classList.add('selected');
    }
    
    if (gameState.selectedFigure !== null && gameState.selectedFormula !== null) {
        checkMatch();
    }
}

// ══════════════════════════════════════════════════════════════
// LÓGICA DE MATCHING
// ══════════════════════════════════════════════════════════════

async function checkMatch() {
    if (gameState.isProcessingAnswer) return;
    gameState.isProcessingAnswer = true;
    
    const figureCard = document.getElementById(`figure-${gameState.selectedFigure.position}`);
    const formulaCard = document.getElementById(`formula-${gameState.selectedFormula.position}`);
    
    let isMatch = gameState.selectedFigure.index === gameState.selectedFormula.index;
    
    // Lógica especial para rectángulo y paralelogramo
    if (!isMatch && gameState.currentTheme === 'geometry') {
        const figureItem = gameState.currentDataSource[gameState.selectedFigure.index];
        const formulaItem = gameState.currentDataSource[gameState.selectedFormula.index];
        
        if ((figureItem.name === "Rectángulo" && formulaItem.name === "Paralelogramo") ||
            (figureItem.name === "Paralelogramo" && formulaItem.name === "Rectángulo")) {
            isMatch = true;
        }
    }
    
    if (isMatch) {
        await handleCorrectMatch(figureCard, formulaCard);
    } else {
        await handleIncorrectMatch(figureCard, formulaCard);
    }
    
    mutations.setSelectedFigure(null);
    mutations.setSelectedFormula(null);
    gameState.isProcessingAnswer = false;
}

async function handleCorrectMatch(figureCard, formulaCard) {
    mutations.incrementAttempts(true);
    
    playAudioWithPitch(audioCorrecto, gameState.streak);
    animateFire(gameState.streak);
    
    figureCard.classList.add('matched');
    formulaCard.classList.add('matched');
    
    updateScoreboard();
    
    await delay(500);
    
    // Reemplazar cartas si hay disponibles
    const usedIndices = new Set([...gameState.currentFigures, ...gameState.currentFormulas]);
    const availableIndices = [];
    
    for (let i = 0; i < gameState.currentDataSource.length; i++) {
        if (!usedIndices.has(i)) {
            availableIndices.push(i);
        }
    }
    
    if (availableIndices.length >= 1) {
        const shuffledAvailable = shuffle(availableIndices);
        const newIndex = shuffledAvailable[0];
        
        gameState.currentFigures[gameState.selectedFigure.position] = newIndex;
        gameState.currentFormulas[gameState.selectedFormula.position] = newIndex;
        
        gameState.currentFormulas = shuffle(gameState.currentFormulas);
    }
    
    updateCards();
}

async function handleIncorrectMatch(figureCard, formulaCard) {
    mutations.incrementAttempts(false);
    
    playAudio(audioIncorrecto);
    resetFireAnimation();
    
    updateScoreboard();
    
    const figureName = gameState.currentDataSource[gameState.selectedFigure.index].name;
    showTip(figureName);
    
    figureCard.classList.add('wrong');
    formulaCard.classList.add('wrong');
    
    await delay(500);
    
    figureCard.classList.remove('wrong', 'selected');
    formulaCard.classList.remove('wrong', 'selected');
}

// ══════════════════════════════════════════════════════════════
// GESTIÓN DEL JUEGO
// ══════════════════════════════════════════════════════════════

export function updateCards() {
    const figuresContainer = document.getElementById('figures');
    const formulasContainer = document.getElementById('formulas');
    
    figuresContainer.innerHTML = '';
    formulasContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.CARDS_PER_SIDE; i++) {
        const figureIndex = gameState.currentFigures[i];
        const formulaIndex = gameState.currentFormulas[i];
        
        figuresContainer.appendChild(createFigureCard(gameState.currentDataSource[figureIndex], figureIndex, i));
        formulasContainer.appendChild(createFormulaCard(gameState.currentDataSource[formulaIndex], formulaIndex, i));
    }
    
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise().then(() => {
            if (!verifyMathRendering(figuresContainer) || !verifyMathRendering(formulasContainer)) {
                monitorMathJaxRendering(formulasContainer, 3);
            }
        }).catch(() => {});
    }
}

export function newGame() {
    console.log('🎮 newGame llamado, dataSource:', gameState.currentDataSource?.length);
    mutations.resetGame();
    
    document.getElementById('accuracy').textContent = '0%';
    document.getElementById('streakCount').textContent = '0';
    document.getElementById('successMessage').style.display = 'none';

    // Limpiar tips y animaciones
    hideTip();
    resetFireAnimation();
    
    // Verificar que dataSource esté cargado
    if (!gameState.currentDataSource || gameState.currentDataSource.length === 0) {
        console.error('❌ DataSource no está cargado en newGame');
        return;
    }
    
    // Crear pares asegurados
    const maxIndex = Math.min(gameState.currentDataSource.length, gameState.CARDS_PER_SIDE);
    const availableIndices = shuffle([...Array(maxIndex).keys()]);
    
    for (let i = 0; i < gameState.CARDS_PER_SIDE && i < availableIndices.length; i++) {
        const cardIndex = availableIndices[i];
        gameState.currentFigures.push(cardIndex);
        gameState.currentFormulas.push(cardIndex);
    }
    
    gameState.currentFormulas = shuffle(gameState.currentFormulas);
    
    console.log('🎮 Llamando updateCards con', gameState.currentFigures.length, 'figuras');
    updateCards();
}

// ══════════════════════════════════════════════════════════════
// PRACTICE MODE
// ══════════════════════════════════════════════════════════════

export async function generatePracticeExercise(difficulty) {
    console.log('🎯 Generando ejercicio - Tema:', gameState.currentTheme, '- Dificultad:', difficulty);
    
    // Usar el generador correcto según el tema
    if (gameState.currentTheme === 'functions') {
        console.log('🔍 Detectado tema: functions');
        try {
            const module = await import('../modules/functions/practice.js');
            console.log('🔍 Módulo functions importado:', module);
            const exercise = module.generatePracticeExerciseFunctions(difficulty);
            console.log('✅ Ejercicio functions generado:', exercise);
            return exercise;
        } catch (error) {
            console.error('❌ Error en functions practice:', error);
            throw error;
        }
    }
    
    if (gameState.currentTheme === 'inequalities') {
        console.log('🔍 Detectado tema: inequalities');
        try {
            const module = await import('../modules/inequalities/practice.js');
            const exercise = module.generatePracticeExerciseInequalities(difficulty);
            console.log('✅ Ejercicio inequalities generado:', exercise);
            return exercise;
        } catch (error) {
            console.error('❌ Error en inequalities practice:', error);
            throw error;
        }
    }
    
    if (gameState.currentTheme === 'absolute-value') {
        console.log('🔍 Detectado tema: absolute-value');
        try {
            const module = await import('../modules/absolute/practice.js');
            const exercise = module.generatePracticeExerciseAbsoluteValue(difficulty);
            console.log('✅ Ejercicio absolute-value generado:', exercise);
            return exercise;
        } catch (error) {
            console.error('❌ Error en absolute-value practice:', error);
            throw error;
        }
    }
    
    if (gameState.currentTheme === 'intervals') {
        console.log('🔍 Detectado tema: intervals');
        try {
            const module = await import('../modules/intervals/data.js');
            // Por ahora intervals no tiene practice.js, devolver ejercicio básico
            const exercise = {
                question: "Escribir en notación de intervalo: x > 2",
                measures: [{ label: "Desigualdad", value: "x > 2" }],
                options: ["(2, ∞)", "[2, ∞)", "(-∞, 2)", "(-∞, 2]"],
                correctAnswer: "(2, ∞)",
                formulaText: "x > 2 ⇒ (2, ∞)",
                svg: `<svg viewBox="0 0 100 100"><line x1="30" y1="50" x2="90" y2="50" stroke="#2196f3" stroke-width="3"/><circle cx="30" cy="50" r="3" fill="white" stroke="#2196f3" stroke-width="2"/><text x="25" y="40" font-size="10" fill="#2196f3">2</text><text x="85" y="40" font-size="10" fill="#2196f3">∞</text></svg>`
            };
            console.log('✅ Ejercicio intervals generado:', exercise);
            return exercise;
        } catch (error) {
            console.error('❌ Error en intervals practice:', error);
            throw error;
        }
    }
    
    // Temas del Segundo Parcial
    if (gameState.currentTheme === 'logaritmos') {
        console.log('🔍 Detectado tema: logaritmos');
        try {
            const module = await import('../modules/logaritmos/practice.js');
            const exercise = module.generatePracticeExerciseLogaritmos(difficulty);
            console.log('✅ Ejercicio logaritmos generado:', exercise);
            return exercise;
        } catch (error) {
            console.error('❌ Error en logaritmos practice:', error);
            throw error;
        }
    }
    
    if (gameState.currentTheme === 'trigonometria') {
        console.log('🔍 Detectado tema: trigonometria');
        try {
            const module = await import('../modules/trigonometria/practice.js');
            const exercise = module.generatePracticeExerciseTrigonometria(difficulty);
            console.log('✅ Ejercicio trigonometria generado:', exercise);
            return exercise;
        } catch (error) {
            console.error('❌ Error en trigonometria practice:', error);
            throw error;
        }
    }
    
    if (gameState.currentTheme === 'vectores') {
        console.log('🔍 Detectado tema: vectores');
        try {
            const module = await import('../modules/vectores/practice.js');
            const exercise = module.generatePracticeExerciseVectores(difficulty);
            console.log('✅ Ejercicio vectores generado:', exercise);
            return exercise;
        } catch (error) {
            console.error('❌ Error en vectores practice:', error);
            throw error;
        }
    }
    
    if (gameState.currentTheme === 'homograficas') {
        console.log('🔍 Detectado tema: homograficas');
        try {
            const module = await import('../modules/homograficas/practice.js');
            const exercise = module.generatePracticeExerciseHomograficas(difficulty);
            console.log('✅ Ejercicio homograficas generado:', exercise);
            return exercise;
        } catch (error) {
            console.error('❌ Error en homograficas practice:', error);
            throw error;
        }
    }
    
    if (gameState.currentTheme === 'inyectivas') {
        console.log('🔍 Detectado tema: inyectivas');
        try {
            const module = await import('../modules/inyectivas/practice.js');
            const exercise = module.generatePracticeExerciseInyectivas(difficulty);
            console.log('✅ Ejercicio inyectivas generado:', exercise);
            return exercise;
        } catch (error) {
            console.error('❌ Error en inyectivas practice:', error);
            throw error;
        }
    }
    
    // Geometría (por defecto)
    console.log('🔍 Usando tema por defecto: geometry');
    try {
        const module = await import('../modules/geometry/practice.js');
        console.log('🔍 Módulo geometry importado:', module);
        const exercise = module.generatePracticeExerciseGeometry(difficulty);
        console.log('✅ Ejercicio geometry generado:', exercise);
        return exercise;
    } catch (error) {
        console.error('❌ Error en geometry practice:', error);
        throw error;
    }
}

export async function renderPracticeExercise(exercise) {
    console.log('🎯 renderPracticeExercise llamado con:', exercise);
    const slot = document.getElementById('exerciseSlot');
    
    if (!exercise) {
        console.error('❌ No se recibió ejercicio');
        slot.innerHTML = '<div class="error-message">Error: No se pudo generar el ejercicio</div>';
        return;
    }
    
    console.log('🎯 Ejercicio válido, renderizando...');
    
    const measuresHTML = exercise.measures
        .map(m => '<li>' + m.label + ': <strong>' + m.value + '</strong></li>')
        .join('');
    
    // Usar unidades apropiadas según el tema y tipo de ejercicio
    let unit = '';
    if (gameState.currentTheme === 'geometry') {
        const isVolumeExercise = exercise.question && exercise.question.toLowerCase().includes('volumen');
        const is3DFigure = exercise.figureName && gameState.currentDataSource.find(g => g.name === exercise.figureName && g.figure3D);
        
        if (isVolumeExercise && is3DFigure) {
            unit = ' cm³';
        } else {
            unit = ' cm²';
        }
    }
    
    // Para inecuaciones, intervalos y valor absoluto, las opciones pueden ser strings, no números
    const isStringAnswer = gameState.currentTheme === 'inequalities' || gameState.currentTheme === 'intervals' || gameState.currentTheme === 'absolute-value';
    
    console.log('🎯 isStringAnswer:', isStringAnswer, 'unit:', unit);
    
    // CORREGIDO: Usar data attributes en lugar de onclick inline para compatibilidad cross-browser y CSP
    const optionsHTML = exercise.options
        .map((val, i) => {
            const displayVal = isStringAnswer ? val : (val + unit);
            // Escapar el valor para evitar problemas con comillas y caracteres especiales
            const escapedVal = String(val).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            return '<button class="option-btn" data-value="' + escapedVal + '" data-index="' + i + '">' + 
                   displayVal + '</button>';
        })
        .join('');
    
    console.log('🎯 optionsHTML generado:', optionsHTML);
    
    const html = `
        <div class="exercise-card">
            <div class="exercise-figure-wrap">
                <div class="exercise-svg-box" id="exerciseSvg">${exercise.svg || ''}</div>
                <div class="exercise-measures">
                    <div class="exercise-measures-title">Datos</div>
                    <ul>${measuresHTML}</ul>
                </div>
            </div>
            <div class="exercise-question">${exercise.question}</div>
            <div class="options-grid">${optionsHTML}</div>
        </div>
    `;
    
    console.log('🎯 HTML generado:', html);
    slot.innerHTML = html;
    
    // Agregar event listeners
    const buttons = slot.querySelectorAll('.option-btn');
    console.log('🎯 Botones encontrados:', buttons.length);
    
    buttons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            console.log('🎯 Botón clickeado:', btn.dataset.value);
            handlePracticeAnswer(btn, exercise.correctAnswer);
        });
    });
    
    // Agregar event listener para el SVG (como en el original)
    const svgBox = document.getElementById('exerciseSvg');
    if (svgBox) {
        svgBox.style.cursor = 'pointer';
        svgBox.addEventListener('click', () => {
            console.log('🔍 Clic en SVG del ejercicio - Tema:', gameState.currentTheme);
            import('./ui.js').then(ui => ui.openFormulasModal());
        });
    }
    
    // Renderizar MathJax
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise().then(() => {
            if (!verifyMathRendering(slot)) {
                monitorMathJaxRendering(slot, 3);
            }
        }).catch(() => {});
    }
    
    console.log('🎯 renderPracticeExercise completado');
}

function handlePracticeAnswer(button, correctAnswer) {
    const userAnswer = button.dataset.value;
    const isCorrect = userAnswer == correctAnswer;
    
    // Deshabilitar todos los botones
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.value == correctAnswer) {
            btn.classList.add('correct');
        } else if (btn === button && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    mutations.incrementAttempts(isCorrect);
    updateScoreboard();
    
    if (isCorrect) {
        playAudioWithPitch(audioCorrecto, gameState.streak);
        animateFire(gameState.streak);
    } else {
        playAudio(audioIncorrecto);
        resetFireAnimation();
    }
    
    // Generar nuevo ejercicio después de un delay
    setTimeout(() => {
        startPractice();
    }, 2000);
}

export async function startPractice() {
    console.log('🎯 Iniciando practice mode...');
    console.log('🎯 Tema actual:', gameState.currentTheme);
    console.log('🎯 Dificultad actual:', gameState.currentDifficulty);
    console.log('🎯 DataSource disponible:', gameState.currentDataSource?.length);
    
    // Esperar a que el dataSource esté disponible si es necesario
    if (!gameState.currentDataSource || gameState.currentDataSource.length === 0) {
        console.log('🔄 Esperando dataSource...');
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('🔄 DataSource después de espera:', gameState.currentDataSource?.length);
    }
    
    if (!gameState.currentDataSource || gameState.currentDataSource.length === 0) {
        console.error('❌ DataSource no disponible');
        const slot = document.getElementById('exerciseSlot');
        slot.innerHTML = '<div class="error-message">Error: No hay datos disponibles</div>';
        return;
    }
    
    try {
        const exercisePromise = generatePracticeExercise(gameState.currentDifficulty);
        console.log('🎯 Promise obtenida:', exercisePromise);
        const exercise = await exercisePromise;
        console.log('🎯 Ejercicio generado:', exercise);
        
        if (!exercise) {
            console.error('❌ No se generó ejercicio');
            return;
        }
        
        renderPracticeExercise(exercise);
    } catch (error) {
        console.error('❌ Error en startPractice:', error);
        const slot = document.getElementById('exerciseSlot');
        slot.innerHTML = '<div class="error-message">Error: ' + error.message + '</div>';
    }
}
