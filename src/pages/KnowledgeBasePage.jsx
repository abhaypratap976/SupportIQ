import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import { ArticleCard } from '../components/knowledge-base/ArticleCard';
import { ArticleModal } from '../components/knowledge-base/ArticleModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { aiService } from '../services/aiService';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  X, 
  HelpCircle,
  FileQuestion,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export function KnowledgeBasePage() {
  const { 
    articles,
    filteredArticles, 
    categories, 
    searchQuery, 
    setSearchQuery, 
    categoryFilter, 
    setCategoryFilter, 
    deleteArticle 
  } = useArticles();
  const { isAdmin } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  // AI Q&A Assistant state
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Deletion modal state
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setIsModalOpen(true);
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (article) => {
    setArticleToDelete(article);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteArticle(articleToDelete.id);
      setArticleToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <span>Help Articles</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {filteredArticles.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search guides, setup instructions, and troubleshooting articles.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow transition-all group self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>+ New Article</span>
          </button>
        )}
      </div>

      {/* Ask SupportIQ AI Assistant Box */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl p-5 text-white shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/40 text-amber-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Ask SupportIQ AI Assistant</h3>
              <p className="text-[11px] text-indigo-200">Instant answers synthesized from help articles</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/20">
            Instant Answers
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && aiQuery.trim() && !isAiLoading) {
                setIsAiLoading(true);
                try {
                  const res = await aiService.askInstantHelp(aiQuery, articles);
                  setAiAnswer(res);
                } finally {
                  setIsAiLoading(false);
                }
              }
            }}
            placeholder="e.g. How do I recover lost MFA codes? or Why am I getting 504 timeouts?"
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-indigo-200/70 border border-indigo-400/30 focus:border-white focus:ring-1 focus:ring-white transition-all outline-none"
          />
          <button
            type="button"
            disabled={!aiQuery.trim() || isAiLoading}
            onClick={async () => {
              if (!aiQuery.trim()) return;
              setIsAiLoading(true);
              try {
                const res = await aiService.askInstantHelp(aiQuery, articles);
                setAiAnswer(res);
              } finally {
                setIsAiLoading(false);
              }
            }}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            {isAiLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </div>

        {/* AI Answer Card */}
        {aiAnswer && (
          <div className="mt-3 bg-white text-slate-800 rounded-xl p-4 text-xs space-y-2.5 animate-fade-in shadow-lg">
            <div className="flex items-center justify-between text-indigo-900 border-b border-slate-100 pb-2">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Synthesis ({aiAnswer.confidence}% confidence)</span>
              </span>
              <button
                type="button"
                onClick={() => setAiAnswer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-slate-700 whitespace-pre-line leading-relaxed font-normal">
              {aiAnswer.answer}
            </div>

            {aiAnswer.matchedArticle && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Source Documentation:</span>
                <Link
                  to={`/knowledge-base/${aiAnswer.matchedArticle.id}`}
                  className="font-bold text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>{aiAnswer.matchedArticle.title}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, keywords, tags, or content..."
            className="w-full h-10 pl-10 pr-8 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No articles found"
          description="Try changing your search keywords or switching category filters."
          actionLabel="Clear filters"
          onAction={() => {
            setSearchQuery('');
            setCategoryFilter('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onEdit={handleEdit}
              onDelete={handleDeletePrompt}
            />
          ))}
        </div>
      )}

      {/* Article Create/Edit Modal */}
      <ArticleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        articleToEdit={editingArticle}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(articleToDelete)}
        onClose={() => setArticleToDelete(null)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Knowledge Article"
        message={`Are you sure you want to permanently delete "${articleToDelete?.title}"? This cannot be undone.`}
        confirmText="Yes, Delete Article"
      />
    </div>
  );
}
