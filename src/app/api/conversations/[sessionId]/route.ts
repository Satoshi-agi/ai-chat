import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { validateSessionId } from '@/lib/validation';
import { applyRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * GET /api/conversations/[sessionId]
 * Get a specific conversation by session ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, RATE_LIMIT_CONFIGS.CONVERSATIONS);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.errorMessage },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const { sessionId } = await params;

    // Validate session ID
    const sessionValidation = validateSessionId(sessionId);
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { error: sessionValidation.error },
        {
          status: 400,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Connect to database
    await connectDB();

    // Find conversation
    const conversation = await Conversation.findOne({ sessionId }).lean();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      sessionId: conversation.sessionId,
      messages: conversation.messages,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      title: conversation.title,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: rateLimitResult.headers,
    });
  } catch (error) {
    console.error('Get Conversation API Error:', error);

    return NextResponse.json(
      { error: 'An error occurred while fetching the conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[sessionId]
 * Delete a specific conversation by session ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, RATE_LIMIT_CONFIGS.CONVERSATIONS);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.errorMessage },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const { sessionId } = await params;

    // Validate session ID
    const sessionValidation = validateSessionId(sessionId);
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { error: sessionValidation.error },
        {
          status: 400,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Connect to database
    await connectDB();

    // Delete conversation
    const result = await Conversation.deleteOne({ sessionId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Conversation deleted successfully' },
      {
        status: 200,
        headers: rateLimitResult.headers,
      }
    );
  } catch (error) {
    console.error('Delete Conversation API Error:', error);

    return NextResponse.json(
      { error: 'An error occurred while deleting the conversation' },
      { status: 500 }
    );
  }
}
