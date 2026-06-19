// ══════════════════════════════════════════════════════════════
// MEMORIZA FÓRMULAS MATEMÁTICAS - PUNTO DE ENTRADA PRINCIPAL
// Versión 4.0 - Arquitectura Modular ES6
// ══════════════════════════════════════════════════════════════

import { initAudio } from './core/audio.js';
import { initializeRouter } from './core/router.js';
import { verifyMathJaxLoaded, setupMathJaxObserver, showMathJaxLoading } from './core/mathjax-check.js';

// ══════════════════════════════════════════════════════════════
// INICIALIZACIÓN PRINCIPAL
// ══════════════════════════════════════════════════════════════

async function initializeApp() {
    try {
        console.log('🚀 Iniciando aplicación...');
        
        // Verificar MathJax
        verifyMathJaxLoaded();
        setupMathJaxObserver();
        showMathJaxLoading();
        
        // Inicializar audio
        initAudio();
        console.log('🔊 Audio inicializado');
        
        // Inicializar sistema de navegación
        initializeRouter();
        console.log('🧭 Router inicializado');
        
        // Esperar un momento para que todo se cargue
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Inicializar el estado del juego
        const { gameState, mutations } = await import('./core/state.js');
        
        // Inicializar juego en modo classic por defecto
        mutations.setMode('classic');
        
        // Cargar geometría por defecto al inicio
        console.log('🔄 Cargando geometría por defecto al inicio...');
        
        // Asegurar que el selector1 esté visible
        const selector1 = document.getElementById('themeSelector1');
        const selector2 = document.getElementById('themeSelector2');
        if (selector1) selector1.style.display = '';
        if (selector2) selector2.style.display = 'none';
        
        // Activar botón de geometría
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        const geometryBtn = document.getElementById('geometryBtn');
        if (geometryBtn) geometryBtn.classList.add('active');
        
        // Cargar tema geometría
        const { onThemeChange } = await import('./core/router.js');
        await onThemeChange('geometry');
        
        console.log('✅ Geometría cargada por defecto');
        
        console.log('✅ Fórmula Fácil - Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
    }
}

// ══════════════════════════════════════════════════════════════
// INICIO DE LA APLICACIÓN
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    const selector1 = document.getElementById('themeSelector1');
    const selector2 = document.getElementById('themeSelector2');

    document.querySelectorAll('.parcial-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const parcial = btn.dataset.parcial;

            // Actualizar botones activos
            document.querySelectorAll('.parcial-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const { gameState, mutations } = await import('./core/state.js');
            const currentTheme = gameState.currentTheme;
            const currentMode = gameState.currentMode;
            
            const temasParcial1 = ['geometry', 'functions', 'inequalities', 'absolute-value', 'intervals'];
            const temasParcial2 = ['logaritmos', 'trigonometria', 'vectores', 'homograficas', 'inyectivas'];
            
            console.log('🔄 Cambiando a Parcial', parcial);
            console.log('📋 Tema actual:', currentTheme);
            console.log('📋 Modo actual:', currentMode);

            const toolsSelector = document.getElementById('themeSelectorTools');

            if (parcial === 'tools') {
                console.log('🔄 Mostrando Herramientas');
                selector1.style.display = 'none';
                selector2.style.display = 'none';
                toolsSelector.style.display = '';

                const { openGaussJordan } = await import('./core/gauss-jordan.js');
                openGaussJordan();
                mutations.setParcial('tools');
                return;
            }

            // Ocultar herramientas si estaban visibles
            if (toolsSelector) toolsSelector.style.display = 'none';

            const { closeGaussJordan } = await import('./core/gauss-jordan.js');

            if (parcial === '1') {
                console.log('🔄 Mostrando Parcial 1, ocultando Parcial 2');
                closeGaussJordan();
                selector1.style.display = '';
                selector2.style.display = 'none';
                
                console.log('🔄 Volviendo al Parcial 1 - Forzando Geometría');
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                const geometryBtn = document.getElementById('geometryBtn');
                if (geometryBtn) geometryBtn.classList.add('active');
                const { onThemeChange } = await import('./core/router.js');
                await onThemeChange('geometry');
            } else {
                console.log('🔄 Mostrando Parcial 2, ocultando Parcial 1');
                closeGaussJordan();
                selector1.style.display = 'none';
                selector2.style.display = '';
                
                console.log('🎯 Ir al primer tema del Parcial 2');
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                const firstBtn = selector2.querySelector('.theme-btn');
                if (firstBtn) firstBtn.classList.add('active');
                const { onThemeChange } = await import('./core/router.js');
                await onThemeChange('trigonometria');
            }
        });
    });
});
