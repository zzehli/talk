// basic agent with short term memory
import { InferenceClient } from "@huggingface/inference";
import chalk from "chalk";
import OpenAI from "openai";
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import Anthropic from "@anthropic-ai/sdk";
import { Groq } from 'groq-sdk';
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
        } else if (provider === "cd") {
            this.client = new Anthropic();
            this.modelId = "claude-sonnet-4-20250514";
        } else if (provider === "gq") {
            this.client = new Groq();
            this.modelId = "qwen/qwen3-32b"
        } else {
            throw new Error(`Provider ${provider} not supported`);
        }
        this.provider = provider;
        this.memory = [];
        this.tools = tools;
        this.systemPrompt = systemPrompt;
        this.totalTokens = 0; // Track cumulative tokens
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
        } else if (this.provider === "gh" || this.provider === "cs" || this.provider === "gq") {
            response = await this.client.chat.completions.create({
                model: this.modelId,
                messages: this.memory,
                tools: this.tools.map(tool => tool.schema),
            });
        } else if (this.provider === "cd") {
            response = await this.client.messages.create({
                model: this.modelId,
                system: this.systemPrompt,
                messages: this.memory,
                max_tokens: 2048,
                tools: this.tools.map(tool => tool.anthropicSchema),
            });
        }
        return response;
    }


    async executeTool(toolCalls) {
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
        if (this.provider !== "cd") {
            this.memory.push({
                "role": "system",
                "content": this.systemPrompt,
            })
        }
        this.memory.push({
            "role": "user",
            "content": initialPrompt,
        })

        while (true) {
            console.log(chalk.cyan.bold(`\n📋 STEP ${step}`));
            console.log(chalk.cyan("─".repeat(30)));

            let result = await this.call();
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Track tokens from this API call
            let currentTokens = 0;
            if (this.provider === "cs" && result.usage?.total_tokens) {
                currentTokens = result.usage.total_tokens;
                this.totalTokens += currentTokens;
            }

            // Handle different response formats for different providers
            let messageContent, toolCalls;

            if (this.provider === "cd") {
                // Claude format
                messageContent = result.content.find(block => block.type === 'text')?.text;
                toolCalls = result.content.filter(block => block.type === 'tool_use');
            } else {
                // OpenAI/other providers format
                messageContent = result.choices[0].message.content;
                toolCalls = result.choices[0].message.tool_calls;
            }

            if (messageContent) {
                console.log(chalk.blue(`Agent returned: ${messageContent}`));
                this.memory.push({
                    "role": "assistant",
                    "content": messageContent,
                })
            }

            if (toolCalls && toolCalls.length > 0) {
                let toolResults;
                if (this.provider === "cd") {
                    // Convert Claude tool calls to OpenAI format for executeTool
                    const convertedToolCalls = toolCalls.map(toolCall => ({
                        function: {
                            name: toolCall.name,
                            arguments: JSON.stringify(toolCall.input)
                        }
                    }));
                    toolResults = await this.executeTool(convertedToolCalls);
                } else {
                    toolResults = await this.executeTool(toolCalls);
                }

                const toolResultsStr = toolResults.map(result => `Tool ${result.toolName} returned: ${result.result}`).join("\n")
                this.memory.push({
                    "role": "user",
                    "content": toolResultsStr,
                })
            } else {
                if (this.provider === "cs") {
                    console.log(chalk.magenta.bold(`\n🔢 FINAL TOKEN SUMMARY:`));
                    console.log(chalk.magenta(`Total tokens used: ${this.totalTokens}`));
                }
                console.log(chalk.green.bold("\n✅ COMPLETED"));
                console.log(chalk.green("─".repeat(30)));
                break;
            }

            step++;
        }
    }
}