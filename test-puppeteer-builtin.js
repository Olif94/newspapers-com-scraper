const puppeteer = require('puppeteer');

async function test() {
    console.log('Testing Puppeteer with built-in browser...');
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ]
        });
        console.log('✅ Browser launched successfully!');
        
        const page = await browser.newPage();
        await page.goto('https://example.com', { waitUntil: 'networkidle2' });
        console.log('✅ Page loaded successfully!');
        
        const title = await page.title();
        console.log('✅ Page title:', title);
        
        await page.screenshot({ path: 'test-screenshot.png' });
        console.log('✅ Screenshot saved!');
        
        await browser.close();
        console.log('✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Puppeteer test failed:', error.message);
    }
}

test();
