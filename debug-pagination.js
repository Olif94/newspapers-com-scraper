const NewspaperScraper = require('./lib/NewspaperScraper');

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

async function testPagination() {
    console.log('🔍 DEBUGGING PAGINATION AND LIMITS\\n');
    
    const testCases = [
        { limit: 50, description: 'Small limit' },
        { limit: 100, description: 'Medium limit' },
        { limit: 500, description: 'Large limit' },
        { limit: 1000, description: 'Very large limit' }
    ];
    
    for (const testCase of testCases) {
        console.log(`\\n🧪 TEST: ${testCase.description} (limit: ${testCase.limit})`);
        
        const articles = [];
        let pageCount = 0;
        let totalPagesAvailable = 0;
        
        const scraper = new NewspaperScraper({
            browser: { headless: 'new', args: ['--no-sandbox'] },
            logger: { level: 'info' }
        });

        scraper.on('article', (article) => {
            articles.push(article);
        });

        scraper.on('progress', ({current, total, percentage}) => {
            pageCount = current;
            totalPagesAvailable = total;
            console.log(`   📄 Page ${current} of ${total} (${percentage.toFixed(1)}%) - ${articles.length} articles so far`);
        });

        scraper.on('complete', () => {
            console.log(`   ✅ COMPLETE: ${articles.length} articles from ${pageCount} pages`);
            console.log(`   📊 Total pages available: ${totalPagesAvailable}`);
            
            // Check if we hit the limit
            if (articles.length >= testCase.limit) {
                console.log(`   ⚠️  HIT LIMIT: Got exactly ${articles.length} (requested ${testCase.limit})`);
            } else if (articles.length < testCase.limit && pageCount >= totalPagesAvailable) {
                console.log(`   ℹ️  EXHAUSTED: Got all available articles (${articles.length})`);
            }
        });

        await scraper.retrieve({
            keyword: "coolie",
            limit: testCase.limit,
            dateRange: [1870, 1870],
            location: "us-ca"
        });
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

testPagination().catch(console.error);
