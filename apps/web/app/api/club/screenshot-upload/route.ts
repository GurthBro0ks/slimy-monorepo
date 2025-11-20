import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/club/screenshot-upload
 * Proxy to admin-api screenshot upload endpoint
 *
 * This route forwards multipart/form-data requests to the admin-api backend
 * which handles file storage and GPT-4 Vision analysis.
 */
export async function POST(request: NextRequest) {
  try {
    const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'http://admin-api:3080';

    // Get the form data from the request
    const formData = await request.formData();

    // Forward the request to admin-api
    const response = await fetch(`${adminApiBase}/api/screenshot/upload`, {
      method: 'POST',
      body: formData,
      // Forward relevant headers
      headers: {
        // Don't set Content-Type - let fetch set it with the boundary for multipart/form-data
        ...(request.headers.get('cookie') ? { 'Cookie': request.headers.get('cookie')! } : {}),
        ...(request.headers.get('authorization') ? { 'Authorization': request.headers.get('authorization')! } : {}),
      },
    });

    // Get the response data
    const data = await response.json();

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[screenshot-upload] Proxy error:', error);
    return NextResponse.json(
      {
        error: 'proxy_error',
        message: error instanceof Error ? error.message : 'Failed to proxy request to admin-api',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/club/screenshot-upload/:id
 * Get screenshot metadata and analysis (proxy to admin-api)
 */
export async function GET(request: NextRequest) {
  try {
    const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'http://admin-api:3080';
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'missing_id', message: 'Screenshot ID is required' },
        { status: 400 }
      );
    }

    // Forward the request to admin-api
    const response = await fetch(`${adminApiBase}/api/screenshot/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('cookie') ? { 'Cookie': request.headers.get('cookie')! } : {}),
        ...(request.headers.get('authorization') ? { 'Authorization': request.headers.get('authorization')! } : {}),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[screenshot-upload] GET proxy error:', error);
    return NextResponse.json(
      {
        error: 'proxy_error',
        message: error instanceof Error ? error.message : 'Failed to fetch screenshot',
      },
      { status: 500 }
    );
  }
}
