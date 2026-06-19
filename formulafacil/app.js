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

            // Obtener estado actual de forma síncrona
            const { gameState } = await import('./core/state.js');
            const currentTheme = gameState.currentTheme;
            const currentMode = gameState.currentMode;
            
            const temasParcial1 = ['geometry', 'functions', 'inequalities', 'absolute-value', 'intervals'];
            const temasParcial2 = ['logaritmos', 'trigonometria', 'vectores', 'homograficas', 'inyectivas'];
            
            console.log('🔄 Cambiando a Parcial', parcial);
            console.log('📋 Tema actual:', currentTheme);
            console.log('📋 Modo actual:', currentMode);

            if (parcial === '1') {
                console.log('🔄 Mostrando Parcial 1, ocultando Parcial 2');
                selector1.style.display = '';
                selector2.style.display = 'none';
                
                // Siempre ir a Geometría cuando volvemos al Parcial 1
                console.log('🔄 Volviendo al Parcial 1 - Forzando Geometría');
                // Quitar active de todos los botones de tema
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                const geometryBtn = document.getElementById('geometryBtn');
                if (geometryBtn) geometryBtn.classList.add('active');
                // Usar onThemeChange para cargar todo correctamente
                const { onThemeChange } = await import('./core/router.js');
                await onThemeChange('geometry');
            } else {
                console.log('🔄 Mostrando Parcial 2, ocultando Parcial 1');
                selector1.style.display = 'none';
                selector2.style.display = '';
                console.log('🔄 themeSelector2 display:', selector2.style.display);
                
                // Para Parcial 2, simplemente ir al primer tema sin mapeo
                console.log('🎯 Ir al primer tema del Parcial 2');
                console.log('🔍 Buscando botones en themeSelector2:', selector2);
                // Quitar active de todos los botones de tema
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                const firstBtn = selector2.querySelector('.theme-btn');
                console.log('🔍 Primer botón encontrado:', firstBtn);
                console.log('🔍 Botón trigonometriaBtn:', document.getElementById('trigonometriaBtn'));
                if (firstBtn) firstBtn.classList.add('active');
                // Usar onThemeChange para cargar todo correctamente
                const { onThemeChange } = await import('./core/router.js');
                await onThemeChange('trigonometria');
            }
        });
    });
});
