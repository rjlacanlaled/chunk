import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import type { UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import { makeTaskTools } from '@/lib/ai/tools';
import { saveMessage } from '@/server/actions/messages';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

function extractText(msg: Record<string, unknown>): string {
  if (typeof msg.content === 'string') return msg.content;
  if (Array.isArray(msg.parts)) {
    return (msg.parts as Array<{ type: string; text?: string }>)
      .filter((p) => p.type === 'text' && p.text)
      .map((p) => p.text)
      .join('');
  }
  return '';
}

export const POST = async (req: Request) => {
  const body = await req.json();
  const { messages, owner, clientTime, clientTimezone } = body;

  const resolvedOwner = owner ?? { guestId: 'anonymous' };
  const tools = makeTaskTools(resolvedOwner);

  // Save the latest user message to DB
  const lastMsg = messages[messages.length - 1];
  if (lastMsg?.role === 'user') {
    const text = extractText(lastMsg as Record<string, unknown>);
    if (text) {
      saveMessage({
        role: 'user',
        content: text,
        userId: resolvedOwner.userId,
        guestId: resolvedOwner.guestId,
      }).catch(() => {}); // fire and forget
    }
  }

  // Normalize messages to UIMessage format
  const uiMessages: UIMessage[] = messages.map((msg: Record<string, unknown>) => {
    if (msg.parts) return msg;
    return {
      ...msg,
      id: msg.id ?? crypto.randomUUID(),
      parts: [{ type: 'text' as const, text: typeof msg.content === 'string' ? msg.content : '' }],
    };
  });

  // Clean up message history — remove empty assistant messages and merge consecutive user messages
  const cleaned: UIMessage[] = [];
  for (const msg of uiMessages) {
    const text = msg.parts
      ?.filter((p: { type: string; text?: string }) => p.type === 'text')
      .map((p: { type: string; text?: string }) => p.text?.trim())
      .join('') || '';

    // Skip empty messages
    if (!text && msg.role === 'assistant') continue;

    // Merge consecutive user messages
    const last = cleaned[cleaned.length - 1];
    if (msg.role === 'user' && last?.role === 'user') {
      const lastText = last.parts
        ?.filter((p: { type: string; text?: string }) => p.type === 'text')
        .map((p: { type: string; text?: string }) => p.text)
        .join('') || '';
      last.parts = [{ type: 'text' as const, text: `${lastText}\n${text}` }];
      continue;
    }

    cleaned.push(msg);
  }

  const modelMessages = await convertToModelMessages(cleaned);

  const result = streamText({
    model: openrouter('google/gemini-2.0-flash-001'),
    system: getSystemPrompt(clientTime, clientTimezone),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(20),
    maxOutputTokens: 16384,
    onFinish: async ({ text }) => {
      // Save assistant response to DB
      if (text) {
        saveMessage({
          role: 'assistant',
          content: text,
          userId: resolvedOwner.userId,
          guestId: resolvedOwner.guestId,
        }).catch(() => {});
      }
    },
  });

  return result.toUIMessageStreamResponse();
};
