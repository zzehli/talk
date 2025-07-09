// basic agent with short term memory
import { InferenceClient } from "@huggingface/inference";
import chalk from "chalk";
import { simpleFunctionToSchema } from "./utils.js";
import { smallestPrimeFactor, divide, saveFactors, getFactors } from "./prime_factors.js";
import OpenAI from "openai";
class Agent {
    constructor(system_prompt, tools = [], provider = "hf") {
        if (provider === "hf") {
            this.client = new InferenceClient(process.env.HF_TOKEN);
            this.model_id = "Qwen/Qwen3-32B";
        } else if (provider === "gh") {
            this.client = new OpenAI({
                baseURL: "https://models.github.ai/inference",
                apiKey: process.env.GITHUB_OPENAI_API_KEY
            });
            this.model_id = "openai/gpt-4.1";
        }
        this.provider = provider;
        this.memory = [];
        this.tools = tools;
        this.system_prompt = system_prompt;
    }

    async call() {
        // Send prompt to the model and return the response
        let response;
        if (this.provider === "hf") {
            response = await this.client.chatCompletion({
                model: this.model_id,
                messages: this.memory,
                tools: this.tools.map(simpleFunctionToSchema),
            });
        } else if (this.provider === "gh") {
            response = await this.client.chat.completions.create({
                model: this.model_id,
                messages: this.memory,
                tools: this.tools.map(simpleFunctionToSchema),
            });
        }
        return response;
    }


    executeTool(toolCalls) {
        // Placeholder for tool execution logic
        let toolResults = []
        for (const toolCall of toolCalls) {
            console.log(chalk.yellow(`Executing tool: ${toolCall.function.name} with args: ${JSON.stringify(toolCall.function.arguments)}`));
            // Return a mock result for now
            const toolDict = this.tools.reduce((acc, tool) => {
                acc[tool.name] = tool;
                return acc;
            }, {});
            const toolName = toolCall.function.name

            if (!toolDict[toolName]) {
                throw new Error(`Tool ${toolName} not found`);
            }
            const args = JSON.parse(toolCall.function.arguments)
            const res = toolDict[toolName](...Object.values(args))
            console.log(chalk.green(`Tool ${toolName} returned: ${res}`));
            toolResults.push(
                {
                    "tool_name": toolName,
                    "args": toolCall.function.arguments,
                    "result": res,
                }
            )
        }
        return toolResults
    }

    async run(initialPrompt) {
        let step = 1;

        this.memory.push({
            "role": "system",
            "content": this.system_prompt,
        })
        this.memory.push({
            "role": "user",
            "content": initialPrompt,
        })

        while (true) {
            console.log(chalk.cyan.bold(`\n📋 STEP ${step}`));
            console.log(chalk.cyan("─".repeat(30)));

            let result = await this.call();
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (result.choices[0].message.content) {
                console.log(chalk.blue(`Agent returned: ${result.choices[0].message.content}`));
                this.memory.push({
                    "role": "assistant",
                    "content": result.choices[0].message.content,
                })
            }
            if (result.choices[0].message.tool_calls) {
                const toolResults = this.executeTool(result.choices[0].message.tool_calls)
                const toolResultsStr = toolResults.map(result => `Tool ${result.tool_name} returned: ${result.result}`).join("\n")
                this.memory.push({
                    "role": "user",
                    "content": toolResultsStr,
                })
            } else {
                console.log(chalk.green.bold("\n✅ COMPLETED"));
                console.log(chalk.green("─".repeat(30)));
                break;
            }

            step++;
        }
    }
}
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

const agent = new Agent(systemPrompt, [smallestPrimeFactor, divide, saveFactors, getFactors], "gh");
agent.run("What are the prime factors of 1345?");

