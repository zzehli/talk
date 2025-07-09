/**
 * Returns the smallest prime factor of n.
 * @param {number} n - The number to find the smallest prime factor for
 * @returns {number|null} The smallest prime factor or null if n <= 1
 */
function smallestPrimeFactor(n) {
    if (n <= 1) {
        return null;
    }
    for (let i = 2; i <= Math.floor(Math.sqrt(n)); i++) {
        if (n % i === 0) {
            return i;
        }
    }
    return n; // n is prime if no factors found
}

/**
 * Returns the quotient of n divided by d.
 * @param {number} n - The dividend
 * @param {number} d - The divisor
 * @returns {number} The quotient
 * @throws {Error} When attempting to divide by zero
 */
function divide(n, d) {
    if (d === 0) {
        throw new Error("Cannot divide by zero.");
    }
    return Math.floor(n / d);
}

// Module-level variable to store factors
let _factors = [];

/**
 * Saves the factor found so far.
 * @param {number} num - The factor to save
 */
function saveFactors(num) {
    _factors.push(num);
}

/**
 * Returns the factors found so far.
 * @returns {number[]} Array of factors
 */
function getFactors() {
    return _factors;
}

export {
    smallestPrimeFactor,
    divide,
    saveFactors,
    getFactors
};
