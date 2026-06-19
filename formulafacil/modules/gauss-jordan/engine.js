const EPS = 1e-10;

export class GaussJordanEngine {
    constructor(augmentedMatrix) {
        this.size = augmentedMatrix.length;
        this.cols = augmentedMatrix[0].length;
        this.originalMatrix = augmentedMatrix.map(r => [...r]);
        this.matrix = augmentedMatrix.map(r => [...r]);
        this.history = [];
        this.solved = false;
        this.solution = null;

        this._buildExpectedSequence();
    }

    // ─── Expected sequence (for guided mode) ───

    _buildExpectedSequence() {
        this.expected = [];
        const n = this.size;
        const mat = this.matrix;

        // 1) Forward elimination: zeros below pivots
        for (let p = 0; p < n - 1; p++) {
            for (let r = p + 1; r < n; r++) {
                const pivot = mat[p][p];
                const target = mat[r][p];
                if (Math.abs(pivot) < EPS) continue;
                if (Math.abs(target) < EPS) continue;
                this.expected.push({
                    phase: 'forward',
                    pivotRow: p,
                    pivotCol: p,
                    targetRow: r,
                    desc: `Cero en (${r+1},${p+1}) usando R${p+1}`,
                });
            }
        }

        // 2) Backward elimination: zeros above pivots
        for (let p = n - 1; p > 0; p--) {
            for (let r = p - 1; r >= 0; r--) {
                const pivot = mat[p][p];
                const target = mat[r][p];
                if (Math.abs(pivot) < EPS) continue;
                if (Math.abs(target) < EPS) continue;
                this.expected.push({
                    phase: 'backward',
                    pivotRow: p,
                    pivotCol: p,
                    targetRow: r,
                    desc: `Cero en (${r+1},${p+1}) usando R${p+1}`,
                });
            }
        }

        // 3) Normalize each row
        for (let r = 0; r < n; r++) {
            const pivot = mat[r][r];
            if (Math.abs(pivot) > EPS && Math.abs(pivot - 1) > EPS) {
                this.expected.push({
                    phase: 'normalize',
                    row: r,
                    desc: `Normalizar R${r+1} (÷ ${pivot})`,
                });
            }
        }
    }

    // ─── Apply operation ───

    applyOperation(op) {
        if (op.type === 'swap') {
            const tmp = this.matrix[op.row1];
            this.matrix[op.row1] = this.matrix[op.row2];
            this.matrix[op.row2] = tmp;
        } else if (op.type === 'rowop') {
            const newRow = new Array(this.cols).fill(0);
            for (const { row, coeff } of op.coefficients) {
                if (row < 0 || row >= this.size) continue;
                for (let j = 0; j < this.cols; j++) {
                    newRow[j] += coeff * this.matrix[row][j];
                }
            }
            this.matrix[op.target] = newRow;
        } else {
            return { error: 'Operación desconocida' };
        }

        this.history.push(op);
        this._checkSolved();
        return { success: true };
    }

    // ─── Undo ───

    undo() {
        if (this.history.length === 0) return false;
        this.history.pop();
        this._rebuild();
        return true;
    }

    // ─── Reset ───

    reset() {
        this.matrix = this.originalMatrix.map(r => [...r]);
        this.history = [];
        this.solved = false;
        this.solution = null;
    }

    // ─── Helpers ───

    _rebuild() {
        this.matrix = this.originalMatrix.map(r => [...r]);
        for (const op of this.history) {
            if (op.type === 'swap') {
                const tmp = this.matrix[op.row1];
                this.matrix[op.row1] = this.matrix[op.row2];
                this.matrix[op.row2] = tmp;
            } else if (op.type === 'rowop') {
                const newRow = new Array(this.cols).fill(0);
                for (const { row, coeff } of op.coefficients) {
                    for (let j = 0; j < this.cols; j++) {
                        newRow[j] += coeff * this.matrix[row][j];
                    }
                }
                this.matrix[op.target] = newRow;
            }
        }
        this._checkSolved();
    }

