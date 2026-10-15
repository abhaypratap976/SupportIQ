import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';

export const articleService = {
  async getAll() {
    try {
      const data = await apiClient.get('/articles');
      if (Array.isArray(data) && data.length > 0) return data;
      // Fallback to initial seed articles if database has no articles yet
      return storageService.getArticles();
    } catch {
      return storageService.getArticles();
    }
  },

  async getById(id) {
    try {
      const data = await apiClient.get(`/articles/${id}`);
      return data || null;
    } catch {
      const articles = storageService.getArticles();
      return articles.find(a => a.id === id || a.articleId === id || a.slug === id) || null;
    }
  },

  async search(query = '', category = 'All') {
    try {
      const data = await apiClient.get('/articles', {
        search: query.trim(),
        category: category !== 'All' ? category : undefined
      });
      if (Array.isArray(data)) return data;
    } catch {
      // Fallback
    }

    const articles = storageService.getArticles();
    const cleanQuery = query.toLowerCase().trim();

    return articles.filter(article => {
      const matchesCategory = category === 'All' || article.category === category;
      if (!matchesCategory) return false;

      if (!cleanQuery) return true;

      const titleMatch = article.title.toLowerCase().includes(cleanQuery);
      const contentMatch = article.content.toLowerCase().includes(cleanQuery);
      const tagMatch = Array.isArray(article.tags) && article.tags.some(tag => tag.toLowerCase().includes(cleanQuery));

      return titleMatch || contentMatch || tagMatch;
    });
  },

  async create({ title, category, tags = [], content, author = 'Admin' }) {
    if (!title || !title.trim()) throw new Error('Article title is required.');
    if (!category) throw new Error('Category is required.');
    if (!content || !content.trim()) throw new Error('Article content cannot be empty.');

    try {
      const data = await apiClient.post('/articles', {
        title: title.trim(),
        category,
        tags,
        content: content.trim()
      });
      return data;
    } catch (err) {
      if (err.status === 0) {
        const articles = storageService.getArticles();
        const highestNum = articles.reduce((max, a) => {
          const match = a.id.match(/KB-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
          }
          return max;
        }, 100);

        const nowIso = new Date().toISOString();
        const newArticle = {
          id: `KB-${highestNum + 1}`,
          title: title.trim(),
          category,
          tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean),
          summary: content.trim().substring(0, 140) + '...',
          content: content.trim(),
          author,
          helpfulCount: 0,
          createdAt: nowIso,
          updatedAt: nowIso
        };

        const updated = [newArticle, ...articles];
        storageService.saveArticles(updated);
        return newArticle;
      }
      throw err;
    }
  },

  async update(id, { title, category, tags, content }) {
    try {
      const data = await apiClient.put(`/articles/${id}`, {
        title,
        category,
        tags,
        content
      });
      return data;
    } catch (err) {
      if (err.status === 0) {
        const articles = storageService.getArticles();
        const index = articles.findIndex(a => a.id === id);
        if (index === -1) throw new Error(`Article ${id} not found.`);

        const existing = articles[index];
        const nowIso = new Date().toISOString();

        const updatedArticle = {
          ...existing,
          title: title !== undefined ? title.trim() : existing.title,
          category: category !== undefined ? category : existing.category,
          tags: tags !== undefined ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : existing.tags,
          content: content !== undefined ? content.trim() : existing.content,
          summary: content ? content.trim().substring(0, 140) + '...' : existing.summary,
          updatedAt: nowIso
        };

        articles[index] = updatedArticle;
        storageService.saveArticles(articles);
        return updatedArticle;
      }
      throw err;
    }
  },

  async delete(id) {
    try {
      await apiClient.delete(`/articles/${id}`);
      return true;
    } catch (err) {
      if (err.status === 0) {
        const articles = storageService.getArticles();
        const filtered = articles.filter(a => a.id !== id);
        storageService.saveArticles(filtered);
        return true;
      }
      throw err;
    }
  },

  async markHelpful(id) {
    try {
      const data = await apiClient.post(`/articles/${id}/helpful`);
      return data;
    } catch (err) {
      if (err.status === 0) {
        const articles = storageService.getArticles();
        const index = articles.findIndex(a => a.id === id);
        if (index === -1) return null;

        articles[index].helpfulCount = (articles[index].helpfulCount || 0) + 1;
        storageService.saveArticles(articles);
        return articles[index];
      }
      throw err;
    }
  },

  /**
   * Recommend relevant articles for a ticket based on category and keyword analysis
   */
  getRecommendationsForTicket(ticket, availableArticles = []) {
    if (!ticket) return [];
    const articles = availableArticles.length > 0 ? availableArticles : storageService.getArticles();
    const textToMatch = `${ticket.subject || ''} ${ticket.description || ''} ${ticket.category || ''}`.toLowerCase();

    const scored = articles.map(art => {
      let score = 0;
      if (art.category && ticket.category && art.category.toLowerCase() === ticket.category.toLowerCase()) {
        score += 5;
      }
      if (Array.isArray(art.tags)) {
        art.tags.forEach(tag => {
          if (textToMatch.includes(tag.toLowerCase())) {
            score += 3;
          }
        });
      }
      if (art.title) {
        const titleWords = art.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        titleWords.forEach(word => {
          if (textToMatch.includes(word)) {
            score += 2;
          }
        });
      }

      return { article: art, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.article)
      .slice(0, 3);
  }
};
