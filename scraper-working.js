const NewspaperScraper = require('./lib/NewspaperScraper');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set Chrome path for the scraper
process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

async function main() {
    try {
        console.log('🚀 Initializing newspaper scraper with working configuration...');
        console.log('Using browser:', process.env.PUPPETEER_EXECUTABLE_PATH);
        
        // Initialize scraper with working settings
        const scraper = new NewspaperScraper({
            // Core settings - start small
            concurrentPages: 1,
            resultsPerPage: 10,
            maxConcurrentRequests: 3,
            
            // Browser configuration that works
            browser: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process',
                    '--no-zygote'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
            },
            
            // No proxy for now
            proxy: {
                enabled: false
            },

            // Verbose logging
            logger: {
                level: 'debug'
            }
        });

        // Handle found articles
        scraper.on('article', async (article) => {
            console.log('---');
            console.log(`✅ NEW ARTICLE FOUND:`);
            console.log(`   Title: ${article.title}`);
            console.log(`   Date: ${article.date}`);
            console.log(`   Newspaper: ${article.newspaper}`);
            console.log(`   Page: ${article.pageNumber}`);
            console.log(`   URL: ${article.pageUrl}`);
            
            // Save to file
            await fs.mkdir('output', { recursive: true });
            const safeTitle = article.title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `article_${article.date}_${safeTitle}.json`;
            await fs.writeFile(
                path.join('output', filename),
                JSON.stringify(article, null, 2)
            );
            console.log(`   💾 Saved to: output/${filename}`);
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
            console.log('🎉 SCRAPING COMPLETE!');
            console.log(`⏱️ Total time: ${(stats.timeElapsed / 1000).toFixed(2)} seconds`);
            console.log(`📄 Total articles: ${stats.totalArticles}`);
        });

        console.log('🔍 Starting newspaper search...');
        console.log('Keyword: "technology"');
        console.log('Limit: 5 articles');
        console.log('Date range: 2024');
        console.log('Location: US');
        console.log('---');
        
        // Start with small test
        await scraper.retrieve({
            keyword: "technology",
            limit: 5,
            dateRange: [2024, 2024],
            location: "us"
        });

    } catch (error) {
        console.error('💥 SCRAPING FAILED:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run with error handling
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
