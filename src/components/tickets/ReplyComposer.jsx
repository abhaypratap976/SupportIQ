import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { aiService } from '../../services/aiService.js';
import { Send, Lock, Globe, AlertCircle, FileText, Sparkles } from 'lucide-react';

export const ReplyComposer = forwardRef(function ReplyComposer(
  { onSubmitMessage, disabled = false },
  ref
) {
  const { isCustomer } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public'); // 'public' | 'internal'
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expose method so parent / AI panel can insert draft
  useImperativeHandle(ref, () => ({
    insertText: (text) => {
      setContent(text);
      setError('');
      setVisibility('public'); // Default AI draft to public reply
    },
    getContent: () => content
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please type your message before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmitMessage({
        content: content.trim(),
        visibility: isCustomer ? 'public' : visibility
      });
      setContent('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all ${
        visibility === 'internal' && !isCustomer
          ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-100 shadow-sm'
          : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      {/* Mode Switcher Tabs (Staff Only) */}
      {!isCustomer ? (
        <div className="flex items-center border-b border-slate-100 bg-slate-50/70 p-1.5 rounded-t-xl gap-1">
          <button
            type="button"
            onClick={() => setVisibility('public')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              visibility === 'public'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Send Reply</span>
          </button>

          <button
            type="button"
            onClick={() => setVisibility('internal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              visibility === 'internal'
                ? 'bg-amber-100 text-amber-900 shadow-xs border border-amber-300'
                : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Add Private Note</span>
          </button>
        </div>
      ) : (
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Reply to Ticket
          </span>
          <span className="text-xs text-slate-400">
            Visible to Support Team
          </span>
        </div>
      )}

      {/* Internal Note Banner Warning */}
      {visibility === 'internal' && !isCustomer && (
        <div className="mx-4 mt-3 p-2.5 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 font-medium">
          <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Private note — only your team can see this.</strong> The customer will not see this note.
          </span>
        </div>
      )}

      {/* Text Area */}
      <form onSubmit={handleSubmit} className="p-4">
        <textarea
          rows={4}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError('');
          }}
          disabled={disabled || isSubmitting}
          placeholder={
            isCustomer
              ? 'Type your reply or additional information here...'
              : visibility === 'internal'
              ? 'Record internal investigation notes, reproduction steps, or escalation notes for fellow staff...'
              : 'Write a helpful, professional reply to the customer...'
          }
          className={`w-full p-3.5 text-sm rounded-xl border focus:outline-none transition-all ${
            visibility === 'internal' && !isCustomer
              ? 'bg-white border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
              : 'bg-white border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
          }`}
        />

        {error && (
          <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}

        {/* Action bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!isCustomer && content.trim() && (
              <div className="flex items-center gap-1 text-[11px] bg-slate-100/90 text-slate-700 px-2 py-1 rounded-lg">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span className="font-semibold text-slate-500">AI Tone:</span>
                <button
                  type="button"
                  disabled={isSubmitting || disabled}
                  onClick={async () => {
                    const res = await aiService.rephraseResponse(content, 'Empathetic');
                    setContent(res);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 hover:text-indigo-600 font-medium border border-slate-200 transition-colors"
                >
                  Empathetic
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || disabled}
                  onClick={async () => {
                    const res = await aiService.rephraseResponse(content, 'Concise');
                    setContent(res);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 hover:text-indigo-600 font-medium border border-slate-200 transition-colors"
                >
                  Concise
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || disabled}
                  onClick={async () => {
                    const res = await aiService.rephraseResponse(content, 'Formal');
                    setContent(res);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 hover:text-indigo-600 font-medium border border-slate-200 transition-colors"
                >
                  Formal
                </button>
              </div>
            )}
            <span className="text-xs text-slate-400">Markdown supported</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant={visibility === 'internal' && !isCustomer ? 'warning' : 'primary'}
              size="sm"
              loading={isSubmitting}
              disabled={disabled || !content.trim()}
              icon={visibility === 'internal' && !isCustomer ? Lock : Send}
            >
              {visibility === 'internal' && !isCustomer
                ? 'Add Private Note'
                : 'Send Reply'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
});
