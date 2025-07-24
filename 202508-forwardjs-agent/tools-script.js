import { AutoTokenizer } from '@huggingface/transformers';
import { simpleFunctionToSchema } from './utils.js';
import chalk from 'chalk';
const modelId = "meta-llama/Llama-3.3-70B-Instruct";
const tokenizer = await AutoTokenizer.from_pretrained(modelId);
import { InferenceClient } from "@huggingface/inference";
const client = new InferenceClient(process.env.HF_TOKEN);


function getCurrentLocation() {
    return "Ottawa";
}

const schema = simpleFunctionToSchema(getCurrentLocation, {
    description: "Get the current location of the user",
});
console.log(chalk.yellow("--------------define tools------------------"))
console.log(chalk.bgYellow("function schema:"));
console.log(JSON.stringify(schema, null, 2));



const messages = [
    {
        role: "system",
        content: "You are a helpful assistant, use the tools provided to you to answer the user's question."
    },
    {
        role: "user",
        content: "What is the current location of the user?"
    }
]

const chatMessage = await tokenizer.apply_chat_template(messages, {
    tools: [schema],
    tokenize: false
})
console.log(chalk.yellow("--------------chatMessage------------------"))
console.log(chalk.bgYellow("chatMessage:"));
console.log(chatMessage);

const response_one = await client.chatCompletion({
    model: modelId,
    messages: messages,
    tools: [schema],
})
console.log(chalk.yellow("--------------response------------------"))
console.log(chalk.bgYellow("response:"));
console.log(chalk.underline("content:"));
console.log(response_one.choices[0].message.content);
console.log(chalk.underline("tool_calls:"));
console.log(response_one.choices[0].message.tool_calls);
