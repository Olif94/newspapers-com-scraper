const puppeteer = require('puppeteer');

async function test() {
    console.log('Testing Puppeteer...');
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('✅ Browser launched successfully!');
        
        const page = await browser.newPage();
        await page.goto('https://example.com');
        console.log('✅ Page loaded successfully!');
        
        const title = await page.title();
        console.log('✅ Page title:', title);
        
        await browser.close();
        console.log('✅ Test completed!');
    } catch (error) {
        console.error('❌ Puppeteer test failed:', error.message);
        console.error('Full error:', error);
    }
}

test();
