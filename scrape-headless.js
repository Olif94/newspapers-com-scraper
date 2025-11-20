const NewspaperScraper = require('newspapers-com-scraper');

// Force headless mode for Codespaces
process.env.PUPPETEER_HEADLESS = 'true';

async function main() {
    try {
        console.log('Starting headless scrape...');
        
        const scraper = new NewspaperScraper();
        
        scraper.on('article', (article) => {
            console.log(`✓ Found: ${article.title}`);
            console.log(`  Date: ${article.date}`);
            console.log(`  Page: ${article.pageUrl}`);
            console.log('---');
        });

        await scraper.retrieve({
            keyword: "technology",
            limit: 10,
            dateRange: [2023, 2024],
            location: "us"
        });
        
        console.log('Scraping completed successfully!');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();