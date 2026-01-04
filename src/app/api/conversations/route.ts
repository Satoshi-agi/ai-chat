import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { validatePaginationParams } from '@/lib/validation';
import { applyRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import type { ConversationsResponse, ConversationSummary } from '@/types';

/**
 * GET /api/conversations
 * Get list of conversations with pagination
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit') || undefined;
    const offsetParam = searchParams.get('offset') || undefined;

    // Validate pagination parameters
    const validation = validatePaginationParams(limitParam, offsetParam);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        {
          status: 400,
          headers: rateLimitResult.headers,
        }
      );
    }

    const limit = validation.limit!;
    const offset = validation.offset!;

    // Connect to database
    await connectDB();

    // Get total count
    const total = await Conversation.countDocuments();

    // Get conversations with pagination
    const conversations = await Conversation.find()
      .sort({ createdAt: -1 }) // Sort by most recent first
      .skip(offset)
      .limit(limit)
      .select('sessionId title createdAt messages')
      .lean();

    // Format response
    const conversationSummaries: ConversationSummary[] = conversations.map(
      (conv) => ({
        sessionId: conv.sessionId,
        title: conv.title || 'Untitled Conversation',
        createdAt: conv.createdAt.toISOString(),
        messageCount: conv.messages.length,
      })
    );

    const response: ConversationsResponse = {
      conversations: conversationSummaries,
      total,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: rateLimitResult.headers,
    });
  } catch (error) {
    console.error('Get Conversations API Error:', error);

    return NextResponse.json(
      { error: 'An error occurred while fetching conversations' },
      { status: 500 }
    );
  }
}
