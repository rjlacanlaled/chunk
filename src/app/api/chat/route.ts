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
  const { messages, owner }: { messages: UIMessage[]; owner: any } = body;

  const resolvedOwner = owner ?? { guestId: 'anonymous' };
  const tools = makeTaskTools(resolvedOwner);

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openrouter('google/gemini-2.0-flash-001'),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(10),
    maxOutputTokens: 4096,
  });

  return result.toUIMessageStreamResponse();
};
