const NewspaperScraper = require('./lib/NewspaperScraper');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

// Quarterly chunks for 1870-1871
const quarterlyChunks = [
    { name: '1870_Jan_Mar', range: [1870, 1870], months: 'January-March 1870' },
    { name: '1870_Apr_Jun', range: [1870, 1870], months: 'April-June 1870' },
    { name: '1870_Jul_Sep', range: [1870, 1870], months: 'July-September 1870' },
    { name: '1870_Oct_Dec', range: [1870, 1870], months: 'October-December 1870' },
    { name: '1871_Jan_Mar', range: [1871, 1871], months: 'January-March 1871' },
    { name: '1871_Apr_Jun', range: [1871, 1871], months: 'April-June 1871' },
    { name: '1871_Jul_Sep', range: [1871, 1871], months: 'July-September 1871' },
    { name: '1871_Oct_Dec', range: [1871, 1871], months: 'October-December 1871' }
];

// Basic newspaper location mapping (expand this)
const newspaperLocationMap = {
    'San Francisco Chronicle': { city: 'San Francisco', county: 'San Francisco', state: 'CA' },
    'The San Francisco Examiner': { city: 'San Francisco', county: 'San Francisco', state: 'CA' },
    'Los Angeles Star': { city: 'Los Angeles', county: 'Los Angeles', state: 'CA' },
    'The Sacramento Bee': { city: 'Sacramento', county: 'Sacramento', state: 'CA' },
    'Appeal-Democrat': { city: 'Marysville', county: 'Yuba', state: 'CA' },
    'Daily Evening Herald': { city: 'Stockton', county: 'San Joaquin', state: 'CA' },
    'Unknown': { city: 'Unknown', county: 'Unknown', state: 'CA' }
};

function getLocationInfo(newspaperName) {
    return newspaperLocationMap[newspaperName] || { 
        city: 'Unknown', 
        county: 'Unknown', 
        state: 'CA' 
    };
}

function extractMonthYear(dateString) {
    if (!dateString) return { month: 'Unknown', year: 'Unknown' };
    const date = new Date(dateString);
    return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        monthName: date.toLocaleString('default', { month: 'long' })
    };
}

async function scrapeQuarter(quarter, chunkName) {
    console.log(`\\n📅 Scanning: ${chunkName} (${quarter.months})`);
    
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
            const locationInfo = getLocationInfo(article.newspaper);
            const dateInfo = extractMonthYear(article.date);
            
            articles.push({
                // Basic identification
                newspaper_title: article.newspaper || 'Unknown',
                article_title: article.title || 'No Title',
                publication_date: article.date,
                page_number: article.pageNumber || '',
                source_url: article.pageUrl || '',
                
                // Keyword metrics
                keyword: 'coolie',
                keyword_frequency: article.keywordMatches || 0,
                
                // Temporal analysis
                year: dateInfo.year,
                month: dateInfo.month,
                month_name: dateInfo.monthName,
                quarter: chunkName,
                
                // Spatial analysis
                city: locationInfo.city,
                county: locationInfo.county,
                state: locationInfo.state,
                
                // Additional context
                location: article.location || '',
                content_preview: (article.content || '').substring(0, 150)
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

        console.log(`   🔍 Starting comprehensive search for "coolie"...`);
        
        scraper.retrieve({
            keyword: "coolie",
            limit: 1000, // High limit per quarter
            dateRange: quarter.range,
            location: "us-ca"
        }).catch(reject);
    });
}

async function main() {
    console.log('🗓️  QUARTERLY COMPREHENSIVE DATA COLLECTION: "coolie" 1870-1871');
    console.log('================================================================\\n');
    
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
                path: `coolie_${quarter.name}_comprehensive.csv`,
                header: [
                    {id: 'newspaper_title', title: 'Newspaper_Title'},
                    {id: 'article_title', title: 'Article_Title'},
                    {id: 'publication_date', title: 'Publication_Date'},
                    {id: 'page_number', title: 'Page_Number'},
                    {id: 'source_url', title: 'Source_URL'},
                    {id: 'keyword', title: 'Keyword'},
                    {id: 'keyword_frequency', title: 'Keyword_Frequency'},
                    {id: 'year', title: 'Year'},
                    {id: 'month', title: 'Month'},
                    {id: 'month_name', title: 'Month_Name'},
                    {id: 'quarter', title: 'Quarter'},
                    {id: 'city', title: 'City'},
                    {id: 'county', title: 'County'},
                    {id: 'state', title: 'State'},
                    {id: 'location', title: 'Location'},
                    {id: 'content_preview', title: 'Content_Preview'}
                ]
            });
            
            await csvWriter.writeRecords(articles);
            console.log(`   💾 Saved: coolie_${quarter.name}_comprehensive.csv (${articles.length} articles)`);
        }
        
        // Progress summary
        console.log(`   ⏱️  Chunk time: ${(chunkTime / 60).toFixed(1)} minutes`);
        console.log(`   📊 Total so far: ${allArticles.length} articles`);
        
        // Delay between quarters
        if (index < quarterlyChunks.length - 1) {
            const delaySeconds = 30;
            console.log(`   ⏳ Waiting ${delaySeconds} seconds before next quarter...\\n`);
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }
    }
    
    // Final summary and combined dataset
    console.log('\\n🎉 ALL QUARTERS COMPLETED!');
    console.log('=========================\\n');
    
    console.log(`📅 Quarterly Breakdown:`);
    quarterlyChunks.forEach(quarter => {
        const quarterArticles = allArticles.filter(a => a.quarter === quarter.name);
        console.log(`   ${quarter.months}: ${quarterArticles.length} articles`);
    });
    
    console.log(`\\n📚 GRAND TOTAL: ${allArticles.length} articles`);
    console.log(`⏱️  Total time: ${(totalTime / 60).toFixed(1)} minutes`);
    
    // Save combined comprehensive dataset
    if (allArticles.length > 0) {
        const csvWriter = createCsvWriter({
            path: `coolie_1870_1871_comprehensive_${allArticles.length}_articles.csv`,
            header: [
                {id: 'newspaper_title', title: 'Newspaper_Title'},
                {id: 'article_title', title: 'Article_Title'},
                {id: 'publication_date', title: 'Publication_Date'},
                {id: 'page_number', title: 'Page_Number'},
                {id: 'source_url', title: 'Source_URL'},
                {id: 'keyword', title: 'Keyword'},
                {id: 'keyword_frequency', title: 'Keyword_Frequency'},
                {id: 'year', title: 'Year'},
                {id: 'month', title: 'Month'},
                {id: 'month_name', title: 'Month_Name'},
                {id: 'quarter', title: 'Quarter'},
                {id: 'city', title: 'City'},
                {id: 'county', title: 'County'},
                {id: 'state', title: 'State'},
                {id: 'location', title: 'Location'},
                {id: 'content_preview', title: 'Content_Preview'}
            ]
        });
        
        await csvWriter.writeRecords(allArticles);
        console.log(`\\n💾 COMBINED DATASET: coolie_1870_1871_comprehensive_${allArticles.length}_articles.csv`);
        
        // Generate summary statistics
        await generateSummaries(allArticles);
    } else {
        console.log('❌ No articles found in any quarter');
    }
}