    _checkSolved() {
        const n = this.size;
        const m = this.cols;
        const M = this.matrix;

        // Quick check: matrix is in RREF
        for (let i = 0; i < n; i++) {
            let lead = -1;
            for (let j = 0; j < m - 1; j++) {
                if (Math.abs(M[i][j]) > EPS) {
                    lead = j;
                    break;
                }
            }
            if (lead === -1) {
                // Zero row — must have zero RHS
                if (Math.abs(M[i][m - 1]) > EPS) {
                    this.solved = false;
                    this.solution = null;
                    return;
                }
                continue;
            }
            // Leading entry must be 1
            if (Math.abs(M[i][lead] - 1) > EPS) {
                this.solved = false;
                this.solution = null;
                return;
            }
            // Column must be all zeros except pivot
            for (let k = 0; k < n; k++) {
                if (k !== i && Math.abs(M[k][lead]) > EPS) {
                    this.solved = false;
                    this.solution = null;
                    return;
                }
            }
        }

        // Extract solution
        this.solved = true;
        this.solution = {};
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m - 1; j++) {
                if (Math.abs(M[i][j] - 1) < EPS) {
                    const val = Math.abs(M[i][m - 1]) < EPS ? 0 : Math.round(M[i][m - 1] * 1e8) / 1e8;
                    this.solution[`x${j + 1}`] = val;
                    break;
                }
            }
        }
    }

    // ─── Guided mode: get expected operation for current step ───

    getCurrentStep() {
        const idx = this.history.length;
        if (idx >= this.expected.length) return { done: true };
        return { index: idx, ...this.expected[idx] };
    }

    getHint() {
        const step = this.getCurrentStep();
        if (step.done) return { message: '¡El sistema ya está resuelto!' };

        const M = this.matrix;
        if (step.phase === 'forward' || step.phase === 'backward') {
            const pivot = M[step.pivotRow][step.pivotCol];
            const target = M[step.targetRow][step.pivotCol];

            if (Math.abs(pivot) < EPS) {
                return {
                    operation: null,
                    message: `El pivote en R${step.pivotRow+1} es casi cero. Probá intercambiar filas.`,
                };
            }

            const factor = target / pivot;
            const tr = step.targetRow + 1;
            const pr = step.pivotRow + 1;

            if (Math.abs(factor - Math.round(factor)) < EPS) {
                const absF = Math.abs(factor);
                if (absF === 1) {
                    return {
                        operation: `R${tr} = R${tr} - R${pr}`,
                        message: `Restá R${pr} a R${tr} para eliminar (${tr},${step.pivotCol+1})`,
                    };
                }
                return {
                    operation: `R${tr} = R${tr} - ${absF}*R${pr}`,
                    message: `Restá ${absF}·R${pr} a R${tr} para eliminar (${tr},${step.pivotCol+1})`,
                };
            }

            return {
                operation: `R${tr} = R${tr} - (${target}/${pivot})*R${pr}`,
                message: `Restá (${target}/${pivot})·R${pr} a R${tr}`,
            };
        }

        if (step.phase === 'normalize') {
            const pivot = M[step.row][step.row];
            if (Math.abs(pivot) < EPS) return { message: 'Pivote cero, no se puede normalizar.' };
            return {
                operation: `R${step.row+1} = R${step.row+1} / ${pivot}`,
                message: `Dividí R${step.row+1} por ${pivot}`,
            };
        }

        return { message: 'No hay pista disponible' };
    }

    validateOperation(op) {
        const step = this.getCurrentStep();
        if (step.done) return { valid: false, message: 'El sistema ya está resuelto' };
        if (!step) return { valid: false, message: 'No hay paso esperado' };

        const M = this.matrix;
        const nCols = this.cols;

        if (step.phase === 'forward' || step.phase === 'backward') {
            const testMat = M.map(r => [...r]);
            if (op.type === 'rowop') {
                const newRow = new Array(nCols).fill(0);
                for (const { row, coeff } of op.coefficients) {
                    for (let j = 0; j < nCols; j++) {
                        newRow[j] += coeff * testMat[row][j];
                    }
                }
                testMat[op.target] = newRow;
            }

            const val = Math.abs(testMat[step.targetRow][step.pivotCol]);
            if (val < EPS) {
                return { valid: true };
            }
            return { valid: false, message: `No se creó cero en (${step.targetRow+1},${step.pivotCol+1}). Valor: ${val.toFixed(4)}` };
        }

        if (step.phase === 'normalize') {
            if (op.type === 'rowop' && op.target === step.row) {
                let newVal = M[step.row][step.row];
                for (const { row, coeff } of op.coefficients) {
                    if (row === step.row) {
                        newVal *= coeff;
                    } else {
                        newVal += M[row][step.row] * coeff;
                    }
                }
                if (Math.abs(newVal - 1) < EPS) return { valid: true };
            }
            return { valid: false, message: `Normalizá R${step.row+1} para que el pivote sea 1` };
        }

        return { valid: false, message: 'Operación no esperada' };
    }

    // ─── Cell metadata for rendering ───

    getCellClass(row, col) {
        const M = this.matrix;
        const val = M[row][col];
        const absVal = Math.abs(val);
        const isRHS = col === this.cols - 1;

        let cls = isRHS ? 'gj-rhs' : 'gj-cell';

        // Check if this is a zero that was created (abs < EPS)
        if (col < this.cols - 1 && absVal < EPS) {
            cls += ' gj-zero';
        }

        // Check pivot
        if (row === col && col < this.size && absVal > EPS) {
            cls += ' gj-pivot';
        }

        // Check if this row is involved in the current operation (last history item)
        if (this.history.length > 0) {
            const lastOp = this.history[this.history.length - 1];
            if (lastOp.type === 'rowop' && lastOp.target === row) {
                cls += ' gj-row-active';
            }
        }

        return cls;
    }

    getCellValue(row, col) {
        const val = this.matrix[row][col];
        if (Math.abs(val) < EPS) return 0;
        const rounded = Math.round(val * 1e8) / 1e8;
        if (Number.isInteger(rounded)) return rounded;
        return rounded;
    }

    // ─── System of equations as text ───

    getSystemEquations() {
        const M = this.originalMatrix;
        const n = this.size;
        const vars = 'xyzuvw'.split('');
        const lines = [];

        for (let i = 0; i < n; i++) {
            const terms = [];
            for (let j = 0; j < n; j++) {
                const coeff = M[i][j];
                if (Math.abs(coeff) < EPS) continue;
                const varName = vars[j] || `x${j+1}`;
                if (coeff === 1) terms.push(varName);
                else if (coeff === -1) terms.push(`-${varName}`);
                else terms.push(`${coeff}${varName}`);
            }
            const rhs = M[i][n];
            lines.push(terms.join(' + ').replace(/\+ -/g, '- ') + ` = ${rhs}`);
        }

        return lines;
    }
}
