import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { articleService } from '../services/articleService.js';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const ArticleContext = createContext(null);

export function ArticleProvider({ children }) {
  const { currentUser, isAdmin, isAgent } = useAuth();
  const { addToast } = useToast();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const reloadArticles = useCallback(async () => {
    try {
      const list = await articleService.getAll();
      setArticles(Array.isArray(list) ? list : []);
    } catch {
      // Keep existing list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadArticles();
  }, [reloadArticles, currentUser]);

  const categories = useMemo(() => {
    const set = new Set(articles.map(a => a.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const cleanQuery = searchQuery.toLowerCase().trim();

    return articles.filter(article => {
      const matchesCategory = categoryFilter === 'All' || article.category === categoryFilter;
      if (!matchesCategory) return false;

      if (!cleanQuery) return true;

      const titleMatch = article.title?.toLowerCase().includes(cleanQuery);
      const contentMatch = article.content?.toLowerCase().includes(cleanQuery);
      const tagMatch = Array.isArray(article.tags) && article.tags.some(tag => tag.toLowerCase().includes(cleanQuery));

      return titleMatch || contentMatch || tagMatch;
    });
  }, [articles, searchQuery, categoryFilter]);

  const createArticle = useCallback(async (data) => {
    if (!isAdmin && !isAgent) {
      addToast({
        message: 'Only support staff can publish new Knowledge Base articles.',
        type: 'warning'
      });
      throw new Error('Unauthorized');
    }

    try {
      const newArticle = await articleService.create({
        ...data,
        author: currentUser?.name || 'Admin'
      });
      await reloadArticles();
      addToast({
        message: `Article "${newArticle.title}" published successfully.`,
        type: 'success'
      });
      return newArticle;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to create article',
        type: 'error'
      });
      throw err;
    }
  }, [isAdmin, isAgent, currentUser?.name, reloadArticles, addToast]);

  const updateArticle = useCallback(async (id, data) => {
    if (!isAdmin && !isAgent) {
      addToast({
        message: 'Only support staff can edit Knowledge Base articles.',
        type: 'warning'
      });
      throw new Error('Unauthorized');
    }

    try {
      const updated = await articleService.update(id, data);
      await reloadArticles();
      addToast({
        message: `Article "${updated.title}" updated successfully.`,
        type: 'success'
      });
      return updated;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to update article',
        type: 'error'
      });
      throw err;
    }
  }, [isAdmin, isAgent, reloadArticles, addToast]);

  const deleteArticle = useCallback(async (id) => {
    if (!isAdmin) {
      addToast({
        message: 'Only Administrators can delete articles.',
        type: 'warning'
      });
      throw new Error('Unauthorized');
    }

    try {
      await articleService.delete(id);
      await reloadArticles();
      addToast({
        message: 'Article removed from Knowledge Desk.',
        type: 'info'
      });
      return true;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to delete article',
        type: 'error'
      });
      throw err;
    }
  }, [isAdmin, reloadArticles, addToast]);

  const markHelpful = useCallback(async (id) => {
    try {
      const updated = await articleService.markHelpful(id);
      await reloadArticles();
      addToast({
        message: updated?.alreadyVoted ? 'You have already marked this article as helpful.' : 'Thanks for your feedback!',
        type: 'success'
      });
      return updated;
    } catch {
      return null;
    }
  }, [reloadArticles, addToast]);

  const getRecommendations = useCallback((ticket) => {
    return articleService.getRecommendationsForTicket(ticket, articles);
  }, [articles]);

  return (
    <ArticleContext.Provider
      value={{
        articles,
        filteredArticles,
        categories,
        loading,
        searchQuery,
        setSearchQuery,
        categoryFilter,
        setCategoryFilter,
        createArticle,
        updateArticle,
        deleteArticle,
        markHelpful,
        getRecommendations,
        reloadArticles
      }}
    >
      {children}
    </ArticleContext.Provider>
  );
}

export function useArticles() {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
}
