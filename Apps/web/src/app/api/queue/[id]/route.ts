import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { status } = await request.json();
    const { id: queueId } = await params;

    // Validate status
    const validStatuses = ['waiting', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_STATUS', message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Update queue entry
    const { data: queueEntry, error } = await supabase
      .from('queue_entries')
      .update({ status })
      .eq('id', queueId)
      .select()
      .single();

    if (error) {
      console.error('Error updating queue entry:', error);
      return NextResponse.json(
        { success: false, error: 'UPDATE_ERROR', message: 'Failed to update queue entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: queueEntry.id,
        status: queueEntry.status,
        started_at: queueEntry.started_at,
        completed_at: queueEntry.completed_at,
        updated_at: queueEntry.updated_at,
      },
    });
  } catch (error) {
    console.error('Queue update error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
