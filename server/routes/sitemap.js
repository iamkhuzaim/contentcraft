/**
 * ContentCraft Sitemap Routes
 * Generate and serve sitemaps for SEO
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');

// Generate sitemap XML
router.get('/sitemap.xml', async (req, res) => {
    try {
        const [cache] = await query(
            'SELECT content FROM sitemap_cache WHERE sitemap_type = ? AND last_generated > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
            ['main']
        );

        if (cache) {
            res.header('Content-Type', 'application/xml');
            return res.send(cache.content);
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const blogs = await query(
            'SELECT id, updated_at FROM blogs WHERE is_published = TRUE ORDER BY updated_at DESC'
        );

        const categories = await query('SELECT id FROM categories');

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        const staticPages = ['', 'blogs', 'categories', 'search', 'about', 'contact', 'faq', 'privacy', 'terms'];
        staticPages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/${page}</loc>\n`;
            xml += '    <changefreq>daily</changefreq>\n';
            xml += '    <priority>0.8</priority>\n';
            xml += '  </url>\n';
        });

        blogs.forEach(blog => {
            const date = new Date(blog.updated_at).toISOString().split('T')[0];
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/blog/${blog.id}</loc>\n`;
            xml += `    <lastmod>${date}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.9</priority>\n';
            xml += '  </url>\n';
        });

        categories.forEach(cat => {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/blogs?category=${cat.id}</loc>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.7</priority>\n';
            xml += '  </url>\n';
        });

        xml += '</urlset>';

        await query(
            'INSERT INTO sitemap_cache (sitemap_type, content, last_generated) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE content = ?, last_generated = NOW()',
            ['main', xml, xml]
        );

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error('Generate sitemap error:', error);
        res.status(500).send('Error generating sitemap');
    }
});

// Generate RSS feed
router.get('/feed.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const blogs = await query(
            `SELECT b.id, b.title, b.description, b.content, b.created_at, 
                    u.name as author_name
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             WHERE b.is_published = TRUE
             ORDER BY b.created_at DESC
             LIMIT 20`
        );

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
        xml += '<channel>\n';
        xml += `  <title>ContentCraft - Latest Stories</title>\n`;
        xml += `  <link>${baseUrl}</link>\n`;
        xml += `  <description>Latest stories from ContentCraft creators</description>\n`;
        xml += `  <language>en-us</language>\n`;
        xml += `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
        xml += `  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>\n`;

        blogs.forEach(blog => {
            const date = new Date(blog.created_at).toUTCString();
            const content = blog.content.replace(/<[^>]*>/g, '').substring(0, 500);

            xml += '  <item>\n';
            xml += `    <title>${escapeXml(blog.title)}</title>\n`;
            xml += `    <link>${baseUrl}/blog/${blog.id}</link>\n`;
            xml += `    <description>${escapeXml(content)}...</description>\n`;
            xml += `    <author>${escapeXml(blog.author_name)}</author>\n`;
            xml += `    <pubDate>${date}</pubDate>\n`;
            xml += `    <guid>${baseUrl}/blog/${blog.id}</guid>\n`;
            xml += '  </item>\n';
        });

        xml += '</channel>\n';
        xml += '</rss>';

        res.header('Content-Type', 'application/rss+xml');
        res.send(xml);
    } catch (error) {
        console.error('Generate RSS feed error:', error);
        res.status(500).send('Error generating RSS feed');
    }
});

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

module.exports = router;