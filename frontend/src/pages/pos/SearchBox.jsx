import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Tag, CornerDownLeft, PlusCircle } from 'lucide-react';
import MenuThumbnail from '../../components/MenuThumbnail';
import { formatCurrency } from '../../utils/formatters';
import { getMenuStatus, STATUS_DOT_CLASSES } from './posUtils';

export default function SearchBox({
  query,
  onQueryChange,
  menus,
  categories,
  onSelectMenu,
  onSelectCategory,
  inputRef,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const term = query.trim().toLowerCase();

  const { menuMatches, categoryMatches, suggestions } = useMemo(() => {
    if (!term) {
      return { menuMatches: [], categoryMatches: [], suggestions: [] };
    }

    const menuMatches = menus
      .filter((menu) => {
        const categoryName =
          menu.category?.name ||
          categories.find((cat) => String(cat.id) === String(menu.category_id))?.name ||
          '';
        return (
          menu.name.toLowerCase().includes(term) ||
          (menu.description || '').toLowerCase().includes(term) ||
          categoryName.toLowerCase().includes(term)
        );
      })
      .slice(0, 6);

    const categoryMatches = categories
      .filter((cat) => cat.id !== 'all' && cat.name.toLowerCase().includes(term))
      .slice(0, 3);

    return {
      menuMatches,
      categoryMatches,
      suggestions: [
        ...menuMatches.map((menu) => ({ type: 'menu', menu })),
        ...categoryMatches.map((category) => ({ type: 'category', category })),
      ],
    };
  }, [term, menus, categories]);

  const showDropdown = isFocused && term.length > 0 && !dismissed && suggestions.length > 0;

  useEffect(() => {
    setActiveIndex(0);
    setDismissed(false);
  }, [term]);

  const selectSuggestion = (suggestion) => {
    if (!suggestion) return;
    if (suggestion.type === 'menu') {
      onSelectMenu(suggestion.menu);
    } else {
      onSelectCategory(suggestion.category);
    }
    setDismissed(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setDismissed(false);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setDismissed(false);
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter' && showDropdown) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setDismissed(true);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="pos-search-suggestions"
        aria-autocomplete="list"
        aria-activedescendant={
          showDropdown ? `pos-search-option-${activeIndex}` : undefined
        }
        aria-label="Cari menu berdasarkan nama, deskripsi, atau kategori"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={() => {
          setIsFocused(true);
          setDismissed(false);
        }}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder="Cari kopi, makanan, cemilan..."
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-24 text-sm text-slate-700 transition-all placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/15"
      />

      <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {query ? (
          <button
            type="button"
            onClick={() => {
              onQueryChange('');
              inputRef.current?.focus();
            }}
            aria-label="Hapus pencarian"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline-flex">
            Ctrl K
          </kbd>
        )}
      </div>

      {showDropdown && (
        <div
          id="pos-search-suggestions"
          role="listbox"
          aria-label="Saran pencarian menu"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
        >
          {menuMatches.length > 0 && (
            <div className="border-b border-slate-100 p-1.5">
              <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menu
              </p>
              {menuMatches.map((menu, index) => {
                const status = getMenuStatus(menu);
                const isActive = activeIndex === index;
                return (
                  <button
                    key={`menu-${menu.id}`}
                    id={`pos-search-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectSuggestion({ type: 'menu', menu })}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                      isActive ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <MenuThumbnail
                        menu={menu}
                        categories={categories}
                        iconClassName="h-4 w-4 text-slate-400"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-slate-800">
                          {menu.name}
                        </span>
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            STATUS_DOT_CLASSES[status.tone]
                          }`}
                        />
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">
                        {formatCurrency(menu.price)} · {status.label}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-amber-700">
                      {status.disabled ? (
                        'Habis'
                      ) : (
                        <>
                          <PlusCircle className="h-3.5 w-3.5" />
                          Tambah
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {categoryMatches.length > 0 && (
            <div className="p-1.5">
              <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Kategori
              </p>
              {categoryMatches.map((category, categoryIndex) => {
                const index = menuMatches.length + categoryIndex;
                const isActive = activeIndex === index;
                return (
                  <button
                    key={`cat-${category.id}`}
                    id={`pos-search-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectSuggestion({ type: 'category', category })}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                      isActive ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Tag className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 text-xs font-semibold text-slate-700">
                      Lihat kategori “{category.name}”
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-3 py-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> Pilih
            </span>
            <span className="flex items-center gap-2">
              <span>↑ ↓ Navigasi</span>
              <span>Esc Tutup</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
