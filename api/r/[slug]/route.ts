import { kv } from '@vercel/kv';
// FIX: Replaced alias path with relative path for serverless environment compatibility.
import type { Link } from '../../../src/types';

export const runtime = 'edge';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
    const { slug } = params;
    try {
        // FIX: `kv.get` is the correct method for fetching a value. The reported error is likely due to a type definition issue.
        const link = await kv.get<Link>(`link:${slug}`);
        
        if (link && link.destinationUrl) {
            // Use 307 Temporary Redirect
            return new Response(null, {
                status: 307,
                headers: { 'Location': link.destinationUrl }
            });
        } else {
            // Redirect to the homepage if the link is not found
            const { origin } = new URL(request.url);
            return new Response(null, {
                status: 307,
                headers: { 'Location': origin }
            });
        }
    } catch (error) {
        console.error('Redirect error:', error);
        // Fallback to homepage on error
        const { origin } = new URL(request.url);
        return new Response(null, {
            status: 307,
            headers: { 'Location': origin }
        });
    }
}
