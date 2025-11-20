const NewspaperScraper = require('./lib/NewspaperScraper');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

// Quarterly chunks for 1870-1874 (5 years = 20 quarters)
const quarterlyChunks = [
    // 1870
    { name: '1870_Jan_Mar', range: [1870, 1870], months: 'January-March 1870' },
    { name: '1870_Apr_Jun', range: [1870, 1870], months: 'April-June 1870' },
    { name: '1870_Jul_Sep', range: [1870, 1870], months: 'July-September 1870' },
    { name: '1870_Oct_Dec', range: [1870, 1870], months: 'October-December 1870' },
    
    // 1871
    { name: '1871_Jan_Mar', range: [1871, 1871], months: 'January-March 1871' },
    { name: '1871_Apr_Jun', range: [1871, 1871], months: 'April-June 1871' },
    { name: '1871_Jul_Sep', range: [1871, 1871], months: 'July-September 1871' },
    { name: '1871_Oct_Dec', range: [1871, 1871], months: 'October-December 1871' },
    
    // 1872
    { name: '1872_Jan_Mar', range: [1872, 1872], months: 'January-March 1872' },
    { name: '1872_Apr_Jun', range: [1872, 1872], months: 'April-June 1872' },
    { name: '1872_Jul_Sep', range: [1872, 1872], months: 'July-September 1872' },
    { name: '1872_Oct_Dec', range: [1872, 1872], months: 'October-December 1872' },
    
    // 1873
    { name: '1873_Jan_Mar', range: [1873, 1873], months: 'January-March 1873' },
    { name: '1873_Apr_Jun', range: [1873, 1873], months: 'April-June 1873' },
    { name: '1873_Jul_Sep', range: [1873, 1873], months: 'July-September 1873' },
    { name: '1873_Oct_Dec', range: [1873, 1873], months: 'October-December 1873' },
    
    // 1874
    { name: '1874_Jan_Mar', range: [1874, 1874], months: 'January-March 1874' },
    { name: '1874_Apr_Jun', range: [1874, 1874], months: 'April-June 1874' },
    { name: '1874_Jul_Sep', range: [1874, 1874], months: 'July-September 1874' },
    { name: '1874_Oct_Dec', range: [1874, 1874], months: 'October-December 1874' }
];

// Basic newspaper location mapping (expand this as you discover more newspapers)
const newspaperLocationMap = {
    'San Francisco Chronicle': { city: 'San Francisco', county: 'San Francisco', state: 'CA' },
    'The San Francisco Examiner': { city: 'San Francisco', county: 'San Francisco', state: 'CA' },
    'The San Francisco Call Bulletin': { city: 'San Francisco', county: 'San Francisco', state: 'CA' },
    'Los Angeles Star': { city: 'Los Angeles', county: 'Los Angeles', state: 'CA' },
    'The Sacramento Bee': { city: 'Sacramento', county: 'Sacramento', state: 'CA' },
    'Appeal-Democrat': { city: 'Marysville', county: 'Yuba', state: 'CA' },
    'Daily Evening Herald': { city: 'Stockton', county: 'San Joaquin', state: 'CA' },
    'The Bismarck Tribune': { city: 'Bismarck', county: 'Burleigh', state: 'ND' },
    'The Orlando Sentinel': { city: 'Orlando', county: 'Orange', state: 'FL' },
    'Okmulgee Daily Times': { city: 'Okmulgee', county: 'Okmulgee', state: 'OK' },
    'Press Enterprise': { city: 'Riverside', county: 'Riverside', state: 'CA' },
    'The Index-Journal': { city: 'Greenwood', county: 'Greenwood', state: 'SC' },
    'Unknown': { city: 'Unknown', county: 'Unknown', state: 'Unknown' }
};

function getLocationInfo(newspaperName) {
    return newspaperLocationMap[newspaperName] || { 
        city: 'Unknown', 
        county: 'Unknown', 
        state: 'Unknown' 
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
                year_quarter: `${dateInfo.year}-Q${Math.ceil(dateInfo.month/3)}`,
                
                // Spatial analysis
                city: locationInfo.city,
                county: locationInfo.county,
                state: locationInfo.state,
                
                // Additional context
                location: article.location || '',
                content_preview: (article.content || '').substring(0, 200)
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

        console.log(`   🔍 Starting search for "coolie"...`);
        
        scraper.retrieve({
            keyword: "coolie",
            limit: 1000, // High limit per quarter
            dateRange: quarter.range,
            location: "us-ca"
        }).catch(reject);
    });
}

