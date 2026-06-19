// ════════════════════════════════════════════════════════════
// MÓDULO DE NAVEGACIÓN Y ROUTING
// ══════════════════════════════════════════════════════════════

import { gameState, mutations } from './state.js';
import { getThemeConfig } from './themes.js';
import { newGame, startPractice } from './game.js';
import { hideTip } from './ui.js';

// ══════════════════════════════════════════════════════════════
// CAMBIO DE MODO
// ══════════════════════════════════════════════════════════════

export function onModeChange() {
    const sel = document.getElementById('modeSelect');
    const newMode = sel.value;
    
    if (newMode === gameState.currentMode) return;
    
    mutations.setMode(newMode);
    
    const instruction = document.getElementById('instructionText');
    const themeConfig = getThemeConfig(gameState.currentTheme);
    
    instruction.textContent = newMode === 'practice'
        ? themeConfig.practiceInstruction
        : themeConfig.instruction;

    const badge = document.getElementById('modeBadge');
    badge.textContent = newMode === 'practice' ? 'Practice' : 'Classic';
    badge.className = 'mode-badge ' + newMode;

    if (newMode === 'practice') {
        switchToPractice();
    } else {
        switchToClassic();
    }
}

function switchToPractice() {
    document.getElementById('classicView').style.display = 'none';
    document.getElementById('practiceView').style.display = 'block';
    startPractice();
}

export function switchToClassic() {
    mutations.setMode('classic');
    document.getElementById('modeSelect').value = 'classic';
    const badge = document.getElementById('modeBadge');
    badge.textContent = 'Classic';
    badge.className = 'mode-badge classic';
    document.getElementById('classicView').style.display = 'block';
    document.getElementById('practiceView').style.display = 'none';
    hideTip();
    
    // Solo iniciar juego si hay un tema seleccionado
    if (gameState.currentTheme && gameState.currentDataSource) {
        newGame();
    }
}

// ══════════════════════════════════════════════════════════════
// CAMBIO DE TEMA
// ══════════════════════════════════════════════════════════════

export async function onThemeChange(newTheme = null) {
    console.log('🎯 onThemeChange llamado con:', newTheme);
    
    // Si no se pasa tema, obtener del select (para compatibilidad)
    if (!newTheme) {
        const sel = document.getElementById('themeSelect');
        newTheme = sel ? sel.value : gameState.currentTheme;
    }
    
    console.log('🎯 Tema final a cambiar:', newTheme);
    console.log('🎯 Tema actual:', gameState.currentTheme);
    
    if (newTheme === gameState.currentTheme) return;
    
    mutations.setTheme(newTheme);
    
    // Actualizar botones activos
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === newTheme) {
            btn.classList.add('active');
        }
    });
    
    // Cargar datos del tema
    const themeConfig = getThemeConfig(newTheme);
    
    if (!themeConfig) {
        console.error('❌ No se encontró configuración para el tema:', newTheme);
        return;
    }
    
    mutations.setDataSource(themeConfig.data);
    
    // Esperar un momento para que los datos se carguen completamente
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('🎯 DataSource actualizado:', gameState.currentDataSource?.length);
    
    // 🛡️ GUARDRAIL: Validar que los datos corresponden al tema
    if (!gameState.currentDataSource || gameState.currentDataSource.length === 0) {
        console.error('❌ Error: No se cargaron datos para el tema:', newTheme);
        return;
    }
    
    const firstItemName = gameState.currentDataSource[0]?.name?.toLowerCase() || '';
    const themeName = newTheme.toLowerCase();
    
    console.log('🛡️ Guardrail - Primer item:', firstItemName);
    console.log('🛡️ Guardrail - Tema esperado:', themeName);
    
    // Validación específica para logaritmos
    if (themeName === 'logaritmos' && !firstItemName.includes('logaritmo') && !firstItemName.includes('log')) {
        console.error('❌ ERROR CRÍTICO: Los datos no corresponden a logaritmos. Primer item:', firstItemName);
        console.error('❌ Posible mezcla de datos o tema incorrecto');
        return;
    }
    
    // Validación específica para geometría
    if (themeName === 'geometry' && !firstItemName.includes('cuadrado') && !firstItemName.includes('triángulo') && !firstItemName.includes('círculo')) {
        console.error('❌ ERROR CRÍTICO: Los datos no corresponden a geometría. Primer item:', firstItemName);
        return;
    }
    
    console.log('✅ Guardrail validado - Datos correctos para el tema:', newTheme);
    
    // Actualizar instrucciones
    const instruction = document.getElementById('instructionText');
    instruction.textContent = gameState.currentMode === 'practice'
        ? themeConfig.practiceInstruction
        : themeConfig.instruction;
    
    // Actualizar títulos de secciones
    const figuresTitle = document.getElementById('figuresTitle');
    const formulasTitle = document.getElementById('formulasTitle');
    
    if (figuresTitle) {
        figuresTitle.textContent = themeConfig.name === 'Geometría' ? '📐 Figuras' : '📊 Conceptos';
    }
    if (formulasTitle) {
        formulasTitle.textContent = '📝 Fórmulas';
    }
    
    // Reiniciar el juego con el nuevo tema
    if (gameState.currentMode === 'classic') {
        newGame();
    } else {
        startPractice();
    }
}

// ══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ══════════════════════════════════════════════════════════════

