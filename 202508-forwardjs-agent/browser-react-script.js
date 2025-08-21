import { chromium } from 'playwright';
import readline from 'readline';
import { Agent } from './react.js';
import chalk from 'chalk';
let browser;
let page;
let elements = [];
// Initialize browser and page
async function initBrowser() {
    if (!browser) {
        browser = await chromium.launch({ headless: false });
    }
    return browser;
}

initBrowser.schema = {
    type: "function",
    function: {
        name: "initBrowser",
        description: "Initialize browser and page",
        parameters: {
            type: "object",
            properties: {}
        }
    }
}

// Add Anthropic schema
initBrowser.anthropicSchema = {
    name: "initBrowser",
    description: "Initialize browser and page",
    input_schema: {
        type: "object",
        properties: {}
    }
}

async function getCurrentPage() {
    if (!browser) {
        throw new Error('Browser not initialized. Call initBrowser() first.');
    }

    const contexts = browser.contexts();
    if (contexts.length === 0) {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/140.0',
        });
        return await context.newPage();
    }

    const context = contexts[0];
    const pages = context.pages();
    if (pages.length === 0) {
        return await context.newPage();
    }

    return pages[pages.length - 1];
}

getCurrentPage.schema = {
    type: "function",
    function: {
        name: "getCurrentPage",
        description: "Get the current page instance",
        parameters: {
            type: "object",
            properties: {}
        }
    }
}

// Add Anthropic schema
getCurrentPage.anthropicSchema = {
    name: "getCurrentPage",
    description: "Get the current page instance",
    input_schema: {
        type: "object",
        properties: {}
    }
}

async function navigateTo(url) {
    try {
        if (!page) {
            page = await getCurrentPage();
        }
        await page.goto(url);
        await page.waitForLoadState();
        return `Navigated to ${url}`;
    } catch (error) {
        return `Error navigating to ${url}: ${error.message}`;
    }
}

navigateTo.schema = {
    type: "function",
    function: {
        name: "navigateTo",
        description: "Navigate to a URL",
        parameters: {
            type: "object",
            properties: {
                url: { type: "string", description: "The URL to navigate to" }
            },
            required: ["url"]
        }
    }
}

// Add Anthropic schema
navigateTo.anthropicSchema = {
    name: "navigateTo",
    description: "Navigate to a URL",
    input_schema: {
        type: "object",
        properties: {
            url: { type: "string", description: "The URL to navigate to" }
        },
        required: ["url"]
    }
}

async function ariaSnapshot() {
    if (!page) {
        return "No page available";
    }

    const ariaElements = await page.locator("body").ariaSnapshot({ forAI: true });
    return `Aria elements: ${JSON.stringify(ariaElements, null, 2)}`;
}

ariaSnapshot.schema = {
    type: "function",
    function: {
        name: "ariaSnapshot",
        description: "Generate an accessibility tree snapshot of the current page with element references for interaction",
        parameters: {
            type: "object",
            properties: {}
        }
    }
}

// Add Anthropic schema
ariaSnapshot.anthropicSchema = {
    name: "ariaSnapshot",
    description: "Generate an accessibility tree snapshot of the current page with element references for interaction",
    input_schema: {
        type: "object",
        properties: {}
    }
}

async function extractPageContent() {
    try {
        if (!page) {
            return "No page available";
        }

        // Select only interactive elements directly
        elements = await page.locator("summary, h1, h2, h3, h4, h5, h6, p, span")
            .locator("visible=true")
            .all();

        if (elements.length > 0) {
            const textArray = [];
            const elementsToProcess = elements;

            for (let idx = 0; idx < elementsToProcess.length; idx++) {
                const elem = elementsToProcess[idx];
                const tagName = await elem.evaluate(el => el.tagName.toLowerCase());

                let text = `${tagName}: `;
                const innerText = await elem.innerText();
                text += innerText.trim();

                if (text.trim() !== `${tagName}:`) {
                    textArray.push(text);
                } else {
                    // If no text, get some basic attributes
                    const attrs = await elem.evaluate(el => ({
                        id: el.id,
                        type: el.type,
                        name: el.name,
                        title: el.title,
                        placeholder: el.placeholder,
                        value: el.value,
                        text: el.textContent.trim()
                    }));
                    textArray.push(`Element: ${JSON.stringify(attrs)}`);
                }
            }
            return `Interactive elements found: ${JSON.stringify(textArray, null, 2)}`;
        } else {
            return "No interactive elements found";
        }
    } catch (error) {
        return `Error taking snapshot: ${error.message}`;
    }
}

