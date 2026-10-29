import React, { useState } from 'react';
import { Menu, ChevronDown, Share2, Sparkles, SlidersHorizontal, Check } from 'lucide-react';

const Nav = ({ setIsMobileOpen }) => {
  const [model, setModel] = useState('NovaAI 4.0');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const models = [
    { name: 'NovaAI 4.0', desc: 'Fast & intelligent model for daily tasks' },
    { name: 'NovaAI Reasoning', desc: 'Advanced logic and deep problem solving' },
    { name: 'NovaAI Mini', desc: 'Lightweight & instant response model' },
  ];

  return (
    <header className="h-14 border-b border-zinc-800 bg-black/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30">
      {/* Left side: Mobile Toggle & Model Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsMobileOpen && setIsMobileOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          title="Toggle Menu"
        >
          <Menu size={20} />
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-200 hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-800"
          >
            <Sparkles size={16} className="text-white" />
            <span>{model}</span>
            <ChevronDown size={14} className="text-zinc-400" />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-20">
                {models.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => {
                      setModel(m.name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start justify-between ${
                      model === m.name
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{m.name}</div>
                      <div className="text-zinc-500 text-[11px] mt-0.5">{m.desc}</div>
                    </div>
                    {model === m.name && <Check size={14} className="text-white mt-1" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side Actions */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          title="Share Chat"
        >
          <Share2 size={18} />
        </button>
        <button
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          title="Settings"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>
    </header>
  );
};

export default Nav;