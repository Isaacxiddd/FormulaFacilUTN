import { GaussJordanEngine } from './engine.js';
import { parseOperation } from './parser.js';
import { generateExerciseBySize } from './exercises.js';

let engine = null;
let guidedMode = true;
let currentExercise = null;

const THEORY_HTML = `
<div class="gj-theory">
    <div class="gj-theory-header" id="gjTheoryToggle">
        <span class="gj-theory-icon">📖</span>
        <span class="gj-theory-title">¿Cómo funciona Gauss-Jordan?</span>
        <span class="gj-theory-arrow">▼</span>
    </div>
    <div class="gj-theory-body" id="gjTheoryBody">

        <div class="gj-theory-section">
            <h4>¿Qué es una matriz aumentada?</h4>
            <p>Un sistema de ecuaciones lineales se puede escribir como una <strong>matriz aumentada</strong>. 
            Los coeficientes de las variables van a la izquierda y los términos independientes a la derecha, 
            separados por una línea vertical.</p>
            <div class="gj-theory-example">
                <div class="gj-theory-eq">
                    2x + 3y - z = 5<br>
                    4x - y + 2z = 3<br>
                    -2x + y + 3z = 4
                </div>
                <div class="gj-theory-arrow-eq">→</div>
                <div class="gj-theory-mat">
                    [2   3  -1 | 5]<br>
                    [4  -1   2 | 3]<br>
                    [-2  1   3 | 4]
                </div>
            </div>
        </div>

        <div class="gj-theory-section">
            <h4>Tipos de sistemas</h4>
            <div class="gj-theory-types">
                <div class="gj-theory-type gj-type-scd">
                    <div class="gj-type-badge">SCD</div>
                    <strong>Compatible Determinado</strong>
                    <span>Solución única. Una variable = un valor.</span>
                </div>
                <div class="gj-theory-type gj-type-sci">
                    <div class="gj-type-badge">SCI</div>
                    <strong>Compatible Indeterminado</strong>
                    <span>Infinitas soluciones. Hay variables libres.</span>
                </div>
                <div class="gj-theory-type gj-type-si">
                    <div class="gj-type-badge">SI</div>
                    <strong>Incompatible</strong>
                    <span>Sin solución. Una ecuación es contradictoria.</span>
                </div>
            </div>
            <p class="gj-theory-note">Los ejercicios acá generados son siempre <strong>SCD</strong> para practicar.</p>
        </div>

        <div class="gj-theory-section">
            <h4>💡 Tips prácticos — mirá la matriz</h4>
            <table class="gj-theory-ops">
                <tr>
                    <td class="gj-ops-icon">🔍</td>
                    <td><strong>Filas proporcionales → SCI o SI</strong></td>
                    <td class="gj-ops-desc">Si una fila es múltiplo exacto de otra, algo raro pasa. Fijate el RHS: si también es múltiplo → <strong>SCI</strong> (infinitas soluciones). Si no → <strong>SI</strong> (incompatible).</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">0️⃣</td>
                    <td><strong>Fila de ceros → determinante cero</strong></td>
                    <td class="gj-ops-desc">Si al triangular te queda una fila [0 0 ... | c], detectaste <strong>SI</strong> si c ≠ 0, o <strong>SCI</strong> si c = 0. ¡Bien ahí!</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">📏</td>
                    <td><strong>Contá pivotes</strong></td>
                    <td class="gj-ops-desc"><strong>N pivotes = N variables → SCD.</strong> Faltan pivotes → hay variables libres → SCI. Siempre verificarlo al final.</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">⚡</td>
                    <td><strong>Si el pivote es 1, mejor</strong></td>
                    <td class="gj-ops-desc">Antes de eliminar, si el pivote es 1 no vas a tener fracciones. Si no es 1, podés dividir la fila primero o usar fracciones.</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">🔄</td>
                    <td><strong>No hay pivote → intercambiá filas</strong></td>
                    <td class="gj-ops-desc">Si en la diagonal tenés un cero, fijate si intercambiando filas aparece un número distinto de cero. Si no hay ninguna fila con pivote → esa columna es variable libre.</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">🧮</td>
                    <td><strong>Modo guiado activado</strong></td>
                    <td class="gj-ops-desc">Te va marcando qué cero crear y con qué operación. Si te perdés, apretá 💡 Pista y se autocompleta la operación correcta.</td>
                </tr>
            </table>
        </div>

        <div class="gj-theory-section">
            <h4>Operaciones permitidas (no cambian la solución)</h4>
            <table class="gj-theory-ops">
                <tr>
                    <td class="gj-ops-icon">🔄</td>
                    <td><strong>Intercambiar filas</strong></td>
                    <td><code>R2 ↔ R3</code></td>
                    <td class="gj-ops-desc">Cambiás el orden de las ecuaciones.</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">✖️</td>
                    <td><strong>Multiplicar una fila por escalar ≠ 0</strong></td>
                    <td><code>R1 = 2*R1</code></td>
                    <td class="gj-ops-desc">Escalás toda una ecuación.</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">➕</td>
                    <td><strong>Sumar múltiplo de otra fila</strong></td>
                    <td><code>R2 = R2 - 2*R1</code></td>
                    <td class="gj-ops-desc">Eliminás variables combinando ecuaciones.</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">➗</td>
                    <td><strong>Dividir una fila por escalar ≠ 0</strong></td>
                    <td><code>R1 = R1 / 2</code></td>
                    <td class="gj-ops-desc">Normalizás para que el pivote sea 1.</td>
                </tr>
            </table>
        </div>

        <div class="gj-theory-section">
            <h4>⚠️ Operaciones NO permitidas</h4>
            <table class="gj-theory-ops gj-theory-forbidden">
                <tr>
                    <td class="gj-ops-icon">🚫</td>
                    <td><strong>Multiplicar o dividir por cero</strong></td>
                    <td class="gj-ops-desc">Pierde información o divide por cero.</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">🚫</td>
                    <td><strong>Multiplicar solo un término</strong></td>
                    <td class="gj-ops-desc">Toda la fila se multiplica, no un elemento.</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">🚫</td>
                    <td><strong>Sumar una constante a una fila</strong></td>
                    <td class="gj-ops-desc">Solo se pueden sumar múltiplos de <em>otras filas</em>.</td>
                </tr>
                <tr>
                    <td class="gj-ops-icon">🚫</td>
                    <td><strong>Modificar la columna de resultados sola</strong></td>
                    <td class="gj-ops-desc">La operación afecta a toda la fila, RHS incluido.</td>
                </tr>
            </table>
        </div>

        <div class="gj-theory-section">
            <h4>El método paso a paso</h4>
            <ol class="gj-theory-steps">
                <li><strong>Eliminación hacia adelante:</strong> creamos ceros <em>debajo</em> de cada pivote (columna por columna, de izquierda a derecha).</li>
                <li><strong>Eliminación hacia atrás:</strong> creamos ceros <em>arriba</em> de cada pivote (de derecha a izquierda).</li>
                <li><strong>Normalización:</strong> dividimos cada fila por su pivote para que quede 1.</li>
                <li>Al final, la matriz queda en su <strong>forma reducida</strong> y la solución se lee directamente.</li>
            </ol>
        </div>

        <div class="gj-theory-section">
            <h4>Leyenda de colores</h4>
            <div class="gj-theory-legend">
                <span class="gj-legend-item"><span class="gj-legend-swatch" style="background:#bbdefb;border:2px solid #1565c0"></span> Pivote (elemento diagonal)</span>
                <span class="gj-legend-item"><span class="gj-legend-swatch" style="background:transparent;color:#2e7d32;font-weight:700">0</span> Cero creado en esa posición</span>
                <span class="gj-legend-item"><span class="gj-legend-swatch" style="background:#f3e5f5"></span> Fila modificada en el último paso</span>
                <span class="gj-legend-item"><span class="gj-legend-swatch" style="background:transparent;color:#00695c;font-weight:600">#</span> Término independiente</span>
            </div>
        </div>

    </div>
</div>
`;

export function initGaussJordan(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="gj-header">
            <button class="gj-back-btn" id="gjBackBtn">← Volver</button>
            <h2>⊞ Eliminación Gauss-Jordan</h2>
        </div>

        ${THEORY_HTML}

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

    document.getElementById('gjTheoryToggle').addEventListener('click', () => {
        const body = document.getElementById('gjTheoryBody');
        const arrow = document.querySelector('.gj-theory-arrow');
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        arrow.textContent = isOpen ? '▶' : '▼';
    });

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
