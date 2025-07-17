import { Agent } from "./react.js";
import ivm from 'isolated-vm';
import chalk from "chalk";

const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant that can execute javascript code and return the result. Your JS environment is isolated, you can only use standard javascript libraries, no web apis.
You are an expert assistant who can solve any task using code.

At each step, in the 'thought:' attribute, you should first explain your reasoning towards solving the task and the tools that you want to use. Then in the 'Code' attribute, you should write the code in simple js.
Do not write code that require importing modules. Generate a JSON object with a code block and a thought block.

Your user will provide you with a list of functions that you can use in your js code. You can use these functions to solve the task. If the problem is solvable by one code block, write out a multi-line solution that calls multiple of the tools.
You also have access to a tool called "finalAnswer" that you can use to return the final answer to the user.

The result of the code execution will be provided to you as input for the next step.
Here is an example using notional tools:

Query: "What is the result of the following operation: 5 + 3 + 1294.678?"

{"thought": "I will use Javascript code to compute the result of the arithmetic operation, "code": "const result = 5 + 3 + 1294.678\nfinalAnswer(result)\n"}
`;

const responseFormat = {
    "type": "json_schema",
    "json_schema": {
        "name": "ThoughtAndCodeAnswer",
        "schema": {
            "additionalProperties": false,
            "properties": {
                "thought": {
                    "description": "A free form text description of the thought process.",
                    "title": "Thought",
                    "type": "string",
                },
                "code": {
                    "description": "Valid Javascript code snippet implementing the thought.",
                    "title": "Code",
                    "type": "string",
                },
            },
            "required": ["thought", "code"],
            "title": "ThoughtAndCodeAnswer",
            "type": "object",
        },
    },
}

export class CodeAct extends Agent {
    constructor(systemPrompt = DEFAULT_SYSTEM_PROMPT, tools = [], provider = "hf") {
        super(systemPrompt, tools, provider);
        this.responseFormat = responseFormat;
        this.systemPrompt += `You have access to the following user-defined functions: ${tools.map(t => JSON.stringify(t.schema)).join(", ")}.`;
        const isolate = new ivm.Isolate();
        this.context = isolate.createContextSync();
        const jail = this.context.global;
        for (const tool of tools) {
            if (tool.schema) {
                delete tool.schema;
            }

            jail.setSync(tool.name, tool);
        }
        jail.setSync("finalAnswer", (result) => {
            console.log(chalk.green("Final answer: " + result));
        });
    }

    async call() {
        let response;
        if (this.provider === "hf") {
            response = await this.client.chatCompletion({
                model: this.modelId,
                messages: this.memory,
                response_format: this.responseFormat,
            });
        } else if (this.provider === "gh" || this.provider === "cs") {
            response = await this.client.chat.completions.create({
                model: this.modelId,
                messages: this.memory,
                response_format: this.responseFormat,
            });
        }
        return response;
    }

    async executeTool(code) {
        const response = this.context.evalSync(code);
        console.log(chalk.magenta("Code result: " + response));
        return response;
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
            const response = JSON.parse(result.choices[0].message.content)
            console.log(JSON.stringify(response, null, 2));
            if (response.thought) {
                this.memory.push({
                    "role": "assistant",
                    "content": result.choices[0].message.content,
                })
            }
            if (response.code) {
                const codeResult = await this.executeTool(response.code)
                if (response.code.includes("finalAnswer")) {
                    console.log(chalk.green.bold("\n✅ COMPLETED"));
                    console.log(chalk.green("─".repeat(30)));
                    break;
                }
                this.memory.push({
                    "role": "user",
                    "content": `code execution result: ${codeResult}`,
                })
            }


            step++;
        }
    }
}
