import { GaussJordanEngine } from './engine.js';
import { parseOperation } from './parser.js';
import { generateExerciseBySize } from './exercises.js';

let engine = null;
let guidedMode = true;
let currentExercise = null;

export function initGaussJordan(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="gj-header">
            <button class="gj-back-btn" id="gjBackBtn">← Volver</button>
            <h2>⊞ Eliminación Gauss-Jordan</h2>
            <button class="gj-btn gj-theory-btn" id="gjTheoryBtn">📖 Teoría</button>
        </div>

        <div class="gj-toolbar">
            <div class="gj-toolbar-row">
                <select id="gjSizeSelect">
                    <option value="2">2×2</option>
                    <option value="3" selected>3×3</option>
                    <option value="4">4×4</option>
                </select>
                <button class="gj-btn" id="gjNewBtn">🔄 Nuevo sistema</button>
                <button class="gj-btn" id="gjHintBtn">💡 Pista</button>
            </div>
            <div class="gj-toolbar-row">
                <label class="gj-guided-toggle">
                    <input type="checkbox" id="gjGuidedToggle" checked>
                    <span>Modo guiado</span>
                </label>
            </div>
        </div>

        <div class="gj-exercise" id="gjExercise"></div>

        <div class="gj-matrix-container">
            <div class="gj-matrix-scroll">
                <div id="gjMatrixWrapper"></div>
            </div>
        </div>

        <div class="gj-controls">
            <div class="gj-input-row">
                <input type="text" id="gjOpInput" placeholder='R2 = 2*R2 - R1' autocomplete="off" spellcheck="false">
                <button class="gj-btn gj-btn-primary" id="gjApplyBtn">Aplicar</button>
            </div>
            <div class="gj-error" id="gjError"></div>
        </div>

        <div class="gj-actions">
            <button class="gj-btn" id="gjUndoBtn">◀ Deshacer</button>
            <button class="gj-btn" id="gjResetBtn">↺ Reiniciar</button>
        </div>

        <div class="gj-history" id="gjHistory">
            <h3>📋 Historial</h3>
            <div id="gjHistoryList"></div>
        </div>

        <div class="gj-solution" id="gjSolution" style="display:none">
            <div class="gj-solution-icon">🎉</div>
            <div class="gj-solution-title">¡Sistema resuelto!</div>
            <div class="gj-solution-values" id="gjSolutionValues"></div>
        </div>
    `;

    // Bind events
    document.getElementById('gjBackBtn').addEventListener('click', () => {
        document.getElementById('gaussJordanView').style.display = 'none';
        document.getElementById('mainAppView').style.display = 'block';

        document.querySelectorAll('.parcial-btn').forEach(b => b.classList.remove('active'));
        const parcial1 = document.querySelector('.parcial-btn[data-parcial="1"]');
        if (parcial1) parcial1.classList.add('active');

        const s1 = document.getElementById('themeSelector1');
        const s2 = document.getElementById('themeSelector2');
        const st = document.getElementById('themeSelectorTools');
        if (s1) s1.style.display = '';
        if (s2) s2.style.display = 'none';
        if (st) st.style.display = 'none';
    });

    document.getElementById('gjTheoryBtn').addEventListener('click', () => {
        document.getElementById('gjTheoryModal').classList.add('active');
    });
    document.getElementById('closeGJTheoryModal').addEventListener('click', closeTheoryModal);
    document.getElementById('gjTheoryModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('gjTheoryModal')) closeTheoryModal();
    });
    function closeTheoryModal() {
        document.getElementById('gjTheoryModal').classList.remove('active');
    }

    document.getElementById('gjGuidedToggle').addEventListener('change', (e) => {
        guidedMode = e.target.checked;
    });

    document.getElementById('gjNewBtn').addEventListener('click', () => {
        newExercise();
    });

    document.getElementById('gjApplyBtn').addEventListener('click', () => {
        applyOperation();
    });

    document.getElementById('gjOpInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyOperation();
    });

    document.getElementById('gjUndoBtn').addEventListener('click', undoOperation);
    document.getElementById('gjResetBtn').addEventListener('click', resetExercise);
    document.getElementById('gjHintBtn').addEventListener('click', showHint);

    newExercise();
}

function newExercise() {
    const sizeSelect = document.getElementById('gjSizeSelect');
    const n = parseInt(sizeSelect.value);

    currentExercise = generateExerciseBySize(n);
    engine = new GaussJordanEngine(currentExercise.augmentedMatrix);

    renderExercise();
    renderMatrix();
    renderHistory();
    document.getElementById('gjSolution').style.display = 'none';
    document.getElementById('gjError').textContent = '';
    document.getElementById('gjOpInput').value = '';
    document.getElementById('gjOpInput').focus();
}

function renderExercise() {
    const el = document.getElementById('gjExercise');
    const eqs = currentExercise.equations;
    el.innerHTML = `
        <div class="gj-exercise-header">
            <span class="gj-exercise-icon">📐</span>
            <span>Sistema de ${currentExercise.size}×${currentExercise.size}</span>
        </div>
        <div class="gj-equations">
            ${eqs.map(eq => `<div class="gj-equation">${eq}</div>`).join('')}
        </div>
    `;
}

function renderMatrix() {
    if (!engine) return;
    const M = engine.matrix;
    const n = engine.size;

    let html = '<table class="gj-matrix-table"><tbody>';
    for (let i = 0; i < n; i++) {
        html += '<tr>';
        html += `<td class="gj-row-label">R${i + 1}</td>`;
        for (let j = 0; j < engine.cols; j++) {
            const cls = engine.getCellClass(i, j);
            const val = engine.getCellValue(i, j);
            if (j === engine.cols - 1) {
                html += `<td class="gj-sep"></td>`;
            }
            html += `<td class="${cls}">${val}</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';

    document.getElementById('gjMatrixWrapper').innerHTML = html;
}

