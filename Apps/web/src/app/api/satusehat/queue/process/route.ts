/**
 * POST /api/satusehat/queue/process
 * Process pending SatuSehat queue items with retry logic
 * This should be called periodically (every 5 minutes)
 */

import { NextResponse } from 'next/server';
import { getQueueService } from '@/lib/api/satusehat/queue-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Optional: Verify authorization (e.g., internal cron job token)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SATUSEHAT_CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process the queue
    const queueService = getQueueService();
    const result = await queueService.processQueue();

    return NextResponse.json({
      success: true,
      message: 'Queue processing completed',
      data: {
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    });
  } catch (error) {
    console.error('Queue processing error:', error);

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
