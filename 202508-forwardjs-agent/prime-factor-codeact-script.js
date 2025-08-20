import { CodeAct } from './codeact.js';
import chalk from "chalk";

import { smallestPrimeFactor, divide, saveFactors, getFactors, primeFactorization } from './prime-factor-tools.js'

const num = 11133345
const query = `What are the prime factors of ${num}?`
const codeAct = new CodeAct(undefined, [smallestPrimeFactor, divide, saveFactors, getFactors], "cs");
console.log(chalk.underline("Question: ", query));
await codeAct.run(query);
console.log(chalk.blue("(Not from the model) The correct answer is: ", primeFactorization(num)))