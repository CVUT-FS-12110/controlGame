//euler solver for (mC + mP).x" + b.x' = F
export function solve(x1, x2, F, deltaT, mC, mP, b) {
    return {
        x1: deltaT * x2,
        x2: (((-deltaT*b)/(mC+mP)) + 1)*x2 + ((deltaT*b)/(mC+mP))*F
    };
}