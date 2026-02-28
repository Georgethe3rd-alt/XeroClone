  async create(dto: CreatePostDto) {
    const story = await this.prisma.story.findUnique({ 
      where: { id: dto.story_id },
      include: { source: true }
    });
    if (!story) throw new NotFoundException('Story not found');

    const settings = await this.prisma.settings.findFirst();
    const defaultTone = settings?.defaultTone || 'STRAIGHT_NEWS';

    return this.prisma.post.create({
      data: {
        story_id: dto.story_id,
        tone: defaultTone,
        headline: story.title,
        caption: story.raw_text.slice(0, 300),
        category: 'General',
        tags: [],
        language: 'en',
        region: story.source?.region || '',
        status: 'DRAFT',
      },
      include: { story: true },
    });
  }
