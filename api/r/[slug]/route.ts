import { kv } from '@vercel/kv';
import type { Link } from '../../../types';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
    const { slug } = params;
    try {
        const link = await kv.get<Link>(`link:${slug}`);
        
        if (link && link.destinationUrl) {
            // Fire-and-forget the scan count update to avoid delaying the redirect
            const updatePromise = kv.set(`link:${slug}`, {
                ...link,
                scanCount: (link.scanCount || 0) + 1,
            });
            // Log any potential errors during the update without blocking
            updatePromise.catch(console.error);

            // Use 307 Temporary Redirect
            return NextResponse.redirect(link.destinationUrl, 307);
        } else {
            // Redirect to the homepage if the link is not found
            const { origin } = new URL(request.url);
            return NextResponse.redirect(origin, 307);
        }
    } catch (error) {
        console.error('Redirect error:', error);
        // Fallback to homepage on error
        const { origin } = new URL(request.url);
        return NextResponse.redirect(origin, 307);
    }
}