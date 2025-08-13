import Cerebras from '@cerebras/cerebras_cloud_sdk';
import chalk from "chalk";

const client = new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY
});

const messages = [
    {
        "role": "user",
        "content": "What are the prime factors of 111345? Please show your work step by step."
    }
];

const response = await client.chat.completions.create({
    model: "qwen-3-32b",
    messages: messages,
    max_tokens: 5000,
});

console.log(chalk.underline("Question: What are the prime factors of 111345? Please show your work step by step."));
console.log(response.choices[0].message.content);
console.log(response.usage.total_tokens);
