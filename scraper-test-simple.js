const NewspaperScraper = require('./lib/NewspaperScraper');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

async function main() {
    console.log('🧪 TEST: 1 State + 1 Year');
    console.log('=========================\\n');
    
    const testState = { code: 'us-ca', name: 'California' };
    const testYear = 1870;
    
    console.log(`📍 State: ${testState.name} (${testState.code})`);
    console.log(`📅 Year: ${testYear}`);
    console.log(`🔍 Keyword: "coolie"\\n`);
    
    const articles = [];
    const scraper = new NewspaperScraper({
        concurrentPages: 2,
        resultsPerPage: 50,
        browser: { 
            headless: 'new', 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
        },
        logger: { level: 'info' }
    });

    let pageCount = 0;
    let totalPages = 0;
    
    scraper.on('article', (article) => {
        articles.push({
            state: testState.name,
            state_code: testState.code,
            year: testYear,
            date: article.date,
            newspaper: article.newspaper || 'Unknown',
            title: article.title || 'No Title',
            page: article.pageNumber || '',
            location: article.location || '',
            matches: article.keywordMatches || 0,
            url: article.pageUrl || ''
        });
        
        if (articles.length % 25 === 0) {
            console.log(`   📥 Collected ${articles.length} articles...`);
        }
    });

    scraper.on('progress', ({current, total, percentage}) => {
        pageCount = current;
        totalPages = total;
        if (current % 5 === 0) {
            console.log(`   📄 Page ${current}/${total} (${percentage.toFixed(1)}%)`);
        }
    });

    scraper.on('complete', async () => {
        console.log(`\\n✅ SEARCH COMPLETE!`);
        console.log(`📊 Results: ${articles.length} articles from ${pageCount} pages`);
        
        // Analyze the data
        console.log(`\\n📈 DATA ANALYSIS:`);
        
        // Count by newspaper
        const newspaperCounts = {};
        articles.forEach(article => {
            newspaperCounts[article.newspaper] = (newspaperCounts[article.newspaper] || 0) + 1;
        });
        
        console.log(`   Unique newspapers: ${Object.keys(newspaperCounts).length}`);
        console.log(`   Top newspapers:`);
        Object.entries(newspaperCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([paper, count]) => {
                console.log(`     - ${paper}: ${count} articles`);
            });
        
        // Check date range
        const dates = articles.map(a => a.date).filter(Boolean);
        if (dates.length > 0) {
            const minDate = dates.reduce((min, d) => d < min ? d : min);
            const maxDate = dates.reduce((max, d) => d > max ? d : max);
            console.log(`   Date range: ${minDate} to ${maxDate}`);
        }
        
        // Check match distribution
        const matchStats = {};
        articles.forEach(article => {
            const matches = article.matches;
            matchStats[matches] = (matchStats[matches] || 0) + 1;
        });
        
        console.log(`   Match distribution:`);
        Object.entries(matchStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([matches, count]) => {
                console.log(`     - ${matches} matches: ${count} pages`);
            });
        
        // Save the test results
        const csvWriter = createCsvWriter({
            path: `test_coolie_${testState.code}_${testYear}.csv`,
            header: [
                {id: 'state', title: 'State'},
                {id: 'state_code', title: 'State_Code'},
                {id: 'year', title: 'Year'},
                {id: 'date', title: 'Date'},
                {id: 'newspaper', title: 'Newspaper'},
                {id: 'title', title: 'Title'},
                {id: 'page', title: 'Page'},
                {id: 'location', title: 'Location'},
                {id: 'matches', title: 'Matches'},
                {id: 'url', title: 'URL'}
            ]
        });
        
        await csvWriter.writeRecords(articles);
        console.log(`\\n💾 Saved: test_coolie_${testState.code}_${testYear}.csv`);
        console.log(`📁 File ready for inspection`);
        
        // Show sample data
        console.log(`\\n🔍 SAMPLE DATA (first 3 articles):`);
        console.log('================================');
        articles.slice(0, 3).forEach((article, i) => {
            console.log(`Article ${i + 1}:`);
            console.log(`  Date: ${article.date}`);
            console.log(`  Newspaper: ${article.newspaper}`);
            console.log(`  Title: ${article.title}`);
            console.log(`  Page: ${article.page}`);
            console.log(`  Matches: ${article.matches}`);
            console.log(`  Location: ${article.location}`);
            console.log('');
        });
        
        console.log(`🎯 TEST SUCCESSFUL!`);
        console.log(`Next: Run the full state-year scraper if this looks good.`);
    });

    scraper.on('error', (error) => {
        console.error(`❌ Search error:`, error.message);
    });

    console.log('Starting test search...\\n');
    
    await scraper.retrieve({
        keyword: "coolie",
        limit: 5000, // High limit to get everything
        dateRange: [testYear, testYear],
        location: testState.code
    });
}

main().catch(console.error);
