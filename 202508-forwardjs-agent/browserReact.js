import { chromium } from 'playwright';
import readline from 'readline';

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

async function snapshot() {
    try {
        if (!page) {
            return "No page available";
        }

        // Select only interactive elements directly
        elements = await page.locator("input, a, button, select, textarea, summary, h1, h2, h3, h4, h5, h6, p, span")
            .locator("visible=true")
            .all();

        if (elements.length > 0) {
            const res = {};
            const elementsToProcess = elements.slice(0, 100); // Limit to first 100 elements

            for (let idx = 0; idx < elementsToProcess.length; idx++) {
                const elem = elementsToProcess[idx];
                const tagName = await elem.evaluate(el => el.tagName.toLowerCase());

                if (tagName === "input") {
                    const inputInfo = await elem.evaluate(el => ({
                        type: el.type,
                        value: el.value,
                        placeholder: el.placeholder,
                        role: el.role,
                        name: el.name
                    }));
                    res[idx] = `Input: ${JSON.stringify(inputInfo)}`;
                } else if (tagName === "a") {
                    const linkInfo = await elem.evaluate(el => ({
                        href: el.href,
                        text: el.textContent.trim()
                    }));
                    res[idx] = `Link: ${JSON.stringify(linkInfo)}`;
                } else {
                    let text = `${tagName}: `;
                    const innerText = await elem.innerText();
                    text += innerText.trim();

                    if (text.trim() !== `${tagName}:`) {
                        res[idx] = text;
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
                        res[idx] = `Element: ${JSON.stringify(attrs)}`;
                    }
                }
            }
            return `Interactive elements found: ${JSON.stringify(res, null, 2)}`;
        } else {
            return "No interactive elements found";
        }
    } catch (error) {
        return `Error taking snapshot: ${error.message}`;
    }
}

snapshot.schema = {
    type: "function",
    function: {
        name: "snapshot",
        description: "Generate a snapshot of the current page, including all interactive elements, text, and links. This is slow, so use it sparingly.",
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

async function clickElement(index = 0) {
    try {
        if (!page) {
            return "No page available";
        }

        const oldUrl = page.url();

        if (elements.length > 0 && elements[index]) {
            try {
                // Set up navigation promise with timeout
                const navigationPromise = page.waitForNavigation({ timeout: 3000 });

                await elements[index].click();

                try {
                    await navigationPromise;
                    if (page.url() !== oldUrl) {
                        await page.waitForLoadState();
                        return "Element clicked, navigating to new page";
                    }
                    return "Element clicked, no navigation occurred";
                } catch (timeoutError) {
                    if (page.url() === oldUrl) {
                        return "Element clicked, no navigation occurred";
                    }
                    return "Element clicked, navigation may have occurred";
                }
            } catch (error) {
                return `Error clicking element: ${error.message}`;
            }
        } else {
            return "No elements available to click or invalid index";
        }
    } catch (error) {
        return `Error in clickElement: ${error.message}`;
    }
}

clickElement.schema = {
    type: "function",
    function: {
        name: "clickElement",
        description: "Click an element using its index",
        parameters: {
            type: "object",
            properties: {
                index: { type: "number", description: "The index of the element to click (default: 0)" }
            }
        }
    }
}

async function typeText(text, index = 0) {
    try {
        if (!page) {
            return "No page available";
        }

        if (elements.length > 0 && elements[index]) {
            await elements[index].fill(text);
            await page.waitForTimeout(1500);
            return `Type '${text}' into element ${index}.`;
        } else {
            return "No element was typed into";
        }
    } catch (error) {
        return `Error typing text: ${error.message}`;
    }
}

typeText.schema = {
    type: "function",
    function: {
        name: "typeText",
        description: "Type text into an element",
        parameters: {
            type: "object",
            properties: {
                text: { type: "string", description: "The text to type" },
                index: { type: "number", description: "The index of the element to type into (default: 0)" }
            },
            required: ["text"]
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
            elements = [];
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

// Example usage (commented out)

async function example() {
    await initBrowser();
    console.log(await navigateTo("https://www.example.com"));
    console.log(await snapshot());
    console.log(await findInPage("Domain"));
    console.log(await clickElement(3));
    console.log(await userInput("What is the current page?"));
    await closeBrowser();
}

example();