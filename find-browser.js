const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Searching for available browsers...\n');

// List of possible browser paths
const browserPaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable', 
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/opt/google/chrome/chrome'
];

console.log('Checking browser paths:');
let foundBrowsers = [];
for (const path of browserPaths) {
    if (fs.existsSync(path)) {
        foundBrowsers.push(path);
        console.log(`✅ FOUND: ${path}`);
        
        // Try to get version
        try {
            const version = execSync(`${path} --version`, { encoding: 'utf8', timeout: 5000 });
            console.log(`   Version: ${version.trim()}`);
        } catch (e) {
            console.log('   Version: Could not determine');
        }
    } else {
        console.log(`❌ NOT FOUND: ${path}`);
    }
}

console.log('\n📋 Available browser commands:');
const commands = ['google-chrome', 'chromium-browser', 'chromium', 'chrome'];
for (const cmd of commands) {
    try {
        const path = execSync(`which ${cmd}`, { encoding: 'utf8' }).trim();
        console.log(`✅ ${cmd} -> ${path}`);
    } catch (e) {
        console.log(`❌ ${cmd} -> Not found`);
    }
}

console.log('\n💡 RECOMMENDATION:');
if (foundBrowsers.length > 0) {
    console.log(`Use: export PUPPETEER_EXECUTABLE_PATH="${foundBrowsers[0]}"`);
    console.log(`Then run: node test-puppeteer-builtin.js`);
} else {
    console.log('No browsers found. Installing Chrome...');
    console.log('Run: wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb');
    console.log('Then: sudo dpkg -i google-chrome-stable_current_amd64.deb && sudo apt-get install -f');
}
