import { Agent } from './react.js';
import { smallestPrimeFactor, divide, saveFactors, getFactors, primeFactorization } from './prime-factor-tools.js';
import chalk from "chalk";

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
<|im_start|>user
Find the prime factorization of 84.
<|im_end|>

<|im_start|>assistant
get the smallest prime factor of 84 so we know what to peel off first.
<tool_call>
{"name":"smallestPrimeFactor","arguments":{"n":84}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"result":2}
<|im_end|>

<|im_start|>assistant
purpose: record the factor we just found so it ends up in the final list.
<tool_call>
{"name":"saveFactors","arguments":{"num":2}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"status":"ok"}
<|im_end|>

<|im_start|>assistant
divide 84 by that factor to shrink the problem to the next number.
<tool_call>
{"name":"divide","arguments":{"n":84,"d":2}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"result":42}
<|im_end|>

<|im_start|>assistant
again, find the smallest prime factor of the new number (42).
<tool_call>
{"name":"smallestPrimeFactor","arguments":{"n":42}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"result":2}
<|im_end|>

<|im_start|>assistant
save that factor so our list stays complete.
<tool_call>
{"name":"saveFactors","arguments":{"num":2}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"status":"ok"}
<|im_end|>

<|im_start|>assistant
divide again to keep breaking the number down.
<tool_call>
{"name":"divide","arguments":{"n":42,"d":2}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"result":21}
<|im_end|>

<|im_start|>assistant
find the smallest prime factor of 21 so we can keep the chain going.
<tool_call>
{"name":"smallestPrimeFactor","arguments":{"n":21}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"result":3}
<|im_end|>

<|im_start|>assistant
save that new factor (so we don't lose track).
<tool_call>
{"name":"saveFactors","arguments":{"num":3}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"status":"ok"}
<|im_end|>

<|im_start|>assistant
divide 21 by 3 to get the next number to factor.
<tool_call>
{"name":"divide","arguments":{"n":21,"d":3}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"result":7}
<|im_end|>

<|im_start|>assistant
get the smallest prime factor of 7 (this should finish it off).
<tool_call>
{"name":"smallestPrimeFactor","arguments":{"n":7}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"result":7}
<|im_end|>

<|im_start|>assistant
save the last factor so the full set is complete.
<tool_call>
{"name":"saveFactors","arguments":{"num":7}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"status":"ok"}
<|im_end|>

<|im_start|>assistant
divide by that last factor to confirm we've reached 1.
<tool_call>
{"name":"divide","arguments":{"n":7,"d":7}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"result":1}
<|im_end|>

<|im_start|>assistant
pull the full list of saved factors so we can write the final answer.
<tool_call>
{"name":"getFactors","arguments":{}}
</tool_call>
<|im_end|>

<|im_start|>tool
{"result":[2,2,3,7]}
<|im_end|>

<|im_start|>assistant
Wrap-up — we kept taking the smallest prime factor and dividing until the number hit 1. The saved list is [2, 2, 3, 7], so:

**84 = 2² x 3 x 7.**
<|im_end|>

Always explain your process step by step and provide the final prime factorization in a clear format.`;
const num = 11133345
const query = `What are the prime factors of ${num}?`
const agent = new Agent(systemPrompt, [smallestPrimeFactor, divide, saveFactors, getFactors], "cs");
console.log(chalk.underline("Question: ", query));
await agent.run(query);
console.log(chalk.blue("(Not from the model) The correct answer is: ", primeFactorization(num)))