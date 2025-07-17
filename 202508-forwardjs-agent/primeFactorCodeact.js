import { CodeAct } from './codeact.js';

import { smallestPrimeFactor, divide, saveFactors, getFactors } from './primeFactorTools.js'

// const agent = new Agent(systemPrompt, [smallestPrimeFactor, divide, saveFactors, getFactors], "cs");
// agent.run("What are the prime factors of 111345?");


const codeAct = new CodeAct(undefined, [smallestPrimeFactor, divide, saveFactors, getFactors], "cs");
await codeAct.run("What are the prime factors of 111345?");