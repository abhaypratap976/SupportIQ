import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import { CategoryBadge } from '../components/common/Badge';
import { ArticleModal } from '../components/knowledge-base/ArticleModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatDateTime, calculateReadTime } from '../utils/formatters';
import { 
  ArrowLeft, 
  Clock, 
  ThumbsUp, 
  User, 
  Edit3, 
  Trash2, 
  Share2, 
  Check, 
  BookOpen, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export function ArticleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { articles, markHelpful, deleteArticle } = useArticles();
  const { isAdmin } = useAuth();

  const article = articles.find(a => a.id === id);

  const [hasVoted, setHasVoted] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!article) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Article Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The knowledge article you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/knowledge-base"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Help Articles</span>
        </Link>
      </div>
    );
  }

  const handleHelpful = () => {
    if (!hasVoted) {
      markHelpful(article.id);
      setHasVoted(true);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteArticle(article.id);
      navigate('/knowledge-base');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/knowledge-base')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Help Articles</span>
        </button>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Article</span>
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Article Container */}
      <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {article.id}
            </span>
            <CategoryBadge category={article.category} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Published by {article.author || 'Admin'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {calculateReadTime(article.content)}
            </span>
            <span>•</span>
            <span>Last updated {formatDateTime(article.updatedAt)}</span>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {article.content}
        </div>

        {/* Feedback Section */}
        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 p-5 rounded-xl">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Was this article helpful?</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {article.helpfulCount || 0} people found this guide helpful.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleHelpful}
              disabled={hasVoted}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                hasVoted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
              }`}
            >
              {hasVoted ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Thanks for your vote!</span>
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 text-slate-500" />
                  <span>Yes, it helped!</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>

      {/* Edit Modal */}
      <ArticleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        articleToEdit={article}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Article"
        message={`Are you sure you want to delete "${article.title}"?`}
      />
    </div>
  );
}
