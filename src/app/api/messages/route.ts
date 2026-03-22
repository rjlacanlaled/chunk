import { getRecentMessages } from '@/server/actions/messages';

export const POST = async (req: Request) => {
  const { owner } = await req.json();

  if (!owner?.userId && !owner?.guestId) {
    return Response.json([]);
  }

  const messages = await getRecentMessages(owner, 50);

  // Convert DB messages to UIMessage-like format for useChat initialMessages
  const uiMessages = messages.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: msg.content }],
    createdAt: msg.createdAt,
  }));

  return Response.json(uiMessages);
};
