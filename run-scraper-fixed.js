const NewspaperScraper = require('./lib/NewspaperScraper');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set Chrome path for headless environment
process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

async function main() {
    try {
        // Initialize scraper with all available options
        const scraper = new NewspaperScraper({
            // Core settings
            concurrentPages: 2,
            resultsPerPage: 50,
            maxConcurrentRequests: 10,
            
            // Browser configuration - FIXED for headless
            browser: {
                headless: true,        // Changed to true for Codespaces
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
            },
            
            // Proxy configuration (optional)
            proxy: {
                enabled: false,        // Keep disabled unless you have proxies
                host: process.env.PROXY_HOST,
                port: process.env.PROXY_PORT || 9008,
                username: process.env.PROXY_USER,
                password: process.env.PROXY_PASS
            },

            // Logging configuration
            logger: {
                level: 'info'
            }
        });

        // Handle found articles
        scraper.on('article', async (article) => {
            // Save each article to a file (optional)
            await fs.mkdir('output', { recursive: true });
            const filename = `article_${Date.now()}.json`;
            await fs.writeFile(
                path.join('output', filename),
                JSON.stringify(article, null, 2)
            );
            console.log(`Found article: ${article.title} (${article.date})`);
        });

        // Show progress and stats
        scraper.on('progress', ({current, total, percentage, stats}) => {
            console.log(`Progress: ${percentage.toFixed(2)}% (${current}/${total} pages)`);
            console.log(`Time elapsed: ${stats.timeElapsed.toFixed(2)}s`);
            console.log(`Average time per page: ${stats.avgPageTime.toFixed(2)}s`);
        });

        // Handle completion
        scraper.on('complete', (stats) => {
            console.log('Scraping complete!');
            console.log(`Total time: ${(stats.timeElapsed / 1000).toFixed(2)} seconds`);
        });

        // Start retrieving
        await scraper.retrieve({
            keyword: "technology",  // Changed to simpler term for testing
            limit: 10,             // Smaller limit for testing
            dateRange: [2024, 2024], // Current year only for testing
            location: "us"
        });

    } catch (error) {
        console.error('Scraping failed:', error);
    }
}

main();
