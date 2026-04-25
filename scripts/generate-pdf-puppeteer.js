#!/usr/bin/env node

/**
 * PDF User Guide Generator using Puppeteer
 * More reliable method for converting HTML to PDF
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const marked = require("marked");

const generatePDF = async () => {
  let browser;
  try {
    console.log("🚀 Starting Meraki Care User Guide PDF Generation...\n");

    // Check dependencies
    try {
      require.resolve("puppeteer");
    } catch (e) {
      console.error("❌ Puppeteer not installed!");
      console.log("\nTo generate PDF, install dependencies:");
      console.log("  npm install puppeteer marked\n");
      process.exit(1);
    }

    // Read markdown file
    const mdPath = path.join(__dirname, "../docs/USER_GUIDE.md");
    if (!fs.existsSync(mdPath)) {
      console.error(`❌ Markdown file not found: ${mdPath}`);
      process.exit(1);
    }

    console.log("📖 Reading markdown file...");
    const markdown = fs.readFileSync(mdPath, "utf-8");

    // Convert to HTML
    console.log("🔄 Converting markdown to HTML...");
    const htmlContent = marked.parse(markdown);

    // Create complete HTML
    const completeHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Meraki Care - User Guide</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
          padding: 40px;
        }
        
        h1 {
          color: #1a365d;
          font-size: 2.5em;
          margin-bottom: 10px;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
          page-break-after: avoid;
        }
        
        h2 {
          color: #2d5a8c;
          font-size: 2em;
          margin-top: 40px;
          margin-bottom: 20px;
          page-break-after: avoid;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 10px;
        }
        
        h3 {
          color: #3b82f6;
          font-size: 1.4em;
          margin-top: 25px;
          margin-bottom: 12px;
          page-break-after: avoid;
        }
        
        h4 {
          color: #555;
          font-size: 1.1em;
          margin-top: 15px;
          margin-bottom: 8px;
          page-break-after: avoid;
        }
        
        p {
          margin-bottom: 12px;
          text-align: justify;
        }
        
        ul, ol {
          margin-left: 30px;
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        
        li {
          margin-bottom: 8px;
          line-height: 1.8;
        }
        
        strong {
          color: #1a365d;
          font-weight: 600;
        }
        
        em {
          color: #666;
          font-style: italic;
        }
        
        code {
          background: #f0f4f8;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #e74c3c;
        }
        
        hr {
          border: none;
          border-top: 2px solid #3b82f6;
          margin: 30px 0;
          page-break-after: avoid;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          page-break-inside: avoid;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        
        th {
          background: #3b82f6;
          color: white;
          font-weight: 600;
        }
        
        tr:nth-child(even) {
          background: #f9fafb;
        }
        
        blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 15px;
          margin: 15px 0;
          color: #666;
          font-style: italic;
          background: #f0f7ff;
          padding: 10px 15px;
          page-break-inside: avoid;
        }
        
        @page {
          margin: 2cm;
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 12px;
            color: #999;
          }
        }
        
        @media print {
          h2 {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
    `;

    // Save HTML file
    const htmlPath = path.join(__dirname, "../docs/USER_GUIDE.html");
    fs.writeFileSync(htmlPath, completeHtml);
    console.log(`✅ HTML file created: docs/USER_GUIDE.html`);

    // Launch browser and generate PDF
    console.log("🌐 Launching browser...");
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    
    console.log("📄 Generating PDF...");
    await page.setContent(completeHtml, {
      waitUntil: "networkidle2",
    });

    const outputPath = path.join(__dirname, "../docs/MERAKI_CARE_USER_GUIDE.pdf");
    await page.pdf({
      path: outputPath,
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      printBackground: true,
      scale: 1,
    });

    await browser.close();

    console.log(`\n✅ PDF generated successfully!`);
    console.log(`📋 Location: ${outputPath}\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 User Guide Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✓ Complete hospital billing system guide");
    console.log("✓ Separate sections for Admins and Staff");
    console.log("✓ Step-by-step instructions with screenshots");
    console.log("✓ Mobile optimization tips");
    console.log("✓ Common tasks and troubleshooting");
    console.log("✓ FAQ and best practices");
    console.log("✓ Professional PDF formatting");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("\n❌ Error generating PDF:", error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
};

generatePDF();
