#!/usr/bin/env node

/**
 * PDF User Guide Generator for Meraki Care
 * Converts markdown to HTML and generates PDF
 */

const fs = require("fs");
const path = require("path");
const marked = require("marked");
const html2pdf = require("html2pdf.js");

// Check if required packages are installed
const checkDependencies = () => {
  const required = ["marked"];
  for (const pkg of required) {
    try {
      require.resolve(pkg);
    } catch (e) {
      console.error(`❌ Required package missing: ${pkg}`);
      console.log(`Install with: npm install ${required.join(" ")}`);
      process.exit(1);
    }
  }
};

const generatePDF = async () => {
  try {
    checkDependencies();
    
    const mdPath = path.join(__dirname, "../docs/USER_GUIDE.md");
    const outputPath = path.join(__dirname, "../docs/MERAKI_CARE_USER_GUIDE.pdf");

    console.log("📖 Generating Meraki Care User Guide PDF...\n");

    // Read markdown file
    if (!fs.existsSync(mdPath)) {
      console.error(`❌ Markdown file not found: ${mdPath}`);
      process.exit(1);
    }

    const markdown = fs.readFileSync(mdPath, "utf-8");

    // Convert markdown to HTML
    const htmlContent = marked.parse(markdown);

    // Create complete HTML document with styling
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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px;
        }
        
        h1 {
          color: #1a365d;
          font-size: 2.5em;
          margin-bottom: 10px;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
        }
        
        h2 {
          color: #2d5a8c;
          font-size: 2em;
          margin-top: 30px;
          margin-bottom: 15px;
          page-break-after: avoid;
        }
        
        h3 {
          color: #3b82f6;
          font-size: 1.4em;
          margin-top: 20px;
          margin-bottom: 10px;
          page-break-after: avoid;
        }
        
        h4 {
          color: #555;
          font-size: 1.1em;
          margin-top: 15px;
          margin-bottom: 8px;
        }
        
        p {
          margin-bottom: 12px;
          text-align: justify;
        }
        
        ul, ol {
          margin-left: 20px;
          margin-bottom: 15px;
        }
        
        li {
          margin-bottom: 8px;
          page-break-inside: avoid;
        }
        
        strong {
          color: #1a365d;
          font-weight: 600;
        }
        
        em {
          color: #555;
          font-style: italic;
        }
        
        code {
          background: #f0f4f8;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
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
          margin-bottom: 15px;
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
          page-break-inside: avoid;
        }
        
        .page-break {
          page-break-after: always;
        }
        
        /* Highlight sections */
        .highlight {
          background: #fff3cd;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #ffc107;
          margin: 15px 0;
          page-break-inside: avoid;
        }
        
        /* Ensure lists don't break awkwardly */
        ul, ol {
          page-break-inside: avoid;
        }
        
        @page {
          margin: 20mm;
        }
        
        @media print {
          body {
            background: white;
          }
          h2 {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${htmlContent}
      </div>
    </body>
    </html>
    `;

    // Save HTML to file for reference
    const htmlPath = path.join(__dirname, "../docs/USER_GUIDE.html");
    fs.writeFileSync(htmlPath, completeHtml);
    console.log(`✅ HTML version created: ${htmlPath}\n`);

    console.log("📋 PDF generation instructions:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✨ To create the PDF, use one of these methods:\n");
    
    console.log("METHOD 1: Using Browser (Easiest)");
    console.log("─────────────────────────────────");
    console.log("1. Open the HTML file in your browser:");
    console.log(`   ${htmlPath}`);
    console.log("2. Press Ctrl+P (Windows) or Cmd+P (Mac)");
    console.log("3. Select 'Save as PDF'");
    console.log(`4. Save as: ${outputPath}\n`);

    console.log("METHOD 2: Using Puppeteer (Node.js)");
    console.log("───────────────────────────────────");
    console.log("1. Install Puppeteer: npm install puppeteer");
    console.log("2. Use generate-pdf-puppeteer.js script\n");

    console.log("METHOD 3: Using html2pdf Library");
    console.log("───────────────────────────────");
    console.log("1. Install: npm install html2pdf.js");
    console.log("2. Use the browser-based conversion\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✅ Files created successfully!");
    console.log(`📄 Markdown guide: docs/USER_GUIDE.md`);
    console.log(`🌐 HTML version: docs/USER_GUIDE.html`);
    console.log(`\n📖 To view the guide, open the HTML file in your browser.\n`);

  } catch (error) {
    console.error("❌ Error generating guide:", error.message);
    process.exit(1);
  }
};

generatePDF();
