//euler solver for (mC + mP).x" + b.x' = F
export function solve(x1, x2, F, deltaT, mC, mP, b) {
    return {
        x1: deltaT * x2,
        x2: (((-deltaT*b)/(mC+mP)) + 1)*x2 + ((deltaT*b)/(mC+mP))*F
    };
}

export function solvePendulum(x, xDot, fi, fiDot, u, deltaT, mC, mP, inertia, b, lt, g) {
    const denom =  inertia*(mC+mP)+mC*mP*lt**2;
    return {
        x1: x + deltaT*xDot,
        x2: (1 + deltaT*(-(inertia+mP*lt**2)*b/denom))*xDot + deltaT*((mP**2*g*lt**2)/denom)*fi,
        x3: fi + deltaT*fiDot,
        x4: deltaT*(-(mP*lt*b)/denom)*xDot +  deltaT*(mP*g*lt*(mC+mP)/denom)*fi + fiDot
    }
}