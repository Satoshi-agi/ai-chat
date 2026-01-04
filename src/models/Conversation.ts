import mongoose, { Schema, Document, Model } from 'mongoose';
import type { Message, Conversation as IConversation } from '@/types';

/**
 * Mongoose Document interface for Conversation
 */
export interface ConversationDocument extends Document {
  sessionId: string;
  messages: Message[];
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message Schema
 */
const MessageSchema = new Schema<Message>(
  {
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant'],
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Conversation Schema
 */
const ConversationSchema = new Schema<ConversationDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    messages: {
      type: [MessageSchema],
      required: true,
      default: [],
    },
    title: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Generate title from first user message
 */
ConversationSchema.pre('save', function () {
  if (!this.title && this.messages.length > 0) {
    const firstUserMessage = this.messages.find((msg) => msg.role === 'user');
    if (firstUserMessage) {
      // Use first 50 characters of the first user message as title
      this.title = firstUserMessage.content.substring(0, 50);
      if (firstUserMessage.content.length > 50) {
        this.title += '...';
      }
    }
  }
});

/**
 * Create index for faster queries
 */
ConversationSchema.index({ createdAt: -1 });

/**
 * Conversation Model
 */
const Conversation: Model<ConversationDocument> =
  mongoose.models.Conversation ||
  mongoose.model<ConversationDocument>('Conversation', ConversationSchema);

export default Conversation;
