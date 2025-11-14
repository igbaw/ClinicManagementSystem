/**
 * GET /api/satusehat/submissions
 * Get SatuSehat submission history and status
 */

import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const resourceType = searchParams.get('resourceType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('satusehat_submissions')
      .select('*', { count: 'exact' });

    // Filter by resource type if provided
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('submission_status', status);
    }

    // Add ordering and pagination
    const { data: submissions, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Get queue items status for submissions
    const submissionIds = submissions.map((s: any) => s.id);
    const { data: queueItems } = await supabase
      .from('satusehat_queue')
      .select('submission_id, status, attempt_count, max_retries')
      .in('submission_id', submissionIds);

    // Map queue status to submissions
    const queueMap = new Map();
    if (queueItems) {
      queueItems.forEach((item: any) => {
        queueMap.set(item.submission_id, {
          status: item.status,
          attempt: item.attempt_count,
          maxRetries: item.max_retries,
        });
      });
    }

    const enrichedSubmissions = submissions.map((submission: any) => ({
      ...submission,
      queue: queueMap.get(submission.id) || null,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedSubmissions,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error('Submissions fetch error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
