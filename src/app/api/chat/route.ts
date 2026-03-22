import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { makeTaskTools } from '@/lib/ai/tools';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

function extractContent(msg: any): string {
  if (typeof msg.content === 'string') return msg.content;
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('');
  }
  return '';
}

export const POST = async (req: Request) => {
  const body = await req.json();
  const { messages, owner } = body;

  const resolvedOwner = owner ?? { guestId: 'anonymous' };
  const tools = makeTaskTools(resolvedOwner);

  const coreMessages = messages.map((msg: any) => ({
    role: msg.role as 'user' | 'assistant',
    content: extractContent(msg),
  })).filter((msg: any) => msg.content);

  const result = streamText({
    model: openrouter('google/gemini-2.0-flash-001'),
    system: SYSTEM_PROMPT,
    messages: coreMessages,
    tools,
    maxSteps: 5,
    maxTokens: 4096,
  });

  return result.toUIMessageStreamResponse();
};
