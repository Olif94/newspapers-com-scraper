const NewspaperScraper = require('newspapers-com-scraper');

async function main() {
    const scraper = new NewspaperScraper();

    // Listen for articles as they're found
    scraper.on('article', (article) => {
        console.log(`Found: ${article.title} (${article.date})`);
        console.log(`Page: ${article.pageUrl}`);
        console.log('---');
    });

    try {
        console.log('Starting scrape...');
        
        await scraper.retrieve({
            keyword: "elon musk twitter",  // Your search term
            limit: 50,                     // Start small for testing
            dateRange: [2020, 2024],       // Date range
            location: "us"                 // Location
        });
        
        console.log('Scraping completed!');
    } catch (error) {
        console.error('Error during scraping:', error);
    }
}

// Run the scraper
main();