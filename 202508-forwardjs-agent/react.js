// basic agent with short term memory
import { InferenceClient } from "@huggingface/inference";
import chalk from "chalk";
import OpenAI from "openai";
import Cerebras from '@cerebras/cerebras_cloud_sdk';

export class Agent {
    constructor(systemPrompt, tools = [], provider = "hf") {
        if (provider === "hf") {
            this.client = new InferenceClient(process.env.HF_TOKEN);
            this.modelId = "Qwen/Qwen3-8B";
        } else if (provider === "gh") {
            this.client = new OpenAI({
                baseURL: "https://models.github.ai/inference",
                apiKey: process.env.GITHUB_OPENAI_API_KEY
            });
            this.modelId = "openai/gpt-4.1";
        } else if (provider === "cs") {
            this.client = new Cerebras({
                apiKey: process.env.CEREBRAS_API_KEY
            });
            this.modelId = "qwen-3-32b";
        }
        this.provider = provider;
        this.memory = [];
        this.tools = tools;
        this.systemPrompt = systemPrompt;
    }

    async call() {
        // Send prompt to the model and return the response
        let response;
        if (this.provider === "hf") {
            response = await this.client.chatCompletion({
                model: this.modelId,
                messages: this.memory,
                tools: this.tools.map(tool => tool.schema),
            });
        } else if (this.provider === "gh" || this.provider === "cs") {
            response = await this.client.chat.completions.create({
                model: this.modelId,
                messages: this.memory,
                tools: this.tools.map(tool => tool.schema),
            });
        }
        return response;
    }


    async executeTool(toolCalls) {
        // Placeholder for tool execution logic
        console.log("this is react")
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
            const res = await toolDict[toolName](...Object.values(args))
            console.log(chalk.green(`Tool ${toolName} returned: ${res}`));
            toolResults.push(
                {
                    "toolName": toolName,
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
            "content": this.systemPrompt,
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
                const toolResults = await this.executeTool(result.choices[0].message.tool_calls)
                const toolResultsStr = toolResults.map(result => `Tool ${result.toolName} returned: ${result.result}`).join("\n")
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