extractPageContent.schema = {
    type: "function",
    function: {
        name: "extractPageContent",
        description: "Extract the main text content of the current page",
        parameters: {
            type: "object",
            properties: {}
        }
    }
}

// Add Anthropic schema
extractPageContent.anthropicSchema = {
    name: "extractPageContent",
    description: "Extract the main text content of the current page",
    input_schema: {
        type: "object",
        properties: {}
    }
}

async function findLinksWithText(text) {
    try {
        if (!page) {
            return "No page available";
        }

        const links = await page.locator(`a:has-text("${text}")`).all();

        if (links.length > 0) {
            elements = links;
            const res = {};

            for (let idx = 0; idx < links.length; idx++) {
                const innerText = await links[idx].innerText();
                res[idx] = innerText.trim();
            }

            return `Links found with text: ${text}: ${JSON.stringify(res)}`;
        } else {
            return `No links found with text: ${text}`;
        }
    } catch (error) {
        return `Error finding links: ${error.message}`;
    }
}

findLinksWithText.schema = {
    type: "function",
    function: {
        name: "findLinksWithText",
        description: "Find links with specific text",
        parameters: {
            type: "object",
            properties: {
                text: { type: "string", description: "The text to search for in links" }
            },
            required: ["text"]
        }
    }
}

// Add Anthropic schema
findLinksWithText.anthropicSchema = {
    name: "findLinksWithText",
    description: "Find links with specific text",
    input_schema: {
        type: "object",
        properties: {
            text: { type: "string", description: "The text to search for in links" }
        },
        required: ["text"]
    }
}

async function click(ref, description) {
    try {
        if (!page) {
            page = await getCurrentPage();
        }

        if (!page) {
            return "No page available";
        }

        try {
            // Use the correct aria-ref locator syntax
            const ariaElement = page.locator(`aria-ref=${ref}`).describe(description);

            // Check if element exists
            const count = await ariaElement.count();
            if (count === 0) {
                return `Element with ref '${ref}' not found`;
            }

            // Store the current URL to detect navigation
            const oldUrl = page.url();

            // Set up navigation promise with timeout (similar to clickElement)
            const navigationPromise = page.waitForNavigation({ timeout: 3000 });

            // Click the element
            await ariaElement.click();

            // Handle potential navigation
            try {
                await navigationPromise;
                if (page.url() !== oldUrl) {
                    await page.waitForLoadState();
                    return `Clicked element '${ref} ${description}', navigated to new page: ${page.url()}`;
                }
                return `Clicked element '${ref} ${description}', no navigation occurred`;
            } catch (timeoutError) {
                if (page.url() === oldUrl) {
                    return `Clicked element '${ref} ${description}', no navigation occurred`;
                }
                return `Clicked element '${ref} ${description}', navigation may have occurred`;
            }

        } catch (elementError) {
            if (elementError.message && elementError.message.includes('Timeout')) {
                return `Element with ref '${ref} ${description}' not found, likely because element was removed. Use ariaSnapshot() to see current elements.`;
            }
            return `Error clicking element '${ref} ${description}': ${elementError.message}`;
        }

    } catch (error) {
        return `Error in clickAriaElem: ${error.message}`;
    }
}

click.schema = {
    type: "function",
    function: {
        name: "click",
        description: "Click an element using its aria snapshot reference, example: click('e6', 'login button')",
        parameters: {
            type: "object",
            properties: {
                ref: { type: "string", description: "The aria reference of the element to click (e.g., 'e10')" },
                description: { type: "string", description: "Optional human-readable description of the element for better error messages (e.g., 'searchbox')" }
            },
            required: ["ref", "description"]
        }
    }
}

