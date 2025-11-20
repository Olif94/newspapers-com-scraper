const NewspaperScraper = require('./lib/NewspaperScraper');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

// Split 1870 into 3-month chunks (quarters)
const quarterlyChunks = [
    { name: '1870_Jan_Mar', range: [1870, 1870], months: 'January-March' },
    { name: '1870_Apr_Jun', range: [1870, 1870], months: 'April-June' },
    { name: '1870_Jul_Sep', range: [1870, 1870], months: 'July-September' },
    { name: '1870_Oct_Dec', range: [1870, 1870], months: 'October-December' }
];

async function scrapeQuarter(quarter, chunkName) {
    console.log(`\n📅 Scanning: ${chunkName} (${quarter.months})`);
    
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

    return new Promise((resolve, reject) => {
        let articleCount = 0;
        
        scraper.on('article', (article) => {
            articleCount++;
            articles.push({
                Date: article.date,
                Newspaper: article.newspaper || 'Unknown',
                Title: article.title || 'No Title',
                Page: article.pageNumber || '',
                Location: article.location || '',
                Matches: article.keywordMatches || 0,
                URL: article.pageUrl || '',
                Quarter: chunkName,
                Content_Preview: (article.content || '').substring(0, 200)
            });
            
            if (articleCount % 25 === 0) {
                console.log(`   📥 ${articleCount} articles found in ${chunkName}...`);
            }
        });

        scraper.on('progress', ({current, total, percentage}) => {
            if (current % 10 === 0) {
                console.log(`   📄 Pages: ${current}/${total} (${percentage.toFixed(1)}%)`);
            }
        });

        scraper.on('complete', () => {
            console.log(`   ✅ COMPLETE: ${articles.length} articles in ${chunkName}`);
            resolve(articles);
        });

        scraper.on('error', (error) => {
            console.error(`   ❌ Error in ${chunkName}:`, error.message);
            resolve(articles); // Resolve with what we have
        });

        console.log(`   🔍 Starting search for "coolie" in ${quarter.months} 1870...`);
        
        scraper.retrieve({
            keyword: "coolie",
            limit: 1000, // High limit per quarter
            dateRange: quarter.range,
            location: "us-ca"
        }).catch(reject);
    });
}

async function main() {
    console.log('🗓️  QUARTERLY NEWSPAPER SEARCH: "coolie" in 1870 California');
    console.log('===========================================================\n');
    
    let allArticles = [];
    let totalTime = 0;
    
    for (const [index, quarter] of quarterlyChunks.entries()) {
        const chunkStartTime = Date.now();
        
        const articles = await scrapeQuarter(quarter, quarter.name);
        allArticles = allArticles.concat(articles);
        
        const chunkTime = (Date.now() - chunkStartTime) / 1000;
        totalTime += chunkTime;
        
        // Save individual quarter results
        if (articles.length > 0) {
            const csvWriter = createCsvWriter({
                path: `coolie_${quarter.name}.csv`,
                header: [
                    {id: 'Date', title: 'Publication_Date'},
                    {id: 'Newspaper', title: 'Newspaper_Name'},
                    {id: 'Title', title: 'Article_Title'},
                    {id: 'Page', title: 'Page_Number'},
                    {id: 'Location', title: 'Location'},
                    {id: 'Matches', title: 'Keyword_Matches'},
                    {id: 'URL', title: 'Source_URL'},
                    {id: 'Quarter', title: 'Time_Period'},
                    {id: 'Content_Preview', title: 'Content_Preview'}
                ]
            });
            
            await csvWriter.writeRecords(articles);
            console.log(`   💾 Saved: coolie_${quarter.name}.csv (${articles.length} articles)`);
        }
        
        // Progress summary
        console.log(`   ⏱️  Chunk time: ${(chunkTime / 60).toFixed(1)} minutes`);
        console.log(`   📊 Total so far: ${allArticles.length} articles`);
        
        // Delay between quarters (be respectful to the website)
        if (index < quarterlyChunks.length - 1) {
            const delaySeconds = 30;
            console.log(`   ⏳ Waiting ${delaySeconds} seconds before next quarter...\n`);
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }
    }
    
    // Final summary and combined dataset
    console.log('\n🎉 ALL QUARTERS COMPLETED!');
    console.log('=========================\n');
    
    console.log(`📅 Quarterly Breakdown:`);
    quarterlyChunks.forEach(quarter => {
        const quarterArticles = allArticles.filter(a => a.Quarter === quarter.name);
        console.log(`   ${quarter.months}: ${quarterArticles.length} articles`);
    });
    
    console.log(`\n📚 GRAND TOTAL: ${allArticles.length} articles`);
    console.log(`⏱️  Total time: ${(totalTime / 60).toFixed(1)} minutes`);
    console.log(`🚀 Average: ${(allArticles.length / totalTime).toFixed(1)} articles/minute`);
    
    // Save combined dataset
    if (allArticles.length > 0) {
        const csvWriter = createCsvWriter({
            path: `coolie_1870_complete_${allArticles.length}_articles.csv`,
            header: [
                {id: 'Date', title: 'Publication_Date'},
                {id: 'Newspaper', title: 'Newspaper_Name'},
                {id: 'Title', title: 'Article_Title'},
                {id: 'Page', title: 'Page_Number'},
                {id: 'Location', title: 'Location'},
                {id: 'Matches', title: 'Keyword_Matches'},
                {id: 'URL', title: 'Source_URL'},
                {id: 'Quarter', title: 'Quarter'},
                {id: 'Content_Preview', title: 'Content_Preview'}
            ]
        });
        
        await csvWriter.writeRecords(allArticles);
        console.log(`\n💾 COMBINED DATASET: coolie_1870_complete_${allArticles.length}_articles.csv`);
        console.log(`📁 Individual quarter files also saved`);
        
        // Show sample of data
        console.log(`\n🔍 Sample from dataset:`);
        console.log('Date       | Newspaper                | Title');
        console.log('-----------|--------------------------|-------------------');
        allArticles.slice(0, 5).forEach(article => {
            console.log(`${article.Date} | ${article.Newspaper.padEnd(24)} | ${article.Title.substring(0, 30)}...`);
        });
    } else {
        console.log('❌ No articles found in any quarter');
    }
}

main().catch(error => {
    console.error('💥 Script failed:', error.message);
});
