const express = require('express');
const fetch = require('node-fetch');
const ejs = require('ejs');

const app = express();
const port = 3000;

async function checkRedirect(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });

    if (response.ok && response.redirected) {
      return { url, redirectedTo: response.url };
    } 
    else {
      return { url, redirectedTo: null };
    }
  } catch (error) {
    return { url, error: error.message };
  }
}

app.set('view engine', 'ejs');

app.get('/check', async (req, res) => {
  const links = req.query.links;

  if (!links || !Array.isArray(links)) {
    return res.status(400).json({ error: 'Invalid input. Please provide an array of links.' });
  }

  const results = await Promise.all(links.map(link => checkRedirect(link)));

  res.render('table', { results });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
