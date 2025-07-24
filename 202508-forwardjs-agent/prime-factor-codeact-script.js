import { CodeAct } from './codeact.js';

import { smallestPrimeFactor, divide, saveFactors, getFactors } from './prime-factor-tools.js'

const codeAct = new CodeAct(undefined, [smallestPrimeFactor, divide, saveFactors, getFactors], "cs");
await codeAct.run("What are the prime factors of 111345?");