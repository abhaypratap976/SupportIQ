import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useArticles } from '../../context/ArticleContext';
import { CATEGORIES } from '../../data/seedData';
import { aiService } from '../../services/aiService.js';
import { AlertCircle, Save, Plus } from 'lucide-react';

export function ArticleModal({ isOpen, onClose, articleToEdit = null }) {
  const { createArticle, updateArticle } = useArticles();

  const isEditing = Boolean(articleToEdit);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Account Access');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (articleToEdit) {
        setTitle(articleToEdit.title || '');
        setCategory(articleToEdit.category || 'Account Access');
        setTagsInput(Array.isArray(articleToEdit.tags) ? articleToEdit.tags.join(', ') : '');
        setContent(articleToEdit.content || '');
      } else {
        setTitle('');
        setCategory('Account Access');
        setTagsInput('');
        setContent('');
      }
      setErrors({});
    }
  }, [isOpen, articleToEdit]);

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Title is required';
    } else if (title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters';
    }

    if (!category) {
      errs.category = 'Category is required';
    }

    if (!content.trim()) {
      errs.content = 'Article content cannot be empty';
    } else if (content.trim().length < 20) {
      errs.content = 'Please write a more descriptive article (at least 20 characters)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean);

      if (isEditing) {
        updateArticle(articleToEdit.id, {
          title,
          category,
          tags,
          content
        });
      } else {
        createArticle({
          title,
          category,
          tags,
          content
        });
      }
      onClose();
    } catch {
      // Toast handles error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Knowledge Article' : 'Publish New Help Article'}
      subtitle={isEditing ? `Updating ${articleToEdit?.id}` : 'Share documentation and guides with customers and support team.'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Article Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full h-10 px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-xs transition-all ${
              errors.title
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            }`}
            placeholder="e.g. How to Configure Single Sign-On (SSO) with Okta"
          />
          {errors.title && (
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Category & Tags Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 pl-3.5 pr-8 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-xs transition-all"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Troubleshooting">Troubleshooting</option>
              <option value="Product Usage">Product Usage</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Search Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full h-10 px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-xs transition-all"
              placeholder="e.g. sso, okta, saml, security"
            />
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Article Content (Markdown supported) *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!title.trim()) {
                    setErrors({ title: 'Please enter a title first to guide the AI generator' });
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    const generated = await aiService.generateArticle(title, category);
                    setContent(generated.content);
                    if (!tagsInput.trim()) {
                      setTagsInput(generated.tags.join(', '));
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-xs"
              >
                <span>✨ AI Draft Guide</span>
              </button>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Markdown supported
              </span>
            </div>
          </div>
          <textarea
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full font-mono text-xs leading-relaxed p-3.5 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-xs transition-all ${
              errors.content
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            }`}
            placeholder="### Overview&#10;Write detailed instructions, troubleshooting steps, and prerequisites here..."
          />
          {errors.content && (
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.content}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            icon={isEditing ? Save : Plus}
          >
            {isEditing ? 'Save Changes' : 'Publish Article'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
