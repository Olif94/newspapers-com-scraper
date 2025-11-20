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
        console.log('🚀 Historical Newspaper Scraper - "coolie" Search 1870');
        console.log('======================================================\\n');
        
        const scraper = new NewspaperScraper({
            concurrentPages: 1,        // Go slower for historical searches
            resultsPerPage: 20,
            maxConcurrentRequests: 3,
            
            browser: {
                headless: 'new',
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
            
            console.log(`📜 HISTORICAL ARTICLE ${totalArticles}:`);
            console.log(`   📅 Date: ${article.date}`);
            console.log(`   🏷️  Title: ${article.title || 'N/A'}`);
            console.log(`   📄 Page: ${article.pageNumber || 'N/A'}`);
            console.log(`   📍 Location: ${article.location || 'N/A'}`);
            console.log(`   🔢 "coolie" matches: ${article.keywordMatches || 'N/A'}`);
            console.log(`   🏢 Newspaper: ${article.newspaper || 'N/A'}`);
            console.log('   ---');

            // Save individual article
            await fs.mkdir('historical_output', { recursive: true });
            const safeTitle = (article.title || 'untitled').substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `coolie_${article.date}_${safeTitle}.json`;
            await fs.writeFile(
                path.join('historical_output', filename),
                JSON.stringify(article, null, 2)
            );
        });

        scraper.on('progress', ({current, total, percentage, stats}) => {
            const elapsed = (Date.now() - startTime) / 1000;
            console.log(`📊 Progress: ${current} pages | ${percentage.toFixed(2)}% | ${elapsed.toFixed(1)}s`);
        });

        scraper.on('complete', (stats) => {
            const totalTime = (Date.now() - startTime) / 1000;
            console.log('\\n🎉 HISTORICAL SEARCH COMPLETED!');
            console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
            console.log(`📜 Articles about "coolie" found: ${totalArticles}`);
            console.log(`💾 Saved to: historical_output/ directory`);
            
            // Save summary
            const summary = {
                search: {
                    keyword: "coolie",
                    dateRange: [1870, 1870],
                    location: "California",
                    description: "Search for 'coolie' in 1870 California newspapers"
                },
                results: {
                    totalArticles: totalArticles,
                    searchTime: totalTime,
                    articles: articles
                }
            };
            
            fs.writeFile(
                'coolie_1870_search_summary.json',
                JSON.stringify(summary, null, 2)
            );
            console.log(`📋 Summary saved: coolie_1870_search_summary.json`);
        });

        scraper.on('error', (error) => {
            console.error('❌ Search error:', error.message);
        });

        console.log('🔍 Starting historical search:');
        console.log('   Keyword: "coolie"');
        console.log('   Year: 1870');
        console.log('   Location: California');
        console.log('   Limit: 50 articles');
        console.log('\\n--- Searching historical archives ---\\n');
        
        await scraper.retrieve({
            keyword: "coolie",
            limit: 50,
            dateRange: [1870, 1870],
            location: "us-ca"  // California location code
        });

    } catch (error) {
        const totalTime = (Date.now() - startTime) / 1000;
        console.error(`💥 Search failed after ${totalTime.toFixed(2)} seconds:`, error.message);
    }
}

main();