function renderHistory() {
    if (!engine) return;
    const list = document.getElementById('gjHistoryList');
    const hist = engine.history;

    if (hist.length === 0) {
        list.innerHTML = '<div class="gj-history-empty">Todavía no aplicaste ninguna operación</div>';
        return;
    }

    list.innerHTML = '<div class="gj-history-list">' +
        hist.map((op) => {
            let desc = '';
            if (op.type === 'swap') {
                desc = `↔ Intercambiar R${op.row1+1} ↔ R${op.row2+1}`;
            } else if (op.type === 'rowop') {
                const terms = op.coefficients.map(c => {
                    const cStr = c.coeff === 1 ? '' : c.coeff === -1 ? '-' : `${c.coeff}*`;
                    return `${cStr}R${c.row+1}`;
                });
                desc = `R${op.target+1} = ${terms.join(' + ').replace(/\+ -/g, '- ')}`;
            }
            return `<div class="gj-history-item">${desc}</div>`;
        }).join('') +
        '</div>';
}

function applyOperation() {
    const input = document.getElementById('gjOpInput');
    const errorEl = document.getElementById('gjError');
    const raw = input.value.trim();

    if (!raw) {
        errorEl.textContent = 'Escribí una operación';
        return;
    }

    const op = parseOperation(raw);
    if (op.error) {
        errorEl.textContent = op.error;
        return;
    }

    if (guidedMode && engine) {
        const validation = engine.validateOperation(op);
        if (!validation.valid) {
            errorEl.textContent = validation.message;
            return;
        }
    }

    errorEl.textContent = '';

    const result = engine.applyOperation(op);
    if (result.error) {
        errorEl.textContent = result.error;
        return;
    }

    input.value = '';
    renderMatrix();
    renderHistory();

    if (engine.solved) {
        showSolution();
    }
}

function undoOperation() {
    if (!engine) return;
    engine.undo();
    renderMatrix();
    renderHistory();
    document.getElementById('gjSolution').style.display = 'none';
    document.getElementById('gjError').textContent = '';
}

function resetExercise() {
    if (!engine) return;
    engine.reset();
    renderMatrix();
    renderHistory();
    document.getElementById('gjSolution').style.display = 'none';
    document.getElementById('gjError').textContent = '';
    document.getElementById('gjOpInput').value = '';
}

function showHint() {
    if (!engine) return;
    const errorEl = document.getElementById('gjError');
    const hint = engine.getHint();

    if (hint.operation) {
        document.getElementById('gjOpInput').value = hint.operation;
    }
    errorEl.textContent = hint.message;
}

function showSolution() {
    const solEl = document.getElementById('gjSolution');
    const valEl = document.getElementById('gjSolutionValues');
    solEl.style.display = 'block';

    const sol = engine.solution;
    if (!sol) {
        valEl.innerHTML = 'El sistema no tiene solución única.';
        return;
    }

    valEl.innerHTML = Object.entries(sol)
        .map(([k, v]) => `<div class="gj-sol-item"><span class="gj-sol-var">${k}</span> = <span class="gj-sol-val">${v}</span></div>`)
        .join('');
}