// Add Anthropic schema
click.anthropicSchema = {
    name: "click",
    description: "Click an element using its aria snapshot reference, example: click('e6', 'login button')",
    input_schema: {
        type: "object",
        properties: {
            ref: { type: "string", description: "The aria reference of the element to click (e.g., 'e10')" },
            description: { type: "string", description: "Optional human-readable description of the element for better error messages (e.g., 'searchbox')" }
        },
        required: ["ref", "description"]
    }
}

async function typeText({ text, ref, description = null, submit = true }) {
    try {

        try {
            let ariaElement = page.locator(`aria-ref=${ref}`);

            if (description) {
                ariaElement = ariaElement.describe(description);
            }

            const count = await ariaElement.count();
            if (count === 0) {
                const elementInfo = description ? `${description} (ref: ${ref})` : `ref '${ref}'`;
                return `Element ${elementInfo} not found`;
            }

            // Check if the element is a form and find the input within it
            const tagName = await ariaElement.evaluate(el => el.tagName.toLowerCase());
            let targetElement = ariaElement;

            if (tagName === 'form') {
                // Look for input, textarea, or other fillable elements within the form
                const inputElement = ariaElement.locator('input, textarea, [contenteditable]').first();
                const inputCount = await inputElement.count();
                if (inputCount > 0) {
                    targetElement = inputElement;
                } else {
                    return `Form element found but no fillable input inside. Try targeting the input field directly.`;
                }
            }

            await targetElement.fill(text);



            let result = '';
            const elementInfo = description ? `${description} (${ref})` : `'${ref}'`;

            result = `Typed '${text}' into element ${elementInfo}`;


            if (submit) {
                await targetElement.press('Enter');
                await page.waitForTimeout(5000); // Wait a bit longer after submitting
                result += ` and pressed Enter`;
            }

            return result;

        } catch (elementError) {
            if (elementError.message && elementError.message.includes('Timeout')) {
                const elementInfo = description ? `${description} (ref: ${ref})` : `ref '${ref}'`;
                return `Element ${elementInfo} not found, likely because element was removed. Use ariaSnapshot() to see current elements.`;
            }
            const elementInfo = description ? `${description} (ref: ${ref})` : `ref '${ref}'`;
            return `Error typing into element ${elementInfo}: ${elementError.message}`;
        }

    } catch (error) {
        return `Error in typeText: ${error.message}`;
    }
}

typeText.schema = {
    type: "function",
    function: {
        name: "typeText",
        description: "Type text into an element using its aria snapshot reference, with options to type slowly or submit",
        parameters: {
            type: "object",
            properties: {
                text: { type: "string", description: "The text to type" },
                ref: { type: "string", description: "The aria reference of the element to type into (e.g., 'e10')" },
                description: { type: "string", description: "Optional human-readable description of the element for better error messages" },
                submit: { type: "boolean", description: "Whether to press Enter after typing (default: true)" },
                slowly: { type: "boolean", description: "Whether to type text sequentially/slowly (default: false)" }
            },
            required: ["text", "ref"]
        }
    }
}

// Add Anthropic schema
typeText.anthropicSchema = {
    name: "typeText",
    description: "Type text into an element using its aria snapshot reference, with options to type slowly or submit",
    input_schema: {
        type: "object",
        properties: {
            text: { type: "string", description: "The text to type" },
            ref: { type: "string", description: "The aria reference of the element to type into (e.g., 'e10')" },
            description: { type: "string", description: "Optional human-readable description of the element for better error messages" },
            submit: { type: "boolean", description: "Whether to press Enter after typing (default: true)" },
            slowly: { type: "boolean", description: "Whether to type text sequentially/slowly (default: false)" }
        },
        required: ["text", "ref"]
    }
}

