import { chromium } from 'playwright';
import readline from 'readline';
import { Agent } from './react.js';

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

async function getCurrentPage() {
    if (!browser) {
        throw new Error('Browser not initialized. Call initBrowser() first.');
    }

    const contexts = browser.contexts();
    if (contexts.length === 0) {
        const context = await browser.newContext();
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

async function clickAriaElem({ ref, description }) {
    try {
        if (!browser) {
            return "Browser not initialized. Call initBrowser() first.";
        }

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

clickAriaElem.schema = {
    type: "function",
    function: {
        name: "clickAriaElem",
        description: "Click an element using its aria snapshot reference (e.g., 'e10', 'e15')",
        parameters: {
            type: "object",
            properties: {
                ref: { type: "string", description: "The aria reference of the element to click (e.g., 'e10')" }
            },
            required: ["ref"]
        }
    }
}

async function typeText({ text, ref, description = null, submit = false }) {
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


            await ariaElement.fill(text);



            let result = '';
            const elementInfo = description ? `${description} (${ref})` : `'${ref}'`;

            result = `Typed '${text}' into element ${elementInfo}`;


            if (submit) {
                await ariaElement.press('Enter');
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
                submit: { type: "boolean", description: "Whether to press Enter after typing (default: false)" },
                slowly: { type: "boolean", description: "Whether to type text sequentially/slowly (default: false)" }
            },
            required: ["text", "ref"]
        }
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

function userInput(feedback) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        console.log(`Feedback: ${feedback}`);
        rl.question('Please enter your input: ', (answer) => {
            rl.close();
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

async function example() {
    await initBrowser();
    console.log(await navigateTo("https://google.com"));
    console.log(await ariaSnapshot());
    // console.log(await clickAriaElem({ ref: "e7762", description: "listitem" }));
    console.log(await typeText({ text: "Hello", ref: "e44", description: "searchbox", submit: true }));
    // console.log(await findInPage("Domain"));
    // console.log(await userInput("What is the current page?"));
    // await closeBrowser();
}
example();
// await initBrowser();
// const systemPrompt = `You are a helpful agent that can think and use tools. Use the tools to solve the problem step by step.
// When you use tools, always provide a message to explain your plan along with the tool call. When you trying to find information, use findInPage tool. For interaction, use ariaSnapshot to get the element reference and then clickAriaElem or typeText tool.`
// const agent = new Agent(systemPrompt, [navigateTo, snapshot, findInPage, clickElement, userInput, closeBrowser, typeText], "cs");
// agent.run("Use wiki to find out the current PM of Canada");