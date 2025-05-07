const { chromium } = require('playwright');
const { google } = require('googleapis');

async function scrapeAndSave() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://oficinabrasil.com.br/forum');

  const topics = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a.topictitle')).map(el => ({
      titulo: el.textContent.trim(),
      link: el.href
    }));
  });

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = 'ID_DA_PLANILHA';
  const hoje = new Date().toLocaleString('pt-BR');

  const rows = topics.map(topic => [hoje, topic.titulo, topic.link]);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Página1!A:C',
    valueInputOption: 'RAW',
    resource: {
      values: rows,
    },
  });

  await browser.close();
}

scrapeAndSave();