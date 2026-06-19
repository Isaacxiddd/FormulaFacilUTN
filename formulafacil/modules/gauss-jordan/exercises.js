function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function det2(m) {
    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

function det3(m) {
    return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
         - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
         + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
}

function generateInvertibleMatrix(n) {
    for (let attempt = 0; attempt < 50; attempt++) {
        const A = [];
        for (let i = 0; i < n; i++) {
            A[i] = [];
            for (let j = 0; j < n; j++) {
                A[i][j] = randInt(-3, 3);
            }
        }

        const det = n === 2 ? det2(A) : det3(A);
        if (Math.abs(det) > 0.1) return A;
    }
    // fallback: identity
    return Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    );
}

function matVecMul(A, x) {
    return A.map(row => {
        let sum = 0;
        for (let j = 0; j < row.length; j++) sum += row[j] * x[j];
        return sum;
    });
}

function generateExercise(n) {
    const A = generateInvertibleMatrix(n);
    const solution = Array.from({ length: n }, () => randInt(-5, 5));
    const rhs = matVecMul(A, solution);

    const augmented = A.map((row, i) => [...row, rhs[i]]);

    const vars = 'xyz'.split('');
    const equations = A.map((row, i) => {
        const terms = [];
        for (let j = 0; j < n; j++) {
            const c = row[j];
            const v = vars[j] || `x${j+1}`;
            if (c === 0) continue;
            if (terms.length === 0) {
                if (c === 1) terms.push(v);
                else if (c === -1) terms.push(`-${v}`);
                else terms.push(`${c}${v}`);
            } else {
                if (c === 1) terms.push(`+ ${v}`);
                else if (c === -1) terms.push(`- ${v}`);
                else terms.push(`${c > 0 ? '+ ' : '- '}${Math.abs(c)}${v}`);
            }
        }
        return `${terms.join(' ')} = ${rhs[i]}`;
    });

    const solDisplay = {};
    for (let j = 0; j < n; j++) {
        solDisplay[`x${j+1}`] = solution[j];
    }

    return {
        size: n,
        augmentedMatrix: augmented,
        equations,
        solution: solDisplay,
        solutionRaw: solution,
    };
}

export function generateExercise2x2() {
    return generateExercise(2);
}

export function generateExercise3x3() {
    return generateExercise(3);
}

export function generateExercise4x4() {
    return generateExercise(4);
}

export function generateExerciseBySize(n) {
    return generateExercise(n);
}
