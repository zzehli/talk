import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { primeFactorization } from './prime-factor-tools.js';
import chalk from "chalk";

const client = new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY
});

const num = 11133345
const query = `What are the prime factors of ${num}? Please show your work step by step.`
const messages = [
    {
        "role": "user",
        "content": query
    }
];

const response = await client.chat.completions.create({
    model: "qwen-3-32b",
    messages: messages,
    max_tokens: 10000,
});

console.log(chalk.underline("Question: ", query));
console.log(response.choices[0].message.content);
console.log(chalk.magenta.bold(`\n🔢 FINAL TOKEN SUMMARY:`));
console.log(chalk.magenta(`Total tokens used: ${response.usage.total_tokens}`));
console.log(chalk.blue("The correct answer is: ", primeFactorization(num)))