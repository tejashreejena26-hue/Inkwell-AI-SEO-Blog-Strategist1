import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { 
  PenTool, 
  Sparkles, 
  History, 
  Copy, 
  Check, 
  Trash2, 
  ChevronRight,
  Loader2,
  FileText,
  Settings,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BlogRequest, BlogDraft } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SYSTEM_INSTRUCTION = `You are an expert Content Strategist and SEO Copywriter. Your goal is to produce blog drafts that are indistinguishable from high-quality human writing.

Step-by-Step Task:
1. Analyze: Identify the search intent behind the topic (Informational, Navigational, or Transactional).
2. Outline: Create a structure using Markdown headers (#, ##, ###).
3. Draft: Write the content section-by-section. Use short sentences, transition words, and bullet points for readability.
4. SEO Check: Naturally integrate the provided keywords. Do not 'keyword stuff.'
5. Formatting: Bold key takeaways and use a blockquote for a 'Pro Tip' in each section.

Constraint: Avoid AI clichés like 'In the ever-evolving digital landscape' or 'In conclusion.' Start with a punchy hook.`;

export default function App() {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('Professional');
  const [wordCount, setWordCount] = useState(800);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<string | null>(null);
  const [history, setHistory] = useState<BlogDraft[]>([]);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'editor' | 'history'>('editor');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('blog_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('blog_history', JSON.stringify(history));
  }, [history]);

  const generateBlog = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    setCurrentDraft(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Topic: ${topic}\nKeywords: ${keywords}\nTone: ${tone}\nWord Count: ${wordCount}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const content = response.text || "Failed to generate content.";
      setCurrentDraft(content);
      
      const newDraft: BlogDraft = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        request: { topic, keywords, tone, wordCount },
        content
      };
      
      setHistory(prev => [newDraft, ...prev]);
    } catch (error) {
      console.error("Generation error:", error);
      setCurrentDraft("An error occurred while generating the blog post. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (currentDraft) {
      navigator.clipboard.writeText(currentDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const loadFromHistory = (draft: BlogDraft) => {
    setTopic(draft.request.topic);
    setKeywords(draft.request.keywords);
    setTone(draft.request.tone);
    setWordCount(draft.request.wordCount);
    setCurrentDraft(draft.content);
    setView('editor');
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <header className="border-b border-ink/10 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white">
              <PenTool size={18} />
            </div>
            <h1 className="font-serif text-xl font-bold tracking-tight">Inkwell AI</h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-ink/5 p-1 rounded-full">
            <button 
              onClick={() => setView('editor')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                view === 'editor' ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
              )}
            >
              Strategist
            </button>
            <button 
              onClick={() => setView('history')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                view === 'history' ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
              )}
            >
              History
              {history.length > 0 && (
                <span className="bg-accent/10 text-accent text-[10px] px-1.5 rounded-full">
                  {history.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          {view === 'editor' ? (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Sidebar Controls */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 text-accent">
                    <Settings size={18} />
                    <h2 className="text-xs font-bold uppercase tracking-widest">Strategy Configuration</h2>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Topic / Headline</label>
                      <textarea 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. The Future of Sustainable Architecture"
                        className="w-full bg-ink/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-accent/20 min-h-[100px] resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Target Keywords</label>
                      <input 
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="keyword1, keyword2, keyword3"
                        className="w-full bg-ink/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-accent/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Tone</label>
                        <select 
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          className="w-full bg-ink/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-accent/20"
                        >
                          <option>Professional</option>
                          <option>Conversational</option>
                          <option>Authoritative</option>
                          <option>Witty</option>
                          <option>Empathetic</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Word Count</label>
                        <input 
                          type="number"
                          value={wordCount}
                          onChange={(e) => setWordCount(parseInt(e.target.value))}
                          className="w-full bg-ink/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={generateBlog}
                      disabled={isGenerating || !topic}
                      className="w-full bg-accent text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Strategizing...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Generate Draft
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-accent/5 border border-accent/10 rounded-2xl p-6">
                  <h3 className="font-serif font-bold text-accent mb-2">Pro Tip</h3>
                  <p className="text-sm text-accent/80 leading-relaxed italic">
                    "Great SEO content isn't just about keywords; it's about answering the user's intent better than anyone else on the first page."
                  </p>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-8">
                <div className="bg-white border border-ink/10 rounded-2xl min-h-[600px] flex flex-col shadow-sm overflow-hidden">
                  <div className="border-b border-ink/5 px-6 py-4 flex items-center justify-between bg-white/50">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-ink/40" />
                      <span className="text-xs font-semibold text-ink/40 uppercase tracking-widest">Draft Output</span>
                    </div>
                    {currentDraft && (
                      <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 text-xs font-medium text-ink/60 hover:text-accent transition-colors"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy Markdown'}
                      </button>
                    )}
                  </div>

                  <div className="flex-1 p-8 lg:p-12 overflow-y-auto max-h-[800px]" ref={scrollRef}>
                    {isGenerating ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent" size={24} />
                        </div>
                        <div>
                          <p className="font-serif text-xl font-medium">Crafting your masterpiece...</p>
                          <p className="text-sm text-ink/40 mt-1">Analyzing search intent and structuring headers</p>
                        </div>
                      </div>
                    ) : currentDraft ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="markdown-body"
                      >
                        <ReactMarkdown>{currentDraft}</ReactMarkdown>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20 grayscale">
                        <PenTool size={64} className="mb-4" />
                        <p className="font-serif text-2xl">Your draft will appear here</p>
                        <p className="text-sm max-w-xs mt-2">Configure your strategy on the left and click generate to begin.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-4"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-serif text-3xl font-bold">Draft Archive</h2>
                  <p className="text-ink/50 mt-1">Review and restore your previous content strategies.</p>
                </div>
                <div className="bg-ink/5 px-4 py-2 rounded-xl">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink/40">Total Drafts: {history.length}</span>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="bg-white border border-dashed border-ink/20 rounded-3xl p-20 text-center">
                  <History size={48} className="mx-auto mb-4 text-ink/20" />
                  <p className="text-xl font-serif text-ink/40">No history yet</p>
                  <button 
                    onClick={() => setView('editor')}
                    className="mt-4 text-accent font-semibold flex items-center gap-2 mx-auto hover:underline"
                  >
                    Start your first draft <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {history.map((item) => (
                    <motion.div 
                      layout
                      key={item.id}
                      className="group bg-white border border-ink/10 rounded-2xl p-6 hover:border-accent/30 hover:shadow-md transition-all cursor-pointer relative"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-serif text-xl font-bold group-hover:text-accent transition-colors line-clamp-1">
                            {item.request.topic}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-ink/40 font-medium uppercase tracking-wider">
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{item.request.tone}</span>
                            <span>•</span>
                            <span>{item.request.wordCount} words</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHistoryItem(item.id);
                            }}
                            className="p-2 text-ink/40 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div className="p-2 text-accent bg-accent/5 rounded-lg">
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.request.keywords.split(',').map((kw, i) => (
                          <span key={i} className="text-[10px] bg-ink/5 px-2 py-0.5 rounded-full text-ink/60 font-medium">
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-ink/5 py-8 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-ink/40">
            <Sparkles size={14} />
            <span className="text-xs font-medium uppercase tracking-widest">Powered by Gemini 3 Flash</span>
          </div>
          <p className="text-xs text-ink/30">
            © {new Date().getFullYear()} Inkwell AI. All drafts are generated using human-centric writing patterns.
          </p>
        </div>
      </footer>
    </div>
  );
}
