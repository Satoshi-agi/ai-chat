/**
 * Streaming chat endpoint using Server-Sent Events (SSE)
 * Provides real-time streaming responses from Claude API
 */

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { validateMessage, validateSessionId } from '@/lib/validation';
import { applyRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import Anthropic from '@anthropic-ai/sdk';
import type { ChatRequest, Message } from '@/types';

/**
 * Get Claude API client
 */
function getClient(): Anthropic {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      'Please define the ANTHROPIC_API_KEY environment variable'
    );
  }

  return new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
    maxRetries: 3,
  });
}

/**
 * POST /api/chat/stream
 * Stream a message to Claude and save conversation
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = applyRateLimit(request, RATE_LIMIT_CONFIGS.CHAT);

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ error: rateLimitResult.errorMessage }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitResult.headers,
        },
      }
    );
  }

  try {
    // Parse request body
    const body: ChatRequest = await request.json();
    const { message, sessionId, conversationHistory = [] } = body;

    // Validate and sanitize message
    const messageValidation = validateMessage(message);
    if (!messageValidation.isValid) {
      return new Response(
        JSON.stringify({ error: messageValidation.error }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitResult.headers,
          },
        }
      );
    }

    const sanitizedMessage = messageValidation.sanitized!;

    // Generate or validate session ID
    let currentSessionId = sessionId;
    if (sessionId) {
      const sessionValidation = validateSessionId(sessionId);
      if (!sessionValidation.isValid) {
        return new Response(
          JSON.stringify({ error: sessionValidation.error }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...rateLimitResult.headers,
            },
          }
        );
      }
    } else {
      currentSessionId = uuidv4();
    }

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const client = getClient();

          // Convert messages to Anthropic format
          const conversationMessages: Anthropic.MessageParam[] = [
            ...conversationHistory.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user' as const, content: sanitizedMessage },
          ];

          // Create streaming request
          const messageStream = client.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            messages: conversationMessages,
          });

          let fullText = '';

          // Send session ID first
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'session', sessionId: currentSessionId })}\n\n`
            )
          );

          // Handle text chunks
          messageStream.on('text', (text) => {
            fullText += text;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'text', content: text })}\n\n`
              )
            );
          });

          // Wait for completion
          await messageStream.finalMessage();

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'done' })}\n\n`
            )
          );

          // Save conversation to database
          await connectDB();

          const userMessage: Message = {
            role: 'user',
            content: sanitizedMessage,
            timestamp: new Date(),
          };

          const assistantMessage: Message = {
            role: 'assistant',
            content: fullText,
            timestamp: new Date(),
          };

          const existingConversation = await Conversation.findOne({
            sessionId: currentSessionId,
          });

          if (existingConversation) {
            existingConversation.messages.push(userMessage, assistantMessage);
            await existingConversation.save();
          } else {
            await Conversation.create({
              sessionId: currentSessionId,
              messages: [userMessage, assistantMessage],
            });
          }

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);

          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        ...rateLimitResult.headers,
      },
    });
  } catch (error) {
    console.error('Chat Stream API Error:', error);

    return new Response(
      JSON.stringify({
        error: 'An error occurred while processing your request',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
