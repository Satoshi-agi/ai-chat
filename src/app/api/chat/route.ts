import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { sendMessage } from '@/lib/claude';
import { validateMessage, validateSessionId } from '@/lib/validation';
import { applyRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import type { ChatRequest, ChatResponse, Message } from '@/types';

/**
 * POST /api/chat
 * Send a message to Claude and save conversation
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, RATE_LIMIT_CONFIGS.CHAT);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.errorMessage },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Parse request body
    const body: ChatRequest = await request.json();
    const { message, sessionId, conversationHistory = [] } = body;

    // Validate and sanitize message
    const messageValidation = validateMessage(message);
    if (!messageValidation.isValid) {
      return NextResponse.json(
        { error: messageValidation.error },
        {
          status: 400,
          headers: rateLimitResult.headers,
        }
      );
    }

    const sanitizedMessage = messageValidation.sanitized!;

    // Generate or validate session ID
    let currentSessionId = sessionId;
    if (sessionId) {
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
    } else {
      currentSessionId = uuidv4();
    }

    // Connect to database
    await connectDB();

    // Send message to Claude API (use sanitized message)
    const assistantResponse = await sendMessage(conversationHistory, sanitizedMessage);

    // Prepare messages to save
    const userMessage: Message = {
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date(),
    };

    // Save or update conversation
    const existingConversation = await Conversation.findOne({
      sessionId: currentSessionId,
    });

    if (existingConversation) {
      // Update existing conversation
      existingConversation.messages.push(userMessage, assistantMessage);
      await existingConversation.save();
    } else {
      // Create new conversation
      await Conversation.create({
        sessionId: currentSessionId,
        messages: [userMessage, assistantMessage],
      });
    }

    // Return response
    const response: ChatResponse = {
      response: assistantResponse,
      sessionId: currentSessionId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: rateLimitResult.headers,
    });
  } catch (error) {
    console.error('Chat API Error:', error);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 }
        );
      }
      if (error.message.includes('Invalid API key')) {
        return NextResponse.json(
          { error: 'Service configuration error' },
          { status: 500 }
        );
      }
      if (error.message.includes('Invalid request')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
