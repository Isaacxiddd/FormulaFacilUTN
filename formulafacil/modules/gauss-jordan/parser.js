export function parseOperation(input) {
    if (!input || typeof input !== 'string') {
        return { error: 'Ingresá una operación' };
    }

    let s = input.trim().toUpperCase();
    if (!s) return { error: 'Ingresá una operación' };

    // --- Swap ---
    const swapMatch = s.match(/^R(\d+)\s*(?:↔|<->|<=>|SWAP|EXCHANGE)\s*R(\d+)$/);
    if (swapMatch) {
        return { type: 'swap', row1: +swapMatch[1] - 1, row2: +swapMatch[2] - 1 };
    }

    // --- Operation: target = expression ---
    const eqIdx = s.indexOf('=');
    if (eqIdx === -1) return { error: 'Falta el signo = . Ej: R2 = 2*R2 - R1' };

    const left = s.slice(0, eqIdx).trim();
    const right = s.slice(eqIdx + 1).trim();

    const targetMatch = left.match(/^R(\d+)$/);
    if (!targetMatch) return { error: 'Del lado izquierdo debe ir Rx. Ej: R2 = ...' };
    const target = +targetMatch[1] - 1;

    // --- Division case: R1 / 2 ---
    const divMatch = right.match(/^R(\d+)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (divMatch) {
        const row = +divMatch[1] - 1;
        const den = +divMatch[2];
        if (den === 0) return { error: 'No se puede dividir por cero' };
        return { type: 'rowop', target, coefficients: [{ row, coeff: 1 / den }] };
    }

    // --- Parse linear combination ---
    let expr = right;
    expr = expr.replace(/(\d)\s*R/g, '$1*R');
    expr = expr.replace(/([+\-])\s*R/g, '$1*R');

    const tokens = [];
    let buf = '';
    for (let i = 0; i < expr.length; i++) {
        const ch = expr[i];
        if ((ch === '+' || ch === '-') && buf) {
            tokens.push(buf);
            buf = ch;
        } else {
            buf += ch;
        }
    }
    if (buf) tokens.push(buf);

    const coefficients = [];

    for (let term of tokens) {
        term = term.trim();
        if (!term) continue;

        let sign = 1;
        if (term[0] === '+') { term = term.slice(1).trim(); }
        else if (term[0] === '-') { sign = -1; term = term.slice(1).trim(); }

        if (!term) continue;

        const rowMatch = term.match(/^(\d*\.?\d*)\*?R(\d+)$/);
        if (!rowMatch) continue;

        const coeff = rowMatch[1] ? +rowMatch[1] : 1;
        if (isNaN(coeff)) continue;

        const row = +rowMatch[2] - 1;
        coefficients.push({ row, coeff: sign * coeff });
    }

    if (coefficients.length === 0) {
        return { error: 'No se encontraron términos válidos. Ej: R2 = 2*R2 - R1' };
    }

    return { type: 'rowop', target, coefficients };
}
