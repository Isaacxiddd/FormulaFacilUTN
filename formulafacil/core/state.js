// ══════════════════════════════════════════════════════════════
// ESTADO GLOBAL DE LA APLICACIÓN
// ══════════════════════════════════════════════════════════════

export const gameState = {
    // MODO CLASSIC
    selectedFigure: null,
    selectedFormula: null,
    totalAttempts: 0,
    correctAttempts: 0,
    streak: 0,
    currentFigures: [],
    currentFormulas: [],
    
    // SISTEMA DE MODOS Y TEMAS
    currentMode: 'classic',
    currentTheme: null,
    currentDataSource: null,
    currentDifficulty: 'medium',
    currentParcial: 1,
    currentTool: null,
    
    // UI
    tipTimeout: null,
    tipBarInterval: null,
    isProcessingAnswer: false,
    
    // CONSTANTES
    CARDS_PER_SIDE: 5
};

export const mutations = {
    setSelectedFigure(figure) {
        gameState.selectedFigure = figure;
    },
    
    setSelectedFormula(formula) {
        gameState.selectedFormula = formula;
    },
    
    incrementAttempts(correct = false) {
        gameState.totalAttempts++;
        if (correct) {
            gameState.correctAttempts++;
            gameState.streak++;
        } else {
            gameState.streak = 0;
        }
    },
    
    resetGame() {
        gameState.selectedFigure = null;
        gameState.selectedFormula = null;
        gameState.totalAttempts = 0;
        gameState.correctAttempts = 0;
        gameState.streak = 0;
        gameState.currentFigures = [];
        gameState.currentFormulas = [];
    },
    
    setMode(mode) {
        gameState.currentMode = mode;
    },
    
    setTheme(theme) {
        console.log('🔄 setTheme llamado con:', theme);
        console.log('🔄 Tema anterior:', gameState.currentTheme);
        gameState.currentTheme = theme;
        console.log('🔄 Tema nuevo:', gameState.currentTheme);
    },
    
    setDataSource(source) {
        console.log('🔄 setDataSource llamado con:', source?.length, 'items');
        console.log('🔄 Tipo de source:', typeof source);
        gameState.currentDataSource = source;
    },
    
    setCurrentFigures(figures) {
        gameState.currentFigures = figures;
    },
    
    setCurrentFormulas(formulas) {
        gameState.currentFormulas = formulas;
    },

    setParcial(parcial) {
        gameState.currentParcial = parcial;
    }
};

export const getters = {
    getAccuracy() {
        return gameState.totalAttempts === 0 ? 0 : Math.round((gameState.correctAttempts / gameState.totalAttempts) * 100);
    },
    
    isClassicMode() {
        return gameState.currentMode === 'classic';
    },
    
    isPracticeMode() {
        return gameState.currentMode === 'practice';
    }
};
