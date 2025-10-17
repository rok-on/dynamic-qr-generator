import { kv } from '@vercel/kv';
import type { Link, QROptions } from '../../../types';

export const runtime = 'edge';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/links/[id] - Updates a link
export async function PUT(request: Request, { params }: RouteParams) {
    const { id } = params;
    try {
        const body = await request.json();
        const { destinationUrl, qrOptions }: { destinationUrl?: string; qrOptions?: QROptions } = body;

        if (!destinationUrl && !qrOptions) {
             return new Response(JSON.stringify({ error: 'Nothing to update. Provide destinationUrl or qrOptions.' }), { status: 400 });
        }

        const existingLink = await kv.get<Link>(`link:${id}`);
        if (!existingLink) {
            return new Response(JSON.stringify({ error: 'Link not found' }), { status: 404 });
        }

        const updatedData: Partial<Link> = { updatedAt: Date.now() };

        if (destinationUrl) {
            let fullUrl = destinationUrl.trim();
            // Handle protocol-relative URLs and URLs without a scheme.
            if (fullUrl.startsWith('//')) {
                fullUrl = `https:${fullUrl}`;
            } else if (!/^[a-z][a-z0-9+.-]*:/.test(fullUrl)) {
                fullUrl = `https://${fullUrl}`;
            }
            try {
                new URL(fullUrl);
                updatedData.destinationUrl = fullUrl;
            } catch (_) {
                return new Response(JSON.stringify({ error: 'Invalid URL format' }), { status: 400 });
            }
        }
        
        if (qrOptions) {
            updatedData.qrOptions = { ...existingLink.qrOptions, ...qrOptions };
        }

        const updatedLink: Link = { 
            ...existingLink, 
            ...updatedData
        };
        await kv.set(`link:${id}`, updatedLink);

        return new Response(JSON.stringify(updatedLink), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to update link' }), { status: 500 });
    }
}

// DELETE /api/links/[id] - Deletes a link
export async function DELETE(request: Request, { params }: RouteParams) {
    const { id } = params;
    try {
        const deletedCount = await kv.del(`link:${id}`);
        if (deletedCount === 0) {
            return new Response(JSON.stringify({ error: 'Link not found' }), { status: 404 });
        }
        await kv.lrem('link_ids', 0, id);

        return new Response(JSON.stringify({ message: 'Link deleted successfully' }), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to delete link' }), { status: 500 });
    }
}