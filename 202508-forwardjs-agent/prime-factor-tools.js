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

smallestPrimeFactor.schema = {
    type: "function",
    function: {
        name: "smallestPrimeFactor",
        description: "Returns the smallest prime factor of n",
        parameters: {
            type: "object",
            properties: {
                n: { type: "number", description: "The number to find the smallest prime factor for" }
            }
        }
    }
}


function divide(n, d) {
    if (d === 0) {
        throw new Error("Cannot divide by zero.");
    }
    return Math.floor(n / d);
}

divide.schema = {
    type: "function",
    function: {
        name: "divide",
        description: "Returns the quotient of n divided by d",
        parameters: {
            type: "object",
            properties: {
                n: { type: "number", description: "The dividend" },
                d: { type: "number", description: "The divisor" }
            }
        }
    }
}

// Module-level variable to store factors
let _factors = [];

function saveFactors(num) {
    _factors.push(num);
}

saveFactors.schema = {
    type: "function",
    function: {
        name: "saveFactors",
        description: "Saves the factor found so far",
        parameters: {
            type: "object",
            properties: {
                num: { type: "number", description: "The factor to save" }
            }
        }
    }
}

function getFactors() {
    return _factors;
}

getFactors.schema = {
    type: "function",
    function: {
        name: "getFactors",
        description: "Returns the factors found so far",
        parameters: {
            type: "object",
            properties: {}
        }
    }
}


function primeFactorization(n) {
    if (n <= 1) {
        return [];
    }

    const factors = [];

    // Check for factor 2
    while (n % 2 === 0) {
        factors.push(2);
        n = n / 2;
    }

    // Check for odd factors from 3 onwards
    for (let i = 3; i * i <= n; i += 2) {
        while (n % i === 0) {
            factors.push(i);
            n = n / i;
        }
    }

    // If n is still greater than 2, then it's a prime factor
    if (n > 2) {
        factors.push(n);
    }

    return factors;
}

export {
    smallestPrimeFactor,
    divide,
    saveFactors,
    getFactors,
    primeFactorization
};