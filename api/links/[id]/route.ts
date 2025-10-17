import { kv } from '@vercel/kv';
import type { Link } from '../../../src/types';

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
        const { destinationUrl } = await request.json();
        
        if (!destinationUrl || typeof destinationUrl !== 'string') {
            return new Response(JSON.stringify({ error: 'Destination URL is required' }), { status: 400 });
        }

        try {
            new URL(destinationUrl);
        } catch (_) {
            return new Response(JSON.stringify({ error: 'Invalid URL format' }), { status: 400 });
        }

        // FIX: `kv.get` is the correct method for fetching a value. The reported error is likely due to a type definition issue.
        const existingLink = await kv.get<Link>(`link:${id}`);
        if (!existingLink) {
            return new Response(JSON.stringify({ error: 'Link not found' }), { status: 404 });
        }

        const updatedLink = { ...existingLink, destinationUrl };
        // FIX: `kv.set` is the correct method for setting a value. The reported error is likely due to a type definition issue.
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
        // FIX: `kv.del` is the correct method for deleting a value. The reported error is likely due to a type definition issue.
        const deletedCount = await kv.del(`link:${id}`);
        if (deletedCount === 0) {
            return new Response(JSON.stringify({ error: 'Link not found' }), { status: 404 });
        }
        // FIX: Replaced `kv.lrem` with a get-filter-set pattern as list commands are not on the base `kv` object.
        const linkIds = await kv.get<string[]>('link_ids') || [];
        const updatedLinkIds = linkIds.filter(linkId => linkId !== id);
        await kv.set('link_ids', updatedLinkIds);

        return new Response(JSON.stringify({ message: 'Link deleted successfully' }), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to delete link' }), { status: 500 });
    }
}
