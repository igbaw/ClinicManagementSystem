/**
 * POST /api/satusehat/submission/retry
 * Manually retry a failed submission
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { QueueStatus } from '@/lib/api/satusehat/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId' },
        { status: 400 }
      );
    }

    // Get submission record
    const { data: submission, error: submissionError } = await supabase
      .from('satusehat_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check if submission is already successful
    if (submission.submission_status === 'success') {
      return NextResponse.json(
        {
          error: 'Submission already successful',
          submission: submission,
        },
        { status: 400 }
      );
    }

    // Check if max retries already exceeded
    if (submission.retry_count >= 3) {
      return NextResponse.json(
        {
          error: 'Maximum retry attempts (3) already exceeded',
          submission: submission,
        },
        { status: 400 }
      );
    }

    // Get or create queue item
    const { data: existingQueue } = await supabase
      .from('satusehat_queue')
      .select('id')
      .eq('submission_id', submissionId)
      .single();

    if (existingQueue) {
      // Update existing queue item
      await supabase
        .from('satusehat_queue')
        .update({
          status: 'queued',
          next_retry_at: new Date().toISOString(), // Retry immediately
          last_error: null,
        })
        .eq('id', existingQueue.id);
    } else {
      // Create new queue item
      await supabase
        .from('satusehat_queue')
        .insert({
          submission_id: submissionId,
          resource_type: submission.resource_type,
          local_id: submission.local_id,
          priority: 1, // High priority for manual retry
          scheduled_for: new Date().toISOString(),
          next_retry_at: new Date().toISOString(),
          status: 'queued',
        });
    }

    // Update submission status
    await supabase
      .from('satusehat_submissions')
      .update({
        submission_status: 'pending',
        retry_count: submission.retry_count + 1,
        last_retry_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    // Log retry event
    await supabase.from('satusehat_sync_events').insert({
      event_type: 'sync_retried',
      resource_type: submission.resource_type,
      resource_id: submission.local_id,
      details: {
        submission_id: submissionId,
        retry_number: submission.retry_count + 1,
        manual_retry: true,
        user_id: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Submission queued for retry',
      submission: {
        id: submissionId,
        status: 'pending',
        retryCount: submission.retry_count + 1,
      },
    });
  } catch (error) {
    console.error('Submission retry error:', error);

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
