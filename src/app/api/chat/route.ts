import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { makeTaskTools } from '@/lib/ai/tools';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const POST = async (req: Request) => {
  const { messages, owner } = await req.json();

  const tools = makeTaskTools(owner ?? { guestId: 'anonymous' });

  const result = streamText({
    model: openrouter('google/gemini-flash-1.5'),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
};
