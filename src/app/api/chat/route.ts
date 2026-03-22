import { streamText } from 'ai';
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

  const result = streamText({
    model: openrouter('google/gemini-2.0-flash-001'),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 5,
    maxTokens: 4096,
  });

  return result.toUIMessageStreamResponse();
};
