import React from 'react';
import { Pencil } from 'lucide-react';

interface WordSelectorProps {
  words: string[];
  onSelectWord: (word: string) => void;
}

export const WordSelector: React.FC<WordSelectorProps> = ({ words, onSelectWord }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg backdrop-blur-xl bg-slate-900/80 border border-slate-800 shadow-2xl rounded-3xl p-8 text-center flex flex-col items-center">
        {/* Animated header glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-[2px]"></div>

        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 mb-4 animate-bounce">
          <Pencil size={28} />
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Scegli la tua parola!
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          Seleziona una delle seguenti tre parole per iniziare a disegnare. Gli altri giocatori proveranno a indovinarla!
        </p>

        {/* Words Grid */}
        <div className="grid grid-cols-1 gap-4 w-full mt-8">
          {words.map((word) => (
            <button
              key={word}
              onClick={() => onSelectWord(word)}
              className="w-full text-left p-5 bg-slate-950 hover:bg-slate-850 border border-slate-800/80 hover:border-blue-500/40 rounded-2xl transition-all duration-200 group active:scale-[0.98] flex items-center justify-between"
            >
              <div>
                <span className="text-base font-extrabold tracking-wider text-slate-200 group-hover:text-blue-400 transition-colors">
                  {word}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                  Lunghezza: {word.length} lettere
                </span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-250 flex items-center gap-1.5 text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                Seleziona
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
