const NewspaperScraper = require('./lib/NewspaperScraper');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

async function main() {
    const articles = [];
    
    console.log('📰 COLLECTING DATA FOR SENTIMENT ANALYSIS');
    console.log('=========================================\\n');
    
    const scraper = new NewspaperScraper({
        concurrentPages: 2,
        resultsPerPage: 50,
        browser: { 
            headless: 'new', 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
        },
        logger: { level: 'info' }
    });

    scraper.on('article', (article) => {
        // We need the actual article content for sentiment analysis
        articles.push({
            date: article.date,
            newspaper: article.newspaper || 'Unknown',
            title: article.title || 'No Title',
            page: article.pageNumber || '',
            location: article.location || '',
            keyword_matches: article.keywordMatches || 0,
            url: article.pageUrl || '',
            // This is crucial for sentiment analysis - the actual text content
            content: article.content || '',
            content_preview: (article.content || '').substring(0, 500) // For CSV preview
        });
        
        if (articles.length % 25 === 0) {
            console.log(`📥 Collected ${articles.length} articles with content...`);
        }
    });

    scraper.on('progress', ({current, total, percentage}) => {
        if (current % 10 === 0) {
            console.log(`📄 Processed ${current} pages (${percentage.toFixed(1)}%)`);
        }
    });

    scraper.on('complete', async () => {
        console.log(`\\n🎉 DATA COLLECTION COMPLETE!`);
        console.log(`📚 Total articles with content: ${articles.length}`);
        
        // Save the data for sentiment analysis
        const csvWriter = createCsvWriter({
            path: 'coolie_comprehensive_articles.csv',
            header: [
                {id: 'date', title: 'Date'},
                {id: 'newspaper', title: 'Newspaper'},
                {id: 'title', title: 'Title'},
                {id: 'page', title: 'Page'},
                {id: 'location', title: 'Location'},
                {id: 'keyword_matches', title: 'Keyword_Matches'},
                {id: 'url', title: 'URL'},
                {id: 'content', title: 'Content'},
                {id: 'content_preview', title: 'Content_Preview'}
            ]
        });
        
        await csvWriter.writeRecords(articles);
        console.log(`💾 Saved: coolie_comprehensive_articles.csv`);
        console.log(`📁 Ready for sentiment analysis with ${articles.length} articles`);
        console.log(`\\n�� Next step: Run 'python sbert_analyzer.py' to analyze sentiment`);
    });

    console.log('Starting data collection for sentiment analysis...\\n');
    
    // Start with a manageable sample for testing
    await scraper.retrieve({
        keyword: "coolie",
        limit: 200, // Start with 200 articles for testing
        dateRange: [1870, 1870],
        location: "us-ca"
    });
}

main().catch(console.error);
