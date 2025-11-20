const NewspaperScraper = require('./lib/NewspaperScraper');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

async function main() {
    const articles = [];
    
    try {
        console.log('🚀 Running scraper with professional CSV output...\\n');
        
        const scraper = new NewspaperScraper({
            browser: {
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            }
        });

        scraper.on('article', (article) => {
            // Clean and normalize the data
            const cleanData = {
                Date: article.date || '',
                Newspaper: (article.newspaper || article.title || 'Unknown').replace(/_\\d+$/, ''),
                Title: (article.title || 'No Title').replace(/_\\d+$/, ''),
                Page: (article.pageNumber || '').replace(/_\\d+$/, ''),
                Location: (article.location || '').replace(/_\\d+$/, ''),
                Keyword_Matches: parseInt(article.keywordMatches) || 0,
                URL: article.pageUrl || '',
                Newspaper_Title: article.newspaperTitle || '',
                Content_Snippet: (article.content || '').substring(0, 150)
            };
            
            articles.push(cleanData);
            console.log(`✅ ${cleanData.Date} - ${cleanData.Newspaper}`);
        });

        scraper.on('complete', async () => {
            console.log(`\\n📊 Preparing CSV with ${articles.length} records...`);
            
            const csvWriter = createCsvWriter({
                path: 'coolie_research_dataset.csv',
                header: [
                    {id: 'Date', title: 'Publication_Date'},
                    {id: 'Newspaper', title: 'Newspaper_Name'},
                    {id: 'Title', title: 'Article_Title'},
                    {id: 'Page', title: 'Page_Number'},
                    {id: 'Location', title: 'Location'},
                    {id: 'Keyword_Matches', title: 'Keyword_Matches'},
                    {id: 'URL', title: 'Source_URL'},
                    {id: 'Newspaper_Title', title: 'Newspaper_Edition'},
                    {id: 'Content_Snippet', title: 'Content_Preview'}
                ]
            });

            await csvWriter.writeRecords(articles);
            console.log('🎉 Professional CSV file created: coolie_research_dataset.csv');
            console.log('📁 Ready for Excel, Google Sheets, or any spreadsheet software');
        });

        await scraper.retrieve({
            keyword: "coolie",
            limit: 100,
            dateRange: [1870, 1870],
            location: "us-ca"
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
