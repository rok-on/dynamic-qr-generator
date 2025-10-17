
// NOTE: To generate a short ID, this file requires the 'nanoid' package.
// You must have a Vercel KV store linked to your project for this to work.
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import type { Link } from '../../src/types';

export const runtime = 'edge';

// GET /api/links - Fetches all links
export async function GET(request: Request) {
    try {
        // FIX: Replaced `kv.lrange` with `kv.get` as list-specific commands are not on the base `kv` object.
        const linkIds = await kv.get<string[]>('link_ids');
        if (!linkIds || linkIds.length === 0) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // FIX: Replaced `kv.pipeline` with `kv.mget` for batch fetching, which is the modern approach.
        const linksData = await kv.mget<Link[]>(...linkIds.map(id => `link:${id}`));

        const links = linksData.filter((link): link is Link => link !== null);

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
        const { destinationUrl } = await request.json();

        if (!destinationUrl || typeof destinationUrl !== 'string') {
            return new Response(JSON.stringify({ error: 'Destination URL is required' }), { status: 400 });
        }
        
        try {
            new URL(destinationUrl);
        } catch (_) {
            return new Response(JSON.stringify({ error: 'Invalid URL format' }), { status: 400 });
        }

        const id = nanoid(8);
        const { origin } = new URL(request.url);
        const shortUrl = `${origin}/api/r/${id}`;

        const newLink: Link = {
            id,
            destinationUrl,
            shortUrl,
            createdAt: Date.now(),
        };

        // FIX: The `set` call is correct according to the modern `@vercel/kv` API.
        await kv.set(`link:${id}`, newLink);
        // FIX: Replaced `kv.lpush` with a get-and-set pattern to manage the list of IDs.
        const linkIds = await kv.get<string[]>('link_ids') || [];
        linkIds.unshift(id);
        await kv.set('link_ids', linkIds);

        return new Response(JSON.stringify(newLink), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to create link' }), { status: 500 });
    }
}
