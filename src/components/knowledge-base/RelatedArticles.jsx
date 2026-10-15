import React from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../../context/ArticleContext';
import { BookOpen, ExternalLink, CornerDownLeft, Sparkles } from 'lucide-react';

export function RelatedArticles({ ticket, onInsertLink }) {
  const { getRecommendations } = useArticles();
  const recommended = getRecommendations(ticket);

  if (!recommended || recommended.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Recommended Help Articles</span>
        </h4>
        <span className="text-[10px] text-slate-400">
          Matched by {ticket.category}
        </span>
      </div>

      <div className="space-y-2">
        {recommended.map((art) => (
          <div
            key={art.id}
            className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Link
                  to={`/knowledge-base/${art.id}`}
                  target="_blank"
                  className="text-xs font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1 transition-colors group"
                >
                  <span className="truncate">{art.title}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 flex-shrink-0" />
                </Link>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {art.summary}
                </p>
              </div>

              {onInsertLink && (
                <button
                  type="button"
                  title="Insert article reference into reply"
                  onClick={() => onInsertLink(`\n\nReference Article: [${art.title}](KB-${art.id})`)}
                  className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-white flex-shrink-0"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
