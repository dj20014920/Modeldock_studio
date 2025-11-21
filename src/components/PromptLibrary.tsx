
import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Copy, Check, Trash2, Plus, LayoutGrid, FileText, Terminal, PenTool, Briefcase, BookOpen, Zap, ArrowLeft, Save } from 'lucide-react';
import { PromptData, PromptCategory } from '../types';
import { SYSTEM_PROMPTS } from '../constants';
import { clsx } from 'clsx';

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (content: string) => void;
}

const CategoryIcons: Record<PromptCategory, React.ElementType> = {
  'General': LayoutGrid,
  'Coding': Terminal,
  'Writing': PenTool,
  'Analysis': FileText,
  'Creative': Sparkles,
  'Business': Briefcase,
  'Academic': BookOpen
};

const CATEGORY_OPTIONS: PromptCategory[] = ['General', 'Coding', 'Writing', 'Analysis', 'Creative', 'Business', 'Academic'];

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ isOpen, onClose, onSelectPrompt }) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [activeCategory, setActiveCategory] = useState<PromptCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<PromptCategory>('General');

  useEffect(() => {
    if (!isOpen) return;
    loadPrompts();
  }, [isOpen]);

  const loadPrompts = () => {
    const savedPromptsStr = localStorage.getItem('user_prompts');
    const savedPrompts: PromptData[] = savedPromptsStr ? JSON.parse(savedPromptsStr) : [];
    setPrompts([...SYSTEM_PROMPTS, ...savedPrompts]);
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // ... (existing state)

  const getSystemLanguage = () => {
    if (typeof navigator === 'undefined') return 'English';
    const lang = navigator.language.split('-')[0];
    const langMap: Record<string, string> = {
      'ko': 'Korean',
      'en': 'English',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ru': 'Russian',
      'it': 'Italian',
      'pt': 'Portuguese'
    };
    return langMap[lang] || 'English';
  };

  const processContent = (content: string) => {
    const lang = getSystemLanguage();
    return `${content}\n\nPlease respond in ${lang}.`;
  };

  const handleCopy = (e: React.MouseEvent, content: string, id: string) => {
    e.stopPropagation();
    const finalContent = processContent(content);
    navigator.clipboard.writeText(finalContent);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteUserPrompt = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('정말로 이 프롬프트를 삭제하시겠습니까?')) {
      const currentSaved = JSON.parse(localStorage.getItem('user_prompts') || '[]');
      const updated = currentSaved.filter((p: PromptData) => p.id !== id);
      localStorage.setItem('user_prompts', JSON.stringify(updated));
      loadPrompts(); // Reload merged list
    }
  };

  const handleSavePrompt = () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPrompt: PromptData = {
      id: `user-${Date.now()}`,
      title: newTitle,
      description: newDesc || '설명 없음',
      content: newContent,
      category: newCategory,
      isSystem: false
    };

    const currentSaved = JSON.parse(localStorage.getItem('user_prompts') || '[]');
    const updated = [...currentSaved, newPrompt];
    localStorage.setItem('user_prompts', JSON.stringify(updated));

    loadPrompts();
    resetForm();
    setView('list');
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewContent('');
    setNewCategory('General');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-[90%] max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar (Always visible or contextual?) - Let's keep it static for List view */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col p-4">
          <div className="mb-6 px-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles size={18} />
              </div>
              <span>Prompt Library</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium pl-1 flex items-center gap-1">
              <Zap size={10} className="text-amber-500" />
              Output: {getSystemLanguage()}
            </div>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1 scrollbar-hide">
            {view === 'list' ? (
              <>
                <button
                  onClick={() => setActiveCategory('All')}
                  className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeCategory === 'All' ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <LayoutGrid size={16} />
                  전체 보기
                </button>

                {Object.entries(CategoryIcons).map(([cat, Icon]) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as PromptCategory)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      activeCategory === cat ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <Icon size={16} />
                    {cat}
                  </button>
                ))}
              </>
            ) : (
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-xs text-indigo-800 leading-relaxed">
                <h4 className="font-bold mb-1 flex items-center gap-1"><Info size={12} /> 작성 팁</h4>
                <p>LLM은 영어 지시를 더 정확하게 이해합니다. 프롬프트 본문은 영어로 작성하고, UI 제목은 한국어로 적는 것을 추천합니다.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            {view === 'list' ? (
              <button
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                onClick={() => setView('create')}
              >
                <Plus size={16} />
                프롬프트 추가
              </button>
            ) : (
              <button
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                onClick={() => {
                  setView('list');
                  resetForm();
                }}
              >
                <ArrowLeft size={16} />
                목록으로
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white">

          {view === 'list' ? (
            <>
              {/* List View Header */}
              <div className="h-16 border-b border-slate-100 flex items-center px-6 gap-4 shrink-0 bg-white/80 backdrop-blur z-10">
                <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                  <input
                    type="text"
                    placeholder="프롬프트 검색 (제목, 설명, 내용)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="ml-auto text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">
                  {filteredPrompts.length}개의 프롬프트
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* List Grid */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                  {filteredPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="group relative bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
                      onClick={() => {
                        onSelectPrompt(processContent(prompt.content));
                        onClose();
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            prompt.isSystem ? "bg-slate-100 text-slate-600" : "bg-indigo-50 text-indigo-600"
                          )}>
                            {prompt.category}
                          </span>
                          {prompt.isSystem && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5" title="기본 제공 프롬프트">
                              <Sparkles size={10} /> System
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleCopy(e, prompt.content, prompt.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="영어 원문 복사"
                          >
                            {copiedId === prompt.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                          {!prompt.isSystem && (
                            <button
                              onClick={(e) => handleDeleteUserPrompt(e, prompt.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 mb-1.5 text-lg leading-tight">{prompt.title}</h3>
                      <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">{prompt.description}</p>

                      <div className="mt-auto space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          <span>Optimized English Prompt</span>
                          <span className="flex items-center gap-1 text-indigo-500"><Zap size={10} /> Korean Response</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 group-hover:border-indigo-100 transition-colors">
                          <code className="text-xs text-slate-500 font-mono block truncate opacity-70">
                            {prompt.content}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredPrompts.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Search size={24} className="opacity-50" />
                    </div>
                    <p>검색 결과가 없습니다.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Create View Header */}
              <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white">
                <h2 className="text-lg font-bold text-slate-800">새 프롬프트 추가</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Create Form */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                <div className="max-w-2xl mx-auto space-y-6">

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">제목 (한국어 권장)</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="예: 전문가 코드 리팩토링"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">카테고리</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as PromptCategory)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      >
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">설명 (선택)</label>
                      <input
                        type="text"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="이 프롬프트의 용도를 간단히 설명하세요."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700 block">프롬프트 내용 (영어 권장)</label>
                      <button
                        onClick={() => setNewContent(prev => prev + "\n\nPlease respond in Korean.")}
                        className="text-xs text-indigo-600 font-medium hover:underline"
                      >
                        + 한국어 응답 요청 추가
                      </button>
                    </div>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="You are an expert..."
                      rows={8}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                    />
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button
                      onClick={handleSavePrompt}
                      disabled={!newTitle.trim() || !newContent.trim()}
                      className={clsx(
                        "flex-1 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all shadow-sm",
                        (!newTitle.trim() || !newContent.trim())
                          ? "bg-slate-300 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md"
                      )}
                    >
                      <Save size={18} />
                      저장하기
                    </button>
                    <button
                      onClick={() => { setView('list'); resetForm(); }}
                      className="px-6 py-3 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                      취소
                    </button>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Icon
function Info({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
