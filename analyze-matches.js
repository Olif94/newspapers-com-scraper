const NewspaperScraper = require('./lib/NewspaperScraper');
const fs = require('fs');

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome";

async function analyzeMatches() {
    const matchDistribution = {};
    let totalArticles = 0;
    let totalMatches = 0;
    
    console.log('🔍 Analyzing keyword match distribution...\\n');
    
    const scraper = new NewspaperScraper({
        browser: { headless: 'new', args: ['--no-sandbox'] }
    });

    scraper.on('article', (article) => {
        const matches = article.keywordMatches || 0;
        matchDistribution[matches] = (matchDistribution[matches] || 0) + 1;
        totalArticles++;
        totalMatches += matches;
        
        if (totalArticles % 100 === 0) {
            console.log(`Processed ${totalArticles} articles...`);
        }
    });

    scraper.on('complete', () => {
        console.log('\\n📊 MATCH DISTRIBUTION ANALYSIS');
        console.log('===============================\\n');
        
        console.log(`Total pages found: ${totalArticles}`);
        console.log(`Total keyword occurrences: ${totalMatches}`);
        console.log(`Average matches per page: ${(totalMatches / totalArticles).toFixed(2)}\\n`);
        
        console.log('Matches per page | Page Count');
        console.log('-----------------|-----------');
        
        const sortedMatches = Object.keys(matchDistribution).map(Number).sort((a, b) => a - b);
        let cumulative = 0;
        
        sortedMatches.forEach(matchCount => {
            const pages = matchDistribution[matchCount];
            cumulative += pages;
            const percentage = (pages / totalArticles * 100).toFixed(1);
            console.log(`${matchCount.toString().padStart(15)} | ${pages.toString().padStart(10)} (${percentage}%)`);
        });
        
        // Show what percentage have low matches
        const lowMatchThreshold = 3;
        const lowMatchPages = sortedMatches.filter(m => m <= lowMatchThreshold)
                                          .reduce((sum, m) => sum + matchDistribution[m], 0);
        
        console.log(`\\n📈 Insights:`);
        console.log(`- ${lowMatchPages} pages (${((lowMatchPages / totalArticles) * 100).toFixed(1)}%) have ${lowMatchThreshold} or fewer matches`);
        console.log(`- This suggests many pages only mention "coolie" briefly`);
        console.log(`- Manual search might filter out these low-match pages`);
    });

    // Test with a smaller sample first
    await scraper.retrieve({
        keyword: "coolie",
        limit: 200,
        dateRange: [1870, 1870],
        location: "us-ca"
    });
}

analyzeMatches().catch(console.error);
