const NewspaperScraper = require('./lib/NewspaperScraper');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
    try {
        console.log('🚀 Initializing newspaper scraper with headless configuration...');
        
        // Initialize scraper with PROPER headless settings
        const scraper = new NewspaperScraper({
            // Core settings
            concurrentPages: 1,        // Start with 1 for stability
            resultsPerPage: 20,        // Smaller page size
            maxConcurrentRequests: 5,  // Fewer concurrent requests
            
            // PROPER Browser configuration for headless environment
            browser: {
                headless: 'new',       // Use new headless mode
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--window-size=1920,1080'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
            },
            
            // Disable proxy for now
            proxy: {
                enabled: false
            },

            // More verbose logging
            logger: {
                level: 'debug'
            }
        });

        // Handle found articles
        scraper.on('article', async (article) => {
            await fs.mkdir('output', { recursive: true });
            const filename = `article_${article.date}_${article.title.substring(0, 20)}.json`.replace(/[^a-zA-Z0-9]/g, '_');
            await fs.writeFile(
                path.join('output', filename),
                JSON.stringify(article, null, 2)
            );
            console.log(`✅ Found: ${article.title} (${article.date})`);
        });

        // Show progress
        scraper.on('progress', ({current, total, percentage, stats}) => {
            console.log(`📊 Progress: ${percentage.toFixed(2)}% (${current}/${total} pages)`);
        });

        // Handle errors
        scraper.on('error', (error) => {
            console.error('❌ Scraper error:', error.message);
        });

        // Handle completion
        scraper.on('complete', (stats) => {
            console.log('🎉 Scraping complete!');
            console.log(`⏱️ Total time: ${(stats.timeElapsed / 1000).toFixed(2)} seconds`);
        });

        console.log('🔍 Starting search with small test...');
        
        // Start with VERY small test
        await scraper.retrieve({
            keyword: "technology",     // Simple term
            limit: 3,                 // VERY small limit for testing
            dateRange: [2024, 2024],   // Current year only
            location: "us"
        });

    } catch (error) {
        console.error('💥 Scraping failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run with proper error handling
main().catch(console.error);
