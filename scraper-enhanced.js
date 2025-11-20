const NewspaperScraper = require('./lib/NewspaperScraper');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set Chrome path
process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

async function main() {
    const startTime = Date.now();
    let totalArticles = 0;
    
    try {
        console.log('🚀 Enhanced Newspaper Scraper Starting...\\n');
        
        const scraper = new NewspaperScraper({
            concurrentPages: 2,
            resultsPerPage: 20,
            maxConcurrentRequests: 5,
            
            browser: {
                headless: 'new',  // Use new headless to avoid deprecation warning
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
            },
            
            proxy: { enabled: false },
            logger: { level: 'info' }
        });

        // Track articles
        const articles = [];
        
        scraper.on('article', async (article) => {
            totalArticles++;
            articles.push(article);
            
            console.log(`📰 ARTICLE ${totalArticles}:`);
            console.log(`   📅 Date: ${article.date}`);
            console.log(`   🏷️  Title: ${article.title || 'N/A'}`);
            console.log(`   📄 Page: ${article.pageNumber || 'N/A'}`);
            console.log(`   📍 Location: ${article.location || 'N/A'}`);
            console.log(`   🔢 Matches: ${article.keywordMatches || 'N/A'}`);
            console.log(`   🏢 Newspaper: ${article.newspaper || 'N/A'}`);
            console.log(`   🔗 URL: ${article.pageUrl || 'N/A'}`);
            console.log('   ---');

            // Save individual article
            await fs.mkdir('output', { recursive: true });
            const safeTitle = (article.title || 'untitled').substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `article_${totalArticles}_${article.date}_${safeTitle}.json`;
            await fs.writeFile(
                path.join('output', filename),
                JSON.stringify(article, null, 2)
            );
        });

        scraper.on('progress', ({current, total, percentage, stats}) => {
            const elapsed = (Date.now() - startTime) / 1000;
            console.log(`📊 Progress: ${current} pages processed | ${percentage.toFixed(2)}% | ${elapsed.toFixed(1)}s elapsed`);
        });

        scraper.on('complete', (stats) => {
            const totalTime = (Date.now() - startTime) / 1000;
            console.log('\\n🎉 SCRAPING COMPLETED!');
            console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
            console.log(`📄 Articles found: ${totalArticles}`);
            console.log(`💾 Saved to: output/ directory`);
        });

        scraper.on('error', (error) => {
            console.error('❌ Error:', error.message);
        });

        console.log('🔍 Starting search with parameters:');
        console.log('   Keyword: "artificial intelligence"');
        console.log('   Limit: 15 articles');
        console.log('   Date range: 2023-2024');
        console.log('   Location: US');
        console.log('\\n--- Starting scrape ---\\n');
        
        await scraper.retrieve({
            keyword: "artificial intelligence",
            limit: 15,
            dateRange: [2023, 2024],
            location: "us"
        });

    } catch (error) {
        const totalTime = (Date.now() - startTime) / 1000;
        console.error(`💥 Scraping failed after ${totalTime.toFixed(2)} seconds:`, error.message);
    }
}

main();
