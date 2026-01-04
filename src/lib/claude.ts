import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@/types';

/**
 * Get or create Claude API Client with retry configuration
 */
function getClient(): Anthropic {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      'Please define the ANTHROPIC_API_KEY environment variable inside .env.local'
    );
  }

  return new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
    maxRetries: 3, // Retry up to 3 times for failed requests
  });
}

/**
 * Default model to use for Claude API
 */
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

/**
 * Maximum tokens for Claude API response
 */
const MAX_TOKENS = 4096;

/**
 * Convert application Message format to Anthropic API format
 */
function convertMessages(messages: Message[]): Anthropic.MessageParam[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Send a message to Claude API and get a response
 * @param messages - Conversation history
 * @param userMessage - New user message
 * @returns Assistant's response text
 */
export async function sendMessage(
  messages: Message[],
  userMessage: string
): Promise<string> {
  try {
    const client = getClient();
    const conversationMessages = [
      ...convertMessages(messages),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      messages: conversationMessages,
    });

    // Extract text from response
    const textContent = response.content.find(
      (block) => block.type === 'text'
    );

    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return textContent.text;
  } catch (error) {
    console.error('Claude API Error:', error);

    if (error instanceof Anthropic.APIError) {
      // Handle specific API errors
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.status === 401) {
        throw new Error('Invalid API key. Please check your configuration.');
      } else if (error.status === 400) {
        throw new Error('Invalid request. Please check your message format.');
      }
    }

    throw new Error('Failed to get response from Claude API');
  }
}

/**
 * Stream a message from Claude API
 * @param messages - Conversation history
 * @param userMessage - New user message
 * @param onText - Callback for each text chunk
 * @returns Full assistant's response text
 */
export async function streamMessage(
  messages: Message[],
  userMessage: string,
  onText?: (text: string) => void
): Promise<string> {
  try {
    const client = getClient();
    const conversationMessages = [
      ...convertMessages(messages),
      { role: 'user' as const, content: userMessage },
    ];

    const stream = client.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      messages: conversationMessages,
    });

    let fullText = '';

    // Listen to text events
    stream.on('text', (text) => {
      fullText += text;
      if (onText) {
        onText(text);
      }
    });

    // Wait for stream to complete
    await stream.finalMessage();

    return fullText;
  } catch (error) {
    console.error('Claude API Streaming Error:', error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.status === 401) {
        throw new Error('Invalid API key. Please check your configuration.');
      } else if (error.status === 400) {
        throw new Error('Invalid request. Please check your message format.');
      }
    }

    throw new Error('Failed to stream response from Claude API');
  }
}

/**
 * Check if API key is valid by making a test request
 */
export async function validateAPIKey(): Promise<boolean> {
  try {
    const client = getClient();
    await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hello' }],
    });
    return true;
  } catch (error) {
    console.error('API Key validation failed:', error);
    return false;
  }
}
