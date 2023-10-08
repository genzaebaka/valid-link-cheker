const express = require('express');
const fetch = require('node-fetch');
const ejs = require('ejs');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

async function checkRedirect(basePageUrl, url) {
  let fullUrl;

  try {
    const baseUrl = new URL(basePageUrl);
    fullUrl = new URL(url, baseUrl).href;

    const response = await fetch(fullUrl, { method: 'HEAD' });

    if (response.ok && response.redirected) {
      return { url: fullUrl, redirectedTo: response.url };
    } else {
      return { url: fullUrl, redirectedTo: null };
    }
  } catch (error) {
    return { url: fullUrl, error: error.message };
  }
}


// Функция для извлечения ссылок из HTML
function extractUrlsFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = [];
  $('a').each((index, element) => {
    const href = $(element).attr('href');
    if (href) {
      const fullUrl = new URL(href, baseUrl).href;
      links.push(fullUrl);
    }
  });
  return links;
}

app.set('view engine', 'ejs');

app.get('/check', async (req, res) => {
  const pageUrl = req.query.url;

  if (!pageUrl) {
    return res.status(400).json({ error: 'Please provide a valid page URL.' });
  }

  try {
    const pageResponse = await fetch(pageUrl);
    const pageHtml = await pageResponse.text();
    const links = extractUrlsFromHtml(pageHtml, new URL(pageUrl));

    if (!links.length) {
      return res.status(400).json({ error: 'No valid links found on the provided page.' });
    }

    const results = await Promise.all(links.map(link => checkRedirect(pageUrl, link)));

    res.render('table', { results });
  } catch (error) {
    return res.status(500).json({ error: `Error fetching or processing the page: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