export function initializeRouter() {
    console.log('🔄 Inicializando router...');
    
    // Configurar event listeners para modo
    document.getElementById('modeSelect').addEventListener('change', onModeChange);
    
    // Configurar event listeners para botones de tema
    document.getElementById('functionsBtn').addEventListener('click', () => {
        onThemeChange('functions');
    });
    
    document.getElementById('inequalitiesBtn').addEventListener('click', () => {
        onThemeChange('inequalities');
    });
    
    document.getElementById('geometryBtn').addEventListener('click', () => {
        onThemeChange('geometry');
    });
    
    document.getElementById('absoluteValueBtn').addEventListener('click', () => {
        onThemeChange('absolute-value');
    });
    
    document.getElementById('intervalsBtn').addEventListener('click', () => {
        onThemeChange('intervals');
    });
    
    // Event listeners para botones del Parcial 2
    console.log('🔍 Buscando botones del Parcial 2...');
    const trigonometriaBtn = document.getElementById('trigonometriaBtn');
    const vectoresBtn = document.getElementById('vectoresBtn');
    const homograficasBtn = document.getElementById('homograficasBtn');
    const inyectivasBtn = document.getElementById('inyectivasBtn');
    
    console.log('🔍 Botones encontrados:');
    console.log('  trigonometriaBtn:', trigonometriaBtn);
    console.log('  vectoresBtn:', vectoresBtn);
    console.log('  homograficasBtn:', homograficasBtn);
    console.log('  inyectivasBtn:', inyectivasBtn);
    
    if (trigonometriaBtn) {
        trigonometriaBtn.addEventListener('click', async () => {
            console.log('🎯 Clic en trigonometriaBtn - cambiando a trigonometria');
            await onThemeChange('trigonometria');
        });
    } else {
        console.error('❌ No se encontró el botón trigonometriaBtn');
    }
    
    if (vectoresBtn) {
        vectoresBtn.addEventListener('click', async () => {
            console.log('🎯 Clic en vectoresBtn - cambiando a vectores');
            await onThemeChange('vectores');
        });
    } else {
        console.error('❌ No se encontró el botón vectoresBtn');
    }
    
    if (homograficasBtn) {
        homograficasBtn.addEventListener('click', async () => {
            console.log('🎯 Clic en homograficasBtn - cambiando a homograficas');
            await onThemeChange('homograficas');
        });
    } else {
        console.error('❌ No se encontró el botón homograficasBtn');
    }
    
    if (inyectivasBtn) {
        inyectivasBtn.addEventListener('click', async () => {
            console.log('🎯 Clic en inyectivasBtn - cambiando a inyectivas');
            await onThemeChange('inyectivas');
        });
    } else {
        console.error('❌ No se encontró el botón inyectivasBtn');
    }
    
    // Configurar event listeners para modales y botones de tema y modo
    document.getElementById('figuresTitle').addEventListener('click', () => import('./ui.js').then(ui => ui.openFiguresModal()));
    document.getElementById('formulasTitle').addEventListener('click', () => import('./ui.js').then(ui => ui.openFormulasModal()));
    
    // Event listener para cambio de dificultad
    const difficultySelect = document.getElementById('difficultySelect');
    if (difficultySelect) {
        difficultySelect.addEventListener('change', onDifficultyChange);
        // Establecer valor inicial
        difficultySelect.value = gameState.currentDifficulty;
    }
    
    // Configurar botones de cierre de modales
    document.getElementById('closeFiguresModal').addEventListener('click', () => {
        import('./ui.js').then(ui => ui.closeFiguresModal());
    });
    
    document.getElementById('closeFormulasModal').addEventListener('click', () => {
        import('./ui.js').then(ui => ui.closeFormulasModal());
    });
    
    // Cerrar modales al hacer clic fuera
    document.getElementById('figuresModal').addEventListener('click', (e) => {
        if (e.target.id === 'figuresModal') {
            import('./ui.js').then(ui => ui.closeFiguresModal());
        }
    });
    
    document.getElementById('formulasModal').addEventListener('click', (e) => {
        if (e.target.id === 'formulasModal') {
            import('./ui.js').then(ui => ui.closeFormulasModal());
        }
    });
    
    // Cerrar modal de teoría de Gauss-Jordan
    document.getElementById('closeGJTheoryModal').addEventListener('click', () => {
        import('./ui.js').then(ui => ui.closeGJTheoryModal());
    });
    
    document.getElementById('gjTheoryModal').addEventListener('click', (e) => {
        if (e.target.id === 'gjTheoryModal') {
            import('./ui.js').then(ui => ui.closeGJTheoryModal());
        }
    });
    
    // Botón de nuevo juego
    document.getElementById('newGameBtn').addEventListener('click', () => {
        if (gameState.currentMode === 'classic') {
            newGame();
        } else {
            startPractice();
        }
    });
    
    // Botón volver a classic
    document.getElementById('backClassicBtn').addEventListener('click', () => {
        switchToClassic();
    });
    
    console.log('🎯 Router inicializado - esperando selección de tema');
}

// ══════════════════════════════════════════════════════════════
// UTILIDADES DE NAVEGACIÓN
// ══════════════════════════════════════════════════════════════

export function onDifficultyChange() {
    const sel = document.getElementById('difficultySelect');
    gameState.currentDifficulty = sel.value;
    
    console.log('🎚️ Dificultad cambiada a:', gameState.currentDifficulty);
    
    // Actualizar badge
    const badge = document.getElementById('diffBadge');
    if (badge) {
        badge.textContent = gameState.currentDifficulty.charAt(0).toUpperCase() + gameState.currentDifficulty.slice(1);
        badge.className = 'diff-badge ' + gameState.currentDifficulty;
    }
    
    // Generar nuevo ejercicio si estamos en modo practice
    if (gameState.currentMode === 'practice') {
        import('./game.js').then(game => game.startPractice());
    }
}

export function navigateToTheme(theme) {
    onThemeChange(theme);
}
