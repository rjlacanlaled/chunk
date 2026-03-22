import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { makeTaskTools } from '@/lib/ai/tools';
import { saveMessage } from '@/server/actions/messages';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const POST = async (req: Request) => {
  const { messages, owner } = await req.json();

  const resolvedOwner = owner ?? { guestId: 'anonymous' };
  const tools = makeTaskTools(resolvedOwner);

  // Save the latest user message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'user') {
    await saveMessage({
      role: 'user',
      content: typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content),
      userId: resolvedOwner.userId,
      guestId: resolvedOwner.guestId,
    });
  }

  const result = streamText({
    model: openrouter('google/gemini-flash-1.5'),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 5,
    onFinish: async (event) => {
      await saveMessage({
        role: 'assistant',
        content: event.text || '',
        toolInvocations: event.content,
        userId: resolvedOwner.userId,
        guestId: resolvedOwner.guestId,
      });
    },
  });

  return result.toDataStreamResponse();
};
