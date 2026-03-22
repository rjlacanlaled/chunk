import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import type { UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { makeTaskTools } from '@/lib/ai/tools';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const POST = async (req: Request) => {
  const body = await req.json();
  const { messages, owner } = body;

  const resolvedOwner = owner ?? { guestId: 'anonymous' };
  const tools = makeTaskTools(resolvedOwner);

  // Normalize messages to UIMessage format for convertToModelMessages
  const uiMessages: UIMessage[] = messages.map((msg: Record<string, unknown>) => {
    if (msg.parts) return msg; // already UIMessage format
    // Convert legacy { role, content } to UIMessage with parts
    return {
      ...msg,
      id: msg.id ?? crypto.randomUUID(),
      parts: [{ type: 'text' as const, text: typeof msg.content === 'string' ? msg.content : '' }],
    };
  });

  const modelMessages = await convertToModelMessages(uiMessages);

  const result = streamText({
    model: openrouter('google/gemini-2.0-flash-001'),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(20),
    maxOutputTokens: 16384,
  });

  return result.toUIMessageStreamResponse();
};
