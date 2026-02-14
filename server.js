import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'node-html-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// GEO Checker API - fetches URL and analyzes for AI readiness
app.post('/api/geo-check', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const response = await fetch(fullUrl, {
      headers: { 'User-Agent': 'GEO-Checker-Bot/1.0' }
    });
    const html = await response.text();
    const root = parse(html);

    const results = analyzeForGEO(html, root, fullUrl);
    res.json(results);
  } catch (error) {
    console.error('GEO Check error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze URL',
      details: error.message 
    });
  }
});

function analyzeForGEO(html, root, url) {
  const checks = [];
  let score = 0;
  const maxScore = 100;

  // 1. JSON-LD Structured Data
  const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]');
  const jsonLdData = [];
  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.text);
      jsonLdData.push(Array.isArray(data) ? data : [data]);
    } catch (e) {
      jsonLdData.push({ error: 'Invalid JSON' });
    }
  });
  const hasJsonLd = jsonLdData.length > 0;
  if (hasJsonLd) {
    score += 25;
    checks.push({ 
      name: 'JSON-LD Structured Data', 
      status: 'pass', 
      message: `Found ${jsonLdData.length} JSON-LD block(s)`,
      details: jsonLdData.flat()
    });
  } else {
    checks.push({ 
      name: 'JSON-LD Structured Data', 
      status: 'fail', 
      message: 'No JSON-LD found. Add schema.org markup for AI comprehension.',
      recommendation: 'Add Organization, WebSite, or Product schema'
    });
  }

  // 2. Meta tags
  const metaDescription = root.querySelector('meta[name="description"]')?.getAttribute('content');
  const metaTitle = root.querySelector('title')?.text;
  const ogTags = {
    title: root.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    description: root.querySelector('meta[property="og:description"]')?.getAttribute('content'),
    type: root.querySelector('meta[property="og:type"]')?.getAttribute('content')
  };
  const metaScore = [metaDescription, metaTitle, ogTags.title].filter(Boolean).length * 5;
  score += Math.min(metaScore, 15);
  checks.push({
    name: 'Meta Tags & Open Graph',
    status: metaDescription && metaTitle ? 'pass' : 'warn',
    message: metaDescription ? `Meta description: ${metaDescription.substring(0, 60)}...` : 'Missing meta description',
    details: { metaTitle, metaDescription, ogTags }
  });

  // 3. Semantic HTML / Headings
  const h1Count = root.querySelectorAll('h1').length;
  const hasH1 = h1Count >= 1 && h1Count <= 1;
  if (hasH1) {
    score += 10;
    checks.push({ name: 'Heading Structure', status: 'pass', message: 'Single H1 found' });
  } else {
    checks.push({ 
      name: 'Heading Structure', 
      status: h1Count === 0 ? 'fail' : 'warn',
      message: h1Count === 0 ? 'No H1 found' : `Multiple H1s (${h1Count})`
    });
  }

  // 4. Content extraction
  const bodyText = root.querySelector('body')?.text?.replace(/\s+/g, ' ').trim() || '';
  const wordCount = bodyText.split(/\s+/).length;
  const hasSubstantialContent = wordCount > 100;
  if (hasSubstantialContent) {
    score += 15;
    checks.push({ 
      name: 'Substantial Content', 
      status: 'pass', 
      message: `~${wordCount} words of extractable content` 
    });
  } else {
    checks.push({ 
      name: 'Substantial Content', 
      status: 'warn', 
      message: `Only ~${wordCount} words. AI systems prefer 200+ words.` 
    });
  }

  // 5. Robots/Sitemap signals
  const robotsMeta = root.querySelector('meta[name="robots"]')?.getAttribute('content');
  const hasRobots = !!robotsMeta;
  score += hasRobots ? 5 : 0;
  checks.push({
    name: 'Crawler Directives',
    status: 'info',
    message: robotsMeta || 'No robots meta (default: allow all)',
    details: { robotsMeta }
  });

  // 6. Schema.org types present
  const schemaTypes = new Set();
  jsonLdData.flat().forEach(item => {
    if (item && item['@type']) {
      schemaTypes.add(Array.isArray(item['@type']) ? item['@type'][0] : item['@type']);
    }
  });
  const preferredTypes = ['Organization', 'WebSite', 'Product', 'SoftwareApplication', 'Article'];
  const hasPreferredSchema = [...schemaTypes].some(t => preferredTypes.includes(t));
  if (hasPreferredSchema) {
    score += 15;
    checks.push({ 
      name: 'AI-Relevant Schema', 
      status: 'pass', 
      message: `Found: ${[...schemaTypes].join(', ')}` 
    });
  } else if (schemaTypes.size > 0) {
    checks.push({ 
      name: 'AI-Relevant Schema', 
      status: 'warn', 
      message: `Consider adding Organization or WebSite schema. Found: ${[...schemaTypes].join(', ') || 'Unknown'}` 
    });
  }

  // 7. llms.txt (emerging standard)
  const hasLlmsTxt = false; // Would need separate fetch to /llms.txt
  checks.push({
    name: 'llms.txt',
    status: 'info',
    message: 'Check /llms.txt for AI crawler instructions (emerging standard)'
  });

  // Generate recommendations
  const recommendations = [];
  if (!hasJsonLd) {
    recommendations.push({
      priority: 'high',
      action: 'Add JSON-LD structured data',
      detail: 'Implement Organization and WebSite schema for AI comprehension'
    });
  }
  if (!metaDescription) {
    recommendations.push({
      priority: 'high',
      action: 'Add meta description',
      detail: '50-160 characters summarizing the page'
    });
  }
  if (!hasPreferredSchema && hasJsonLd) {
    recommendations.push({
      priority: 'medium',
      action: 'Add Organization/WebSite schema',
      detail: 'Helps AI systems understand your entity'
    });
  }
  if (wordCount < 200) {
    recommendations.push({
      priority: 'medium',
      action: 'Expand page content',
      detail: 'AI systems prefer 200+ words for citation'
    });
  }
  recommendations.push({
    priority: 'low',
    action: 'Add comparison/alternatives content',
    detail: 'Pages comparing products appear in "best X" and "alternatives to X" queries'
  });

  return {
    url: url,
    score: Math.min(score, 100),
    grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
    checks,
    recommendations,
    summary: {
      extractionReady: score >= 60,
      jsonLdCount: jsonLdData.length,
      schemaTypes: [...schemaTypes],
      wordCount
    }
  };
}

// Optional: SEO content generation (AI-enhanced if OPENAI_API_KEY is set)
app.post('/api/generate-content', async (req, res) => {
  try {
    const { type, topic, keywords, pageType, brand, cta } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (type === 'text' && apiKey && topic) {
      const kw = (keywords || '').split(',').map(k => k.trim()).filter(Boolean).slice(0, 5);
      const prompt = `Generate SEO-friendly content structure. Topic: ${topic}. Keywords: ${kw.join(', ') || 'none'}. Page type: ${pageType || 'blog'}. Brand: ${brand || 'N/A'}.
Return JSON only with: title (50-60 chars), meta (150-160 chars), h1, intro (2-3 sentences), h2s (array of 5-7 H2 headings), cta (short call-to-action).`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content.replace(/```json?\s*|\s*```/g, '').trim());
        return res.json(parsed);
      }
    }
    res.status(400).json({ error: 'AI not configured or invalid request' });
  } catch (err) {
    console.error('Generate content error:', err);
    res.status(500).json({ error: 'Generation failed' });
  }
});

// Serve built app (run "npm run build" first)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for client routes (not API)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SEO Booster running at http://localhost:${PORT}`);
});
