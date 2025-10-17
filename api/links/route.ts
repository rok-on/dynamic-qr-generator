// NOTE: To generate a short ID, this file requires the 'nanoid' package.
// You must have a Vercel KV store linked to your project for this to work.
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import type { Link } from '../../types';

export const runtime = 'edge';

// GET /api/links - Fetches all links
export async function GET(request: Request) {
    try {
        const linkIds = await kv.lrange('link_ids', 0, -1);
        if (!linkIds || linkIds.length === 0) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const pipeline = kv.pipeline();
        linkIds.forEach(id => pipeline.get(`link:${id}`));
        const linksData = await pipeline.exec<Link[]>();

        const links = linksData.filter(link => link !== null);

        return new Response(JSON.stringify(links), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to fetch links' }), { status: 500 });
    }
}

// POST /api/links - Creates a new link
export async function POST(request: Request) {
    try {
        let { destinationUrl } = await request.json();

        if (!destinationUrl || typeof destinationUrl !== 'string') {
            return new Response(JSON.stringify({ error: 'Destination URL is required' }), { status: 400 });
        }
        
        destinationUrl = destinationUrl.trim();
        // Handle protocol-relative URLs and URLs without a scheme.
        if (destinationUrl.startsWith('//')) {
            destinationUrl = `https:${destinationUrl}`;
        } else if (!/^[a-z][a-z0-9+.-]*:/.test(destinationUrl)) {
            destinationUrl = `https://${destinationUrl}`;
        }

        try {
            new URL(destinationUrl);
        } catch (_) {
            return new Response(JSON.stringify({ error: 'Invalid URL format' }), { status: 400 });
        }

        const id = nanoid(8);
        const { origin } = new URL(request.url);
        const shortUrl = `${origin}/api/r/${id}`;
        const now = Date.now();

        const newLink: Link = {
            id,
            destinationUrl,
            shortUrl,
            createdAt: now,
            updatedAt: now,
            scanCount: 0,
            qrOptions: {
                fgColor: '#000000',
                bgColor: '#ffffff',
                level: 'H',
                imageSettings: null,
            }
        };

        await kv.set(`link:${id}`, newLink);
        await kv.lpush('link_ids', id);

        return new Response(JSON.stringify(newLink), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to create link' }), { status: 500 });
    }
}