async function main() {
    console.log('🗓️  MAJOR HISTORICAL ANALYSIS: "coolie" in California 1870-1874');
    console.log('================================================================\\n');
    console.log('📅 Time Period: 5 years (20 quarters)');
    console.log('🎯 Target: Comprehensive coverage of Chinese labor discourse');
    console.log('📍 Location: California newspapers\\n');
    
    let allArticles = [];
    let totalTime = 0;
    const startTime = Date.now();
    
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
                    {id: 'year_quarter', title: 'Year_Quarter'},
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
        const elapsedTotal = (Date.now() - startTime) / 60000; // minutes
        const progress = ((index + 1) / quarterlyChunks.length * 100).toFixed(1);
        console.log(`   ⏱️  Chunk time: ${(chunkTime / 60).toFixed(1)} minutes`);
        console.log(`   📊 Total so far: ${allArticles.length} articles`);
        console.log(`   📈 Overall progress: ${progress}% (${index + 1}/${quarterlyChunks.length} quarters)`);
        console.log(`   🕒 Elapsed: ${elapsedTotal.toFixed(1)} minutes`);
        
        // Estimate time remaining
        if (index > 0) {
            const avgTimePerChunk = totalTime / (index + 1);
            const remainingChunks = quarterlyChunks.length - (index + 1);
            const estimatedRemaining = (avgTimePerChunk * remainingChunks) / 60;
            console.log(`   ⏳ Estimated remaining: ${estimatedRemaining.toFixed(1)} minutes`);
        }
        
        // Delay between quarters (be respectful to the website)
        if (index < quarterlyChunks.length - 1) {
            const delaySeconds = 45; // Increased delay for longer run
            console.log(`   💤 Waiting ${delaySeconds} seconds before next quarter...\\n`);
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }
    }
    
    // Final summary and combined dataset
    const totalTimeMinutes = (Date.now() - startTime) / 60000;
    console.log('\\n🎉 ALL 20 QUARTERS COMPLETED! (1870-1874)');
    console.log('===========================================\\n');
    
    // Yearly breakdown
    console.log(`📅 YEARLY BREAKDOWN:`);
    const years = [1870, 1871, 1872, 1873, 1874];
    years.forEach(year => {
        const yearArticles = allArticles.filter(a => a.year === year);
        console.log(`   ${year}: ${yearArticles.length} articles`);
    });
    
    console.log(`\\n📚 GRAND TOTAL: ${allArticles.length} articles over 5 years`);
    console.log(`⏱️  Total time: ${totalTimeMinutes.toFixed(1)} minutes`);
    console.log(`📦 Individual quarterly files saved`);
    
    // Save combined comprehensive dataset
    if (allArticles.length > 0) {
        const csvWriter = createCsvWriter({
            path: `coolie_1870_1874_comprehensive_${allArticles.length}_articles.csv`,
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
                {id: 'year_quarter', title: 'Year_Quarter'},
                {id: 'city', title: 'City'},
                {id: 'county', title: 'County'},
                {id: 'state', title: 'State'},
                {id: 'location', title: 'Location'},
                {id: 'content_preview', title: 'Content_Preview'}
            ]
        });
        
        await csvWriter.writeRecords(allArticles);
        console.log(`\\n💾 MASTER DATASET: coolie_1870_1874_comprehensive_${allArticles.length}_articles.csv`);
        
        // Generate summary statistics
        await generateSummaries(allArticles);
    } else {
        console.log('❌ No articles found in any quarter');
    }
}

async function generateSummaries(articles) {
    console.log(`\\n📊 GENERATING SUMMARY STATISTICS FOR 1870-1874...`);
    
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
    })).sort((a, b) => b.total_pages - a.total_pages); // Sort by most coverage
    
    const newspaperWriter = createCsvWriter({
        path: `coolie_newspaper_summary_1870_1874.csv`,
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
    console.log(`💾 Newspaper summary: coolie_newspaper_summary_1870_1874.csv`);
    
    // Yearly summary
    const yearlyStats = {};
    articles.forEach(article => {
        const year = article.year;
        yearlyStats[year] = yearlyStats[year] || {
            year: year,
            total_pages: 0,
            total_matches: 0,
            newspapers: new Set()
        };
        yearlyStats[year].total_pages++;
        yearlyStats[year].total_matches += article.keyword_frequency;
        yearlyStats[year].newspapers.add(article.newspaper_title);
    });
    
    const yearlySummary = Object.values(yearlyStats).map(year => ({
        year: year.year,
        total_pages_with_keyword: year.total_pages,
        total_keyword_matches: year.total_matches,
        unique_newspapers: year.newspapers.size,
        avg_matches_per_page: (year.total_matches / year.total_pages).toFixed(2)
    })).sort((a, b) => a.year - b.year);
    
    const yearlyWriter = createCsvWriter({
        path: `coolie_yearly_summary_1870_1874.csv`,
        header: [
            {id: 'year', title: 'Year'},
            {id: 'total_pages_with_keyword', title: 'Total_Pages_With_Keyword'},
            {id: 'total_keyword_matches', title: 'Total_Keyword_Matches'},
            {id: 'unique_newspapers', title: 'Unique_Newspapers'},
            {id: 'avg_matches_per_page', title: 'Avg_Matches_Per_Page'}
        ]
    });
    await yearlyWriter.writeRecords(yearlySummary);
    console.log(`💾 Yearly summary: coolie_yearly_summary_1870_1874.csv`);
    
    console.log(`\\n🎯 MAJOR ANALYSIS COMPLETE!`);
    console.log(`• 5 years of historical data (1870-1874)`);
    console.log(`• 20 quarterly datasets + master dataset`);
    console.log(`• Newspaper coverage analysis by county/state`);
    console.log(`• Yearly trends in "coolie" discourse`);
    console.log(`• Ready for spatial and temporal analysis`);
}

main().catch(console.error);
