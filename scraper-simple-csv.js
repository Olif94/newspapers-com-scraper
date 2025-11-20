const NewspaperScraper = require('./lib/NewspaperScraper');
const fs = require('fs').promises;

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

// Simple CSV converter
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\\n');
}

async function main() {
    const articles = [];
    
    try {
        console.log('📊 Creating dataset: "coolie" 1870 California\\n');
        
        const scraper = new NewspaperScraper({
            browser: {
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            }
        });

        scraper.on('article', (article) => {
            articles.push({
                date: article.date,
                newspaper: article.newspaper || 'Unknown',
                title: article.title || 'No Title',
                page: article.pageNumber || '',
                location: article.location || '',
                matches: article.keywordMatches || 0,
                url: article.pageUrl || ''
            });
            console.log(`✅ ${article.date} - ${article.newspaper || 'Unknown'}`);
        });

        scraper.on('complete', async () => {
            console.log(`\\n💾 Saving ${articles.length} records to CSV...`);
            
            const csv = convertToCSV(articles);
            const filename = `coolie_1870_dataset.csv`;
            await fs.writeFile(filename, csv);
            
            console.log(`✅ Dataset saved: ${filename}`);
            console.log(`📈 ${articles.length} articles ready for Excel/Google Sheets`);
            console.log('\\n📋 Columns: date, newspaper, title, page, location, matches, url');
        });

        await scraper.retrieve({
            keyword: "coolie",
            limit: 100,
            dateRange: [1870, 1870],
            location: "us-ca"
        });

    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

main();
