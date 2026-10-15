import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { Button } from '../common/Button';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  FileText, 
  Tag, 
  AlertTriangle, 
  MessageSquare, 
  Check, 
  CornerDownLeft, 
  RefreshCw,
  Info
} from 'lucide-react';

export function AIAssistantPanel({ ticket, onInsertDraft }) {
  const { updateCategory, updatePriority } = useTickets();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'category' | 'priority' | 'draft'
  const [loading, setLoading] = useState(false);

  // Results
  const [summaryData, setSummaryData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [priorityData, setPriorityData] = useState(null);
  const [draftData, setDraftData] = useState(null);

  // Editable draft state
  const [editableDraft, setEditableDraft] = useState('');

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const res = await aiService.summarizeTicket(ticket);
      setSummaryData(res);
      setActiveTab('summary');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestCategory = async () => {
    setLoading(true);
    try {
      const res = await aiService.suggestCategory(ticket);
      setCategoryData(res);
      setActiveTab('category');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestPriority = async () => {
    setLoading(true);
    try {
      const res = await aiService.suggestPriority(ticket);
      setPriorityData(res);
      setActiveTab('priority');
    } finally {
      setLoading(false);
    }
  };

  const handleDraftResponse = async () => {
    setLoading(true);
    try {
      const res = await aiService.draftResponse(ticket, currentUser.name);
      setDraftData(res);
      setEditableDraft(res.draft);
      setActiveTab('draft');
    } finally {
      setLoading(false);
    }
  };

  const applyCategory = (newCategory) => {
    updateCategory(ticket.id, newCategory);
    if (categoryData) {
      setCategoryData({ ...categoryData, isMatch: true, currentCategory: newCategory });
    }
  };

  const applyPriority = (newPriority) => {
    updatePriority(ticket.id, newPriority);
    if (priorityData) {
      setPriorityData({ ...priorityData, isMatch: true, currentPriority: newPriority });
    }
  };

  return (
    <div className="bg-gradient-to-b from-indigo-50/50 via-white to-white rounded-xl border border-indigo-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>SupportIQ Triage Assistant</span>
              <span className="text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                Rule-Based Suggestions
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium" title="Rule-based suggestions require human review and never execute privileged actions automatically.">
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Requires Human Review</span>
        </div>
      </div>

      {/* Action buttons toolbar */}
      <div className="p-3 border-b border-slate-100 bg-white grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={handleSummarize}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all ${
            activeTab === 'summary' && summaryData
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Summarize</span>
        </button>

        <button
          type="button"
          onClick={handleSuggestCategory}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all ${
            activeTab === 'category' && categoryData
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Category</span>
        </button>

        <button
          type="button"
          onClick={handleSuggestPriority}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all ${
            activeTab === 'priority' && priorityData
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Priority</span>
        </button>

        <button
          type="button"
          onClick={handleDraftResponse}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all ${
            activeTab === 'draft' && draftData
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Draft Reply</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-4 bg-white min-h-[140px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
            <p className="text-xs font-medium">Analyzing ticket context with AI heuristics...</p>
          </div>
        ) : !summaryData && !categoryData && !priorityData && !draftData ? (
          <div className="text-center py-6 text-slate-500">
            <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">AI Assistance Ready</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              Select an action above to generate a summary, category recommendation, priority assessment, or draft reply.
            </p>
          </div>
        ) : (
          <div>
            {/* 1. Summary View */}
            {activeTab === 'summary' && summaryData && (
              <div className="space-y-3 animate-fade-in text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="font-semibold text-slate-900 leading-relaxed">
                    {summaryData.executiveSummary}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Key Context Points
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {summaryData.keyPoints.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                  <span>Suggested Next Action: <strong className="text-slate-800">{summaryData.nextAction}</strong></span>
                </div>
              </div>
            )}

            {/* 2. Category Suggestion View */}
            {activeTab === 'category' && categoryData && (
              <div className="space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Recommended Category:</span>
                    <span className="font-bold text-slate-900 text-sm">{categoryData.suggestedCategory}</span>
                    <span className="text-[10px] text-emerald-700 font-medium ml-2">
                      ({categoryData.confidence}% confidence)
                    </span>
                  </div>

                  {!categoryData.isMatch ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      onClick={() => applyCategory(categoryData.suggestedCategory)}
                    >
                      Apply Category
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" /> Already Applied
                    </span>
                  )}
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  <strong>Rationale:</strong> {categoryData.rationale}
                </p>
              </div>
            )}

            {/* 3. Priority Suggestion View */}
            {activeTab === 'priority' && priorityData && (
              <div className="space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Recommended Priority:</span>
                    <span className="font-bold text-slate-900 text-sm">{priorityData.suggestedPriority}</span>
                    <span className="text-[10px] text-emerald-700 font-medium ml-2">
                      ({priorityData.confidence}% confidence)
                    </span>
                  </div>

                  {!priorityData.isMatch ? (
                    <Button
                      variant="warning"
                      size="sm"
                      icon={Check}
                      onClick={() => applyPriority(priorityData.suggestedPriority)}
                    >
                      Apply Priority
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" /> Already Applied
                    </span>
                  )}
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  <strong>Rationale:</strong> {priorityData.rationale}
                </p>
              </div>
            )}

            {/* 4. Draft Response View */}
            {activeTab === 'draft' && draftData && (
              <div className="space-y-3 animate-fade-in text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      AI Generated Draft (Review &amp; Edit Before Sending)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Editable
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={editableDraft}
                    onChange={(e) => setEditableDraft(e.target.value)}
                    className="w-full text-xs font-normal p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 bg-white transition-all"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleDraftResponse}
                    className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={CornerDownLeft}
                    onClick={() => onInsertDraft && onInsertDraft(editableDraft)}
                  >
                    Insert into Reply Composer
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
