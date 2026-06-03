#!/usr/bin/env node
/**
 * Queso Ventures — Mock Generator
 * Usage: node generate.js <clientSlug>
 * Example: node generate.js foodTrucks/tacoLoco
 *
 * Drop brief.json + assets in the client folder first, then run.
 * Every published index.html in the repo is automatically used as a quality reference.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env if present
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Maps businessType → TOC category label ─────────────────────────────────
const CATEGORY_MAP = {
  coffee:     'Food Trucks',
  food_truck: 'Food Trucks',
  bar:        'Bars',
  barber:     'Barber Shops',
  med_spa:    'Med Spas',
  smoke_shop: 'Smoke Shops',
  dentist:    'Dentist',
  donuts:     'Donuts',
};

// All category directories in the repo
const REPO_CATEGORIES = ['foodTrucks', 'bars', 'barberShops', 'dentist', 'donuts', 'medSpas', 'smokeShops'];

// ── Asset helpers ───────────────────────────────────────────────────────────
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

function isImage(f) {
  return IMAGE_EXTS.includes(path.extname(f).toLowerCase());
}

function mimeFor(f) {
  const ext = path.extname(f).toLowerCase();
  if (ext === '.png')  return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function imageBlock(label, filepath) {
  return [
    { type: 'text', text: `[${label}]` },
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mimeFor(filepath),
        data: fs.readFileSync(filepath).toString('base64'),
      },
    },
  ];
}

// ── Published mock scanner ──────────────────────────────────────────────────
// Returns up to `limit` published index.html paths, same businessType first.
function findPublishedMocks(excludeSlug, preferBusinessType, limit = 2) {
  const same = [];
  const other = [];

  for (const category of REPO_CATEGORIES) {
    const categoryDir = path.join(__dirname, category);
    if (!fs.existsSync(categoryDir)) continue;

    for (const client of fs.readdirSync(categoryDir).sort()) {
      const clientSlug = `${category}/${client}`;
      if (clientSlug === excludeSlug) continue;

      const htmlPath  = path.join(__dirname, clientSlug, 'index.html');
      const briefPath = path.join(__dirname, clientSlug, 'brief.json');
      if (!fs.existsSync(htmlPath)) continue;

      let isMatch = false;
      if (fs.existsSync(briefPath)) {
        try {
          const b = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
          isMatch = b.businessType === preferBusinessType;
        } catch {}
      }

      (isMatch ? same : other).push({ slug: clientSlug, htmlPath });
    }
  }

  return [...same, ...other].slice(0, limit);
}

// ── TOC updater ─────────────────────────────────────────────────────────────
function updateTOC(slug, brief) {
  const tocPath = path.join(__dirname, 'index.html');
  let toc = fs.readFileSync(tocPath, 'utf8');

  if (toc.includes(`href="${slug}/"`)) {
    console.log('  TOC: entry already exists, skipping.');
    return;
  }

  const categoryLabel = CATEGORY_MAP[brief.businessType];
  if (!categoryLabel) {
    console.log(`  TOC: unknown businessType "${brief.businessType}" — add manually.`);
    return;
  }

  const newEntry =
    `\n        <li><a href="${slug}/" target="_blank" rel="noopener">\n` +
    `          <span class="lead-name">${brief.businessName}</span>\n` +
    `          <span class="lead-arrow">→</span>\n` +
    `        </a></li>`;

  const pattern = new RegExp(
    `(<p class="category-label">${categoryLabel}<\\/p>\\s*<ul class="lead-list">)((?:(?!<\\/ul>)[\\s\\S])*?)(<\\/ul>)`,
  );

  if (!pattern.test(toc)) {
    console.log(`  TOC: category "${categoryLabel}" not found — add entry manually.`);
    return;
  }

  toc = toc.replace(pattern, `$1$2${newEntry}\n      $3`);
  toc = toc.replace(
    /(\d+) mocks across (\d+) industries/,
    (_, count, industries) => `${parseInt(count, 10) + 1} mocks across ${industries} industries`,
  );

  fs.writeFileSync(tocPath, toc);
  console.log('  TOC: updated successfully.');
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const slug = process.argv[2];

  if (!slug) {
    console.error('Usage: node generate.js <clientSlug>');
    console.error('Example: node generate.js foodTrucks/tacoLoco');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set. Copy .env.example → .env and add your key.');
    process.exit(1);
  }

  const clientDir = path.join(__dirname, slug);
  if (!fs.existsSync(clientDir)) {
    console.error(`Error: directory "${slug}" not found.`);
    process.exit(1);
  }

  const briefPath = path.join(clientDir, 'brief.json');
  if (!fs.existsSync(briefPath)) {
    console.error(`Error: brief.json not found in ${slug}. Copy _template/brief.json and fill it in.`);
    process.exit(1);
  }

  const brief             = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
  const stylingRules      = fs.readFileSync(path.join(__dirname, 'styling_rules.md'), 'utf8');
  const inspirations      = JSON.parse(fs.readFileSync(path.join(__dirname, 'inspirations.json'), 'utf8'));
  const categoryInspirations = inspirations[brief.businessType] || [];

  // Published mocks as quality reference (same category first, up to 2)
  const refMocks = findPublishedMocks(slug, brief.businessType);

  // Detect client assets
  const files     = fs.readdirSync(clientDir).filter(isImage);
  const logoFile  = files.find(f => /^logo\./i.test(f));
  const heroFile  = files.find(f => /^hero\./i.test(f));
  const menuFile  = files.find(f => /^menu\./i.test(f));
  const photoFiles = files
    .filter(f => /^photo\d+\./i.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));

  const assetList = [
    logoFile       ? `Logo: ${logoFile}`               : 'Logo: none',
    heroFile       ? `Hero: ${heroFile}`               : 'Hero: none',
    photoFiles.length ? `Photos: ${photoFiles.join(', ')}` : 'Photos: none (use CSS placeholders)',
    menuFile       ? `Menu image: ${menuFile}`         : 'Menu image: none',
  ].join('\n');

  console.log(`\nGenerating mock for: ${brief.businessName}`);
  console.log(`Slug: ${slug}`);
  console.log(`Assets:\n  ${assetList.replace(/\n/g, '\n  ')}`);
  console.log(`Reference mocks: ${refMocks.length ? refMocks.map(r => r.slug).join(', ') : 'none yet'}\n`);

  // Build vision content (client assets only)
  const imageContent = [];
  if (logoFile)  imageContent.push(...imageBlock('LOGO', path.join(clientDir, logoFile)));
  if (heroFile)  imageContent.push(...imageBlock('HERO IMAGE', path.join(clientDir, heroFile)));
  photoFiles.forEach((f, i) =>
    imageContent.push(...imageBlock(`PHOTO ${i + 1}`, path.join(clientDir, f)))
  );
  if (menuFile) imageContent.push(...imageBlock('MENU IMAGE', path.join(clientDir, menuFile)));

  // Build text reference section from published HTML files
  const refSection = refMocks.length
    ? `\n\n## Approved Reference Mocks\n` +
      `The HTML files below are published, approved Queso Ventures mocks. ` +
      `Study their structure, CSS patterns, section rhythm, and typography decisions. ` +
      `Match their quality and polish. Do NOT copy their palette or layout — ` +
      `this is a different business with its own brand.\n\n` +
      refMocks.map(r =>
        `### ${r.slug}\n\`\`\`html\n${fs.readFileSync(r.htmlPath, 'utf8')}\n\`\`\``
      ).join('\n\n')
    : '';

  const systemPrompt =
    `You are the Build Agent for Queso Ventures — a small business web design studio. ` +
    `Your job is to output a complete, single-file HTML landing page mock for a lead. ` +
    `The output must be ready to deploy as-is.\n\n` +
    `## Styling Rules (enforced — no exceptions)\n${stylingRules}\n\n` +
    `## Output Format\n` +
    `- Output ONLY the raw HTML document. No markdown fences, no explanation, no preamble.\n` +
    `- Single self-contained file. All CSS in <style>. All JS in <script>.\n` +
    `- Images referenced as relative paths (logo.jpg, hero.webp, photo1.jpg, etc.).\n` +
    `- Google Fonts via <link> in <head>.\n` +
    `- JSON-LD LocalBusiness schema in <head>.\n` +
    `- Fully mobile-responsive. Single column at <768px.\n` +
    `- Clean, non-repetitive CSS. Target under 7500 tokens.`;

  const inspirationText = categoryInspirations.length
    ? categoryInspirations.map(s => `- ${s.name}: ${s.url}`).join('\n')
    : 'None listed — use best practices for this business type.';

  const userPrompt =
    `Build a landing page for this business.\n\n` +
    `## Business Brief\n${JSON.stringify(brief, null, 2)}\n\n` +
    `## Available Assets\n${assetList}\n\n` +
    `## Inspiration Sites for "${brief.businessType}"\n${inspirationText}` +
    refSection + `\n\n` +
    `## Image Assets (attached)\n` +
    `Analyze the attached images to extract brand palette and mood. ` +
    `Use logo colors as the primary palette. ` +
    `Use the hero image as a full-bleed section background if available.\n\n` +
    `Generate the complete index.html now.`;

  process.stdout.write('Building');
  let html = '';

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          ...imageContent,
        ],
      },
    ],
  });

  stream.on('text', (text) => {
    html += text;
    process.stdout.write('.');
  });

  await stream.finalMessage();
  console.log(' done.\n');

  // Strip accidental markdown fences
  html = html.replace(/^```html\s*/i, '').replace(/\s*```\s*$/, '').trim();

  if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) {
    console.error('Warning: output does not look like valid HTML. Saved to generate-debug.txt');
    fs.writeFileSync(path.join(__dirname, 'generate-debug.txt'), html);
    process.exit(1);
  }

  const outputPath = path.join(clientDir, 'index.html');
  fs.writeFileSync(outputPath, html);
  console.log(`  HTML: written to ${slug}/index.html`);

  updateTOC(slug, brief);

  console.log(`\nDone. Open ${slug}/index.html to preview.\n`);
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
