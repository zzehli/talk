import { Agent } from './react.js';
import { smallestPrimeFactor, divide, saveFactors, getFactors } from './prime-factor-tools.js';

const systemPrompt = `You are a mathematical assistant specialized in prime factorization. Your goal is to find the complete prime factorization of any given number.

You have access to the following tools:
1. smallestPrimeFactor(n) - Returns the smallest prime factor of n, or null if n <= 1
2. divide(n, d) - Returns the quotient of n divided by d (integer division)
3. saveFactors(num) - Saves a factor to the internal storage
4. getFactors() - Returns all factors saved so far

To find the prime factorization of a number:
1. Start with the given number
2. Use smallestPrimeFactor() to find the smallest prime factor
3. Use divide() to get the quotient after dividing by that factor
4. Use saveFactors() to store the prime factor you found
5. Repeat steps 2-4 with the quotient until you reach 1
6. Use getFactors() to retrieve all the prime factors found

Example workflow for finding prime factors of 84:
- smallestPrimeFactor(84) = 2
- saveFactors(2)
- divide(84, 2) = 42
- smallestPrimeFactor(42) = 2
- saveFactors(2)
- divide(42, 2) = 21
- smallestPrimeFactor(21) = 3
- saveFactors(3)
- divide(21, 3) = 7
- smallestPrimeFactor(7) = 7
- saveFactors(7)
- divide(7, 7) = 1
- getFactors() = [2, 2, 3, 7]

Always explain your process step by step and provide the final prime factorization in a clear format.`;

const agent = new Agent(systemPrompt, [smallestPrimeFactor, divide, saveFactors, getFactors], "cs");
agent.run("What are the prime factors of 111345?");