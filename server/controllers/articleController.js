import { Article, slugifyTitle } from '../models/Article.js';
import { logSecurityEvent } from '../models/AuditLog.js';

export const articleController = {
  /**
   * Get all articles with search and filtering
   * Customers ONLY see 'published' articles. Staff can see all.
   */
  async getArticles(req, res, next) {
    try {
      const { search, category, status } = req.query;
      const isStaff = req.user && (req.user.role === 'Admin' || req.user.role === 'Agent');

      const filter = {};

      if (!isStaff) {
        filter.status = 'published';
      } else if (status && status !== 'All') {
        filter.status = status;
      }

      if (category && category !== 'All') {
        filter.category = category;
      }

      if (search && search.trim()) {
        const q = search.trim();
        const searchRegex = new RegExp(q, 'i');
        filter.$or = [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex }
        ];
      }

      const articles = await Article.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      const formatted = articles.map(a => ({
        id: a.articleId,
        _id: a._id.toString(),
        articleId: a.articleId,
        title: a.title,
        slug: a.slug,
        category: a.category,
        tags: a.tags || [],
        summary: a.summary || (a.content ? a.content.substring(0, 140) + '...' : ''),
        content: a.content,
        author: a.authorName || 'Admin',
        status: a.status,
        helpfulCount: a.helpfulCount || 0,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }));

      return res.status(200).json(formatted);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get single article by articleId or slug
   */
  async getArticleById(req, res, next) {
    try {
      const { id } = req.params;
      const isStaff = req.user && (req.user.role === 'Admin' || req.user.role === 'Agent');

      const query = {
        $or: [
          { articleId: id },
          { slug: id }
        ]
      };

      if (!isStaff) {
        query.status = 'published';
      }

      const article = await Article.findOne(query);
      if (!article) {
        return res.status(404).json({ error: `Article not found or not published.` });
      }

      return res.status(200).json({
        id: article.articleId,
        _id: article._id.toString(),
        articleId: article.articleId,
        title: article.title,
        slug: article.slug,
        category: article.category,
        tags: article.tags || [],
        summary: article.summary,
        content: article.content,
        author: article.authorName || 'Admin',
        status: article.status,
        helpfulCount: article.helpfulCount || 0,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create new knowledge base article (Staff only)
   */
  async createArticle(req, res, next) {
    try {
      const { title, category, tags = [], content, status = 'published' } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Article title is required.' });
      }
      if (!category || !category.trim()) {
        return res.status(400).json({ error: 'Category is required.' });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Article content cannot be empty.' });
      }

      const articleId = await Article.generateNextArticleId();
      let baseSlug = slugifyTitle(title);
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await Article.exists({ slug: uniqueSlug })) {
        uniqueSlug = `${baseSlug}-${counter++}`;
      }

      const cleanTags = Array.isArray(tags)
        ? tags.map(t => String(t).trim()).filter(Boolean)
        : String(tags).split(',').map(t => t.trim()).filter(Boolean);

      const newArticle = new Article({
        articleId,
        title: title.trim(),
        slug: uniqueSlug,
        category: category.trim(),
        tags: cleanTags,
        content: content.trim(),
        summary: content.trim().substring(0, 140) + '...',
        author: req.user._id,
        authorName: req.user.name,
        status: ['published', 'draft', 'archived'].includes(status) ? status : 'published'
      });

      await newArticle.save();

      await logSecurityEvent({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'ARTICLE_CREATED',
        resourceType: 'Article',
        resourceId: newArticle.articleId,
        ip: req.ip
      });

      return res.status(201).json({
        id: newArticle.articleId,
        _id: newArticle._id.toString(),
        articleId: newArticle.articleId,
        title: newArticle.title,
        slug: newArticle.slug,
        category: newArticle.category,
        tags: newArticle.tags,
        summary: newArticle.summary,
        content: newArticle.content,
        author: newArticle.authorName,
        status: newArticle.status,
        helpfulCount: 0,
        createdAt: newArticle.createdAt,
        updatedAt: newArticle.updatedAt
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update article (Staff only)
   */
  async updateArticle(req, res, next) {
    try {
      const { id } = req.params;
      const { title, category, tags, content, status } = req.body;

      const query = {
        $or: [
          { articleId: id },
          { slug: id }
        ]
      };

      const article = await Article.findOne(query);
      if (!article) {
        return res.status(404).json({ error: `Article ${id} not found.` });
      }

      if (title !== undefined && title.trim()) {
        article.title = title.trim();
        // Update slug if title changed
        const newSlug = slugifyTitle(title);
        if (newSlug !== article.slug) {
          let candidate = newSlug;
          let counter = 1;
          while (await Article.exists({ slug: candidate, _id: { $ne: article._id } })) {
            candidate = `${newSlug}-${counter++}`;
          }
          article.slug = candidate;
        }
      }

      if (category !== undefined && category.trim()) {
        article.category = category.trim();
      }

      if (content !== undefined && content.trim()) {
        article.content = content.trim();
        article.summary = content.trim().substring(0, 140) + '...';
      }

      if (tags !== undefined) {
        article.tags = Array.isArray(tags)
          ? tags.map(t => String(t).trim()).filter(Boolean)
          : String(tags).split(',').map(t => t.trim()).filter(Boolean);
      }

      if (status !== undefined && ['published', 'draft', 'archived'].includes(status)) {
        article.status = status;
      }

      article.updatedAt = new Date();
      await article.save();

      return res.status(200).json({
        id: article.articleId,
        _id: article._id.toString(),
        articleId: article.articleId,
        title: article.title,
        slug: article.slug,
        category: article.category,
        tags: article.tags,
        summary: article.summary,
        content: article.content,
        author: article.authorName,
        status: article.status,
        helpfulCount: article.helpfulCount,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete article (Admin only)
   */
  async deleteArticle(req, res, next) {
    try {
      const { id } = req.params;

      const query = {
        $or: [
          { articleId: id },
          { slug: id }
        ]
      };

      const article = await Article.findOneAndDelete(query);
      if (!article) {
        return res.status(404).json({ error: `Article ${id} not found.` });
      }

      await logSecurityEvent({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'ARTICLE_DELETED',
        resourceType: 'Article',
        resourceId: article.articleId,
        ip: req.ip
      });

      return res.status(200).json({ message: 'Article deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Upvote helpful count with vote abuse prevention
   */
  async markHelpful(req, res, next) {
    try {
      const { id } = req.params;
      const voterIdentifier = req.user ? req.user._id.toString() : req.ip;

      const query = {
        $or: [
          { articleId: id },
          { slug: id }
        ]
      };

      const article = await Article.findOne(query);
      if (!article) {
        return res.status(404).json({ error: 'Article not found.' });
      }

      // Check if already voted
      if (article.voters && article.voters.includes(voterIdentifier)) {
        return res.status(200).json({
          id: article.articleId,
          helpfulCount: article.helpfulCount,
          alreadyVoted: true,
          message: 'You have already marked this article as helpful.'
        });
      }

      article.helpfulCount = (article.helpfulCount || 0) + 1;
      article.voters.push(voterIdentifier);
      await article.save();

      return res.status(200).json({
        id: article.articleId,
        helpfulCount: article.helpfulCount,
        alreadyVoted: false
      });
    } catch (err) {
      next(err);
    }
  }
};