async function generateSummaries(articles) {
    console.log(`\\n📊 GENERATING SUMMARY STATISTICS...`);
    
    // Newspaper summary
    const newspaperStats = {};
    articles.forEach(article => {
        const key = article.newspaper_title;
        newspaperStats[key] = newspaperStats[key] || {
            newspaper_title: key,
            city: article.city,
            county: article.county,
            state: article.state,
            total_pages: 0,
            total_matches: 0
        };
        newspaperStats[key].total_pages++;
        newspaperStats[key].total_matches += article.keyword_frequency;
    });
    
    const newspaperSummary = Object.values(newspaperStats).map(np => ({
        ...np,
        avg_matches_per_page: (np.total_matches / np.total_pages).toFixed(2)
    }));
    
    const newspaperWriter = createCsvWriter({
        path: `coolie_newspaper_summary_1870_1871.csv`,
        header: [
            {id: 'newspaper_title', title: 'Newspaper_Title'},
            {id: 'city', title: 'City'},
            {id: 'county', title: 'County'},
            {id: 'state', title: 'State'},
            {id: 'total_pages', title: 'Total_Pages_With_Keyword'},
            {id: 'total_matches', title: 'Total_Keyword_Matches'},
            {id: 'avg_matches_per_page', title: 'Avg_Matches_Per_Page'}
        ]
    });
    await newspaperWriter.writeRecords(newspaperSummary);
    console.log(`💾 Newspaper summary: coolie_newspaper_summary_1870_1871.csv`);
    
    // Monthly summary
    const monthlyStats = {};
    articles.forEach(article => {
        const key = `${article.year}-${article.month.toString().padStart(2, '0')}`;
        monthlyStats[key] = monthlyStats[key] || {
            year: article.year,
            month: article.month,
            month_name: article.month_name,
            total_pages: 0,
            total_matches: 0,
            newspapers: new Set()
        };
        monthlyStats[key].total_pages++;
        monthlyStats[key].total_matches += article.keyword_frequency;
        monthlyStats[key].newspapers.add(article.newspaper_title);
    });
    
    const monthlySummary = Object.values(monthlyStats).map(month => ({
        year: month.year,
        month: month.month,
        month_name: month.month_name,
        total_pages_with_keyword: month.total_pages,
        total_keyword_matches: month.total_matches,
        unique_newspapers: month.newspapers.size,
        avg_matches_per_page: (month.total_matches / month.total_pages).toFixed(2)
    })).sort((a, b) => a.year - b.year || a.month - b.month);
    
    const monthlyWriter = createCsvWriter({
        path: `coolie_monthly_summary_1870_1871.csv`,
        header: [
            {id: 'year', title: 'Year'},
            {id: 'month', title: 'Month'},
            {id: 'month_name', title: 'Month_Name'},
            {id: 'total_pages_with_keyword', title: 'Total_Pages_With_Keyword'},
            {id: 'total_keyword_matches', title: 'Total_Keyword_Matches'},
            {id: 'unique_newspapers', title: 'Unique_Newspapers'},
            {id: 'avg_matches_per_page', title: 'Avg_Matches_Per_Page'}
        ]
    });
    await monthlyWriter.writeRecords(monthlySummary);
    console.log(`💾 Monthly summary: coolie_monthly_summary_1870_1871.csv`);
    
    console.log(`\\n🎯 ANALYSIS READY!`);
    console.log(`• Quarterly comprehensive data files`);
    console.log(`• Combined master dataset`);
    console.log(`• Newspaper summaries for county analysis`);
    console.log(`• Monthly trends for temporal analysis`);
    console.log(`• Keyword frequency data for spatial analysis`);
}

main().catch(console.error);
