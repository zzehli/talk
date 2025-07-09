import { InferenceClient } from "@huggingface/inference";
import chalk from "chalk";
const client = new InferenceClient(process.env.HF_TOKEN);
const model_id = "meta-llama/Llama-3.3-70B-Instruct";
const messages_one = [
    {
        "role": "user",
        "content": "Hey, I am going to do grocery today. I need to buy some fruits and vegetables.",
    },
]

const messages_two = [
    {
        "role": "user",
        "content": "Remind me what am I doing today.",
    },
]

const response_one = await client.chatCompletion({
    model: model_id,
    messages: messages_one,
    max_tokens: 20,
})

const response_two = await client.chatCompletion({
    model: model_id,
    messages: messages_two,
    max_tokens: 20,
})

console.log(chalk.underline("response_one:"))
console.log(chalk.bgYellow(response_one.choices[0].message.content + "\n"))
console.log(chalk.underline("response_two:"))
console.log(chalk.bgYellow(response_two.choices[0].message.content + "\n"))