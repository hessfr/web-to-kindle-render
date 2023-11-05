const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const execFile = require('child_process').execFile;
const fs = require('fs');

const PORT = process.env.PORT || 3000;

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', async (req, res) => {

    console.log("Starting Browser");	  
    const browser = await puppeteer.launch({
	    headless: 'new',
	    executablePath: '/usr/bin/chromium-browser',
	    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1200'] });
    const page = await browser.newPage();
    //await page.setViewport({ width: 824, height: 1200 });
    await page.setViewport({ width: 1600, height: 1200 });
 
    console.log("Browser started");

    await page.goto(process.env.SCREENSHOT_URL || 'https://www.meteoschweiz.admin.ch/lokalprognose/zuerich/8001.html#forecast-tab=detail-view', {
      timeout: 120000, // 2 minutes
    });

    await page.waitForTimeout(5000);

    // const element = await page.waitForSelector('mch-local-forecast-page');
    const element = await page.waitForSelector('mch-local-forecast-page >>> .local-forecast-detail-view__container');

    await element.screenshot({
      path: '/tmp/screenshot.png',
    });

    await browser.close();

    await convert('/tmp/screenshot.png');

    screenshot = fs.readFileSync('/tmp/screenshot.png');

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': screenshot.length,
    });
    return res.end(screenshot);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


function convert(filename) {
  return new Promise((resolve, reject) => {
    const args = [filename, '-gravity', 'center', '-extent', '1600x800', '-colorspace', 'gray', '-depth', '8', filename];
    execFile('convert', args, (error, stdout, stderr) => {
      if (error) {
        console.error({ error, stdout, stderr });
        reject();
      } else {
        resolve();
      }
    });
  });
}
