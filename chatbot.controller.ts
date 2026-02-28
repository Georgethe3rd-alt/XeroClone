import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('message')
  async chat(@Body() body: { message: string; history?: { role: string; content: string }[] }) {
    const settings = await this.prisma.settings.findFirst();
    if (!settings?.llm_api_key) {
      return { reply: 'No LLM API key configured. Go to Settings → LLM Provider to set one up.' };
    }

    // Gather system context
    const [postCounts, totalStories, totalSources, recentPosts] = await Promise.all([
      this.prisma.post.groupBy({ by: ['status'], _count: true }),
      this.prisma.story.count(),
      this.prisma.source.count(),
      this.prisma.post.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: { id: true, headline: true, status: true, category: true, created_at: true },
      }),
    ]);

    const statusSummary = postCounts.map((p: any) => `${p.status}: ${p._count}`).join(', ');
    const recentList = recentPosts.map((p: any) => `- [${p.status}] ${p.headline || 'Untitled'} (${p.category || 'General'})`).join('\n');

    const systemPrompt = `You are the LOOPVYBZ Admin Assistant — a helpful AI copilot embedded in the admin panel of a Caribbean news video platform.

Current system state:
- Posts by status: ${statusSummary || 'No posts yet'}
- Total stories ingested: ${totalStories}
- Active sources: ${totalSources}
- LLM: ${settings.llm_provider}/${settings.llm_model}
- Video: ${settings.video_provider}/${settings.video_model}
- Audio: ${settings.audio_provider}/${settings.audio_voice}

Recent posts:
${recentList || 'No posts yet'}

You can help admins with:
1. Understanding the system (how things work, what status means, etc.)
2. Suggesting actions ("you have 15 draft posts — want me to explain how to bulk generate?")
3. Answering questions about posts, stories, sources, settings
4. Giving tips on optimizing content (better headlines, video prompts, etc.)
5. Explaining errors and how to fix them

Be concise, helpful, and conversational. Use the system context above to give relevant answers.
If asked to perform an action you can't do directly, explain the steps to do it in the admin panel.
Keep responses short — 2-3 sentences max unless the question needs more detail.`;

    const messages = [
      ...(body.history || []).slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: body.message },
    ];

    try {
      let reply = '';

      if (settings.llm_provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': settings.llm_api_key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: settings.llm_model || 'claude-sonnet-4-20250514',
            max_tokens: 500,
            system: systemPrompt,
            messages,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { reply: `LLM error: ${(err as any).error?.message || res.status}` };
        }

        const data = await res.json();
        reply = (data as any).content?.[0]?.text || 'No response from LLM';
      } else if (settings.llm_provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.llm_api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: settings.llm_model || 'gpt-4',
            max_tokens: 500,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { reply: `LLM error: ${(err as any).error?.message || res.status}` };
        }

        const data = await res.json();
        reply = (data as any).choices?.[0]?.message?.content || 'No response from LLM';
      } else {
        return { reply: `The chatbot requires Anthropic or OpenAI as the LLM provider. Current provider: ${settings.llm_provider}` };
      }

      return { reply };
    } catch (e: any) {
      return { reply: `Error: ${e.message}` };
    }
  }
}
