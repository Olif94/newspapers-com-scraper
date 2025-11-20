const NewspaperScraper = require('./lib/NewspaperScraper');

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

// Test a few quarters to see the natural distribution
const testQuarters = [
    { name: '1870_Q1', range: [1870, 1870], months: 'Jan-Mar 1870' },
    { name: '1870_Q2', range: [1870, 1870], months: 'Apr-Jun 1870' },
    { name: '1871_Q1', range: [1871, 1871], months: 'Jan-Mar 1871' },
    { name: '1872_Q3', range: [1872, 1872], months: 'Jul-Sep 1872' }
];

async function testQuarter(quarter) {
    console.log(`\\n�� Testing: ${quarter.name} (${quarter.months})`);
    
    const articles = [];
    const scraper = new NewspaperScraper({
        browser: { headless: 'new', args: ['--no-sandbox'] },
        logger: { level: 'info' }
    });

    return new Promise((resolve) => {
        scraper.on('article', (article) => {
            articles.push(article);
        });

        scraper.on('progress', ({current, total, percentage}) => {
            if (current % 5 === 0) {
                console.log(`   📄 ${current}/${total} pages (${percentage.toFixed(1)}%)`);
            }
        });

        scraper.on('complete', () => {
            console.log(`   ✅ ${articles.length} articles in ${quarter.name}`);
            resolve(articles.length);
        });

        scraper.on('error', (error) => {
            console.error(`   ❌ Error:`, error.message);
            resolve(0);
        });

        scraper.retrieve({
            keyword: "coolie",
            limit: 5000, // Set very high to ensure we get everything
            dateRange: quarter.range,
            location: "us-ca"
        }).catch(() => resolve(0));
    });
}

async function main() {
    console.log('📊 TESTING QUARTERLY DISTRIBUTION PATTERNS');
    console.log('==========================================\\n');
    
    const results = [];
    
    for (const quarter of testQuarters) {
        const count = await testQuarter(quarter);
        results.push({ quarter: quarter.name, count });
        
        // Delay between tests
        if (quarter !== testQuarters[testQuarters.length - 1]) {
            console.log('   �� Waiting 20 seconds...\\n');
            await new Promise(resolve => setTimeout(resolve, 20000));
        }
    }
    
    console.log('\\n🎯 QUARTERLY DISTRIBUTION RESULTS:');
    console.log('================================');
    results.forEach(result => {
        console.log(`   ${result.quarter}: ${result.count} articles`);
    });
    
    const avg = results.reduce((sum, r) => sum + r.count, 0) / results.length;
    console.log(`\\n📈 Average per quarter: ${avg.toFixed(1)} articles`);
    console.log(`📊 Range: ${Math.min(...results.map(r => r.count))} - ${Math.max(...results.map(r => r.count))}`);
    
    // Check if any are exactly 200
    const exactly200 = results.filter(r => r.count === 200).length;
    console.log(`🔍 Quarters with exactly 200: ${exactly200}/${results.length}`);
    
    if (exactly200 > 0) {
        console.log('⚠️  Some quarters have exactly 200 - might be hitting limits for those periods');
    } else {
        console.log('✅ No 200 pattern detected - natural distribution');
    }
}

main().catch(console.error);
