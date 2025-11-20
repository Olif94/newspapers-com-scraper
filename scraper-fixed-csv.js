const NewspaperScraper = require('./lib/NewspaperScraper');
const fs = require('fs').promises;

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

async function main() {
    const articles = [];
    
    try {
        console.log('📊 Creating proper CSV dataset...\\n');
        
        const scraper = new NewspaperScraper({
            browser: {
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            }
        });

        scraper.on('article', (article) => {
            console.log(`✅ Found: ${article.date} - ${article.title || 'No Title'}`);
            
            // Create a clean data row
            articles.push({
                Date: article.date || '',
                Newspaper: article.newspaper || 'Unknown',
                Title: (article.title || 'No Title').replace(/,/g, ';'), // Remove commas that break CSV
                Page: article.pageNumber || '',
                Location: article.location || '',
                Matches: article.keywordMatches || 0,
                URL: article.pageUrl || '',
                Newspaper_Title: article.newspaperTitle || ''
            });
        });

        scraper.on('complete', async () => {
            console.log(`\\n💾 Saving ${articles.length} articles to CSV...`);
            
            if (articles.length === 0) {
                console.log('❌ No articles found to save');
                return;
            }
            
            // Create CSV content
            const headers = Object.keys(articles[0]);
            let csvContent = headers.join(',') + '\\n'; // Header row
            
            // Add data rows
            articles.forEach(article => {
                const row = headers.map(header => {
                    let value = article[header] || '';
                    // Escape quotes and wrap in quotes if contains comma
                    if (typeof value === 'string' && value.includes(',')) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                });
                csvContent += row.join(',') + '\\n';
            });
            
            // Save CSV file
            const filename = `coolie_dataset_${Date.now()}.csv`;
            await fs.writeFile(filename, csvContent);
            
            console.log(`✅ Proper CSV saved: ${filename}`);
            console.log(`📊 ${articles.length} rows, ${headers.length} columns`);
            console.log('\\n📋 Preview of first 3 rows:');
            console.log('--- HEADERS ---');
            console.log(headers.join(' | '));
            console.log('--- DATA ---');
            articles.slice(0, 3).forEach((article, i) => {
                console.log(`Row ${i+1}: ${Object.values(article).join(' | ')}`);
            });
        });

        await scraper.retrieve({
            keyword: "coolie",
            limit: 50,
            dateRange: [1870, 1870],
            location: "us-ca"
        });

    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

main();
