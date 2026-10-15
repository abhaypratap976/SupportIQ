import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CategoryBadge } from '../common/Badge';
import { formatRelativeTime, calculateReadTime } from '../../utils/formatters';
import { BookOpen, ThumbsUp, Clock, Edit3, Trash2, ArrowRight } from 'lucide-react';

export function ArticleCard({ article, onEdit, onDelete }) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/knowledge-base/${article.id}`)}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top meta */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <CategoryBadge category={article.category} />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {calculateReadTime(article.content)}
            </span>
            <span>•</span>
            <span>Updated {formatRelativeTime(article.updatedAt)}</span>
          </div>
        </div>

        {/* Title & Summary */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
          {article.summary || article.content.substring(0, 140) + '...'}
        </p>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer & Admin Controls */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
            {article.helpfulCount || 0}
          </span>
          <span>By {article.author || 'Admin'}</span>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => onEdit(article)}
                title="Edit Article"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(article)}
                title="Delete Article"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <span className="text-indigo-600 group-hover:translate-x-0.5 transition-transform ml-1">
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