async function findInPage(keyword) {
    try {
        if (!page) {
            return "No page available";
        }

        // Create case-insensitive regex pattern
        const regex = new RegExp(keyword, 'i');

        // Get all elements containing the keyword
        const foundElements = await page.getByText(regex).locator("visible=true").all();

        // Extract text from each element and filter out empty strings
        const sentences = [];
        for (const element of foundElements) {
            const text = await element.innerText();
            if (text && text.trim()) {
                sentences.push(text.trim());
            }
        }

        return `The following sentences are found: ${JSON.stringify(sentences)}`;
    } catch (error) {
        return `Error finding in page: ${error.message}`;
    }
}

findInPage.schema = {
    type: "function",
    function: {
        name: "findInPage",
        description: "Look for information by searching a keyword and return sentences that contain the keywords",
        parameters: {
            type: "object",
            properties: {
                keyword: { type: "string", description: "The keyword to search for" }
            },
            required: ["keyword"]
        }
    }
}

// Add Anthropic schema
findInPage.anthropicSchema = {
    name: "findInPage",
    description: "Look for information by searching a keyword and return sentences that contain the keywords",
    input_schema: {
        type: "object",
        properties: {
            keyword: { type: "string", description: "The keyword to search for" }
        },
        required: ["keyword"]
    }
}

function userInput(feedback) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        console.log(`Feedback: ${feedback}`);
        rl.question('Please enter your input: ', (answer) => {
            rl.close();
            console.log(chalk.cyan(`User input: ${answer}`));
            resolve(`User input: ${answer}`);
        });
    });
}

userInput.schema = {
    type: "function",
    function: {
        name: "userInput",
        description: "Solicit user input when the agent needs to know more about the current task",
        parameters: {
            type: "object",
            properties: {
                feedback: { type: "string", description: "The feedback message to display" }
            },
            required: ["feedback"]
        }
    }
}

// Add Anthropic schema
userInput.anthropicSchema = {
    name: "userInput",
    description: "Solicit user input when the agent needs to know more about the current task",
    input_schema: {
        type: "object",
        properties: {
            feedback: { type: "string", description: "The feedback message to display" }
        },
        required: ["feedback"]
    }
}

async function closeBrowser() {
    try {
        if (browser) {
            await browser.close();
            browser = null;
            page = null;
            return "Browser closed";
        }
        return "Browser was not open";
    } catch (error) {
        return `Error closing browser: ${error.message}`;
    }
}

closeBrowser.schema = {
    type: "function",
    function: {
        name: "closeBrowser",
        description: "Close the browser",
        parameters: {
            type: "object",
            properties: {}
        }
    }
}

// Add Anthropic schema
closeBrowser.anthropicSchema = {
    name: "closeBrowser",
    description: "Close the browser",
    input_schema: {
        type: "object",
        properties: {}
    }
}

async function example() {
    await initBrowser();
    console.log(await navigateTo("https://www.nmichaels.org/musings/d4d4/d4d4/"));
    console.log(await ariaSnapshot());
    // console.log(await click({ ref: "e6", description: "button" }));
    // console.log(await ariaSnapshot());
    // console.log(await typeText({ text: "Hello", ref: "e16", description: "searchbox", submit: true }));
    // console.log(await extractPageContent());
    // console.log(await userInput("What is the current page?"));
    // await closeBrowser();
}
// example();

const hn = "go to hackernews (https://news.ycombinator.com/) read the no.1 trending article of this month and give me a summary of it"
const wiki = "go to wikipedia and search for the current prime minister of canada"
const gh = "find some open issues on the top trending repo on github this month"
const eg = "go to https://example.com and click a link"
const ic = "look for vegan salad on instacart and add it to the cart"

await initBrowser();
const systemPrompt = `You are a helpful agent that can think and use tools. Use the tools to solve the problem step by step.
When you use tools, always provide a message to explain your plan along with the tool call. When you trying to find information use findInPage tool. For interaction, use ariaSnapshot to get the content of the whole page, element reference and then use click or typeText tool. When in doubt, solicit user input with userInput tool.`
const agent = new Agent(systemPrompt, [navigateTo, ariaSnapshot, findInPage, userInput, typeText, click], "cd");
await agent.run(hn);
await closeBrowser();
