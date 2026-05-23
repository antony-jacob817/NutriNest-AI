import { useState, useRef, useEffect } from 'react';
import { Plus, Check, Trash2, ShoppingBag, Loader2, X, ChevronRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGroceryItems } from '../../hooks/useGroceryItems';
import { groceryList } from '../../data/mockData';

const CATEGORIES = ['Produce', 'Proteins', 'Grains', 'Dairy & Alternatives', 'Pantry', 'Other'];

export default function GroceryList() {
  const { isDemoMode, familyId } = useAuth();
  const { grouped, isLoading, totalItems, checkedItems, addItem, toggleItem, removeItem } = useGroceryItems(familyId, isDemoMode);

  const [newItemName, setNewItemName] = useState('');
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mobile Folder Category Modal State Manager
  const [selectedMobileCat, setSelectedMobileCat] = useState<any | null>(null);

  const [demoList, setDemoList] = useState(
    groceryList.map(c => ({
      category: c.category,
      items: c.items.map(i => ({ id: i, item_name: i, purchased: false })),
    }))
  );

  // Close custom dropdown when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    
    if (isDemoMode) {
      const updatedName = newItemName.trim();
      setDemoList(prev => prev.map(cat => {
        if (cat.category.toLowerCase().includes(selectedCat.toLowerCase().split(' ')[0])) {
          return {
            ...cat,
            items: [...cat.items, { id: updatedName, item_name: updatedName, purchased: false }]
          };
        }
        return cat;
      }));
      setNewItemName('');
      return;
    }

    setIsAdding(true);
    try {
      await addItem(newItemName.trim(), selectedCat);
      setNewItemName('');
    } catch (err) {
      console.error('Failed to add item', err);
    } finally {
      setIsAdding(false);
    }
  };

  const displayList = isDemoMode ? demoList : grouped;
  const displayTotal = isDemoMode
    ? demoList.reduce((s, c) => s + c.items.length, 0)
    : totalItems;
  const displayChecked = isDemoMode
    ? demoList.reduce((s, c) => s + c.items.filter(i => i.purchased).length, 0)
    : checkedItems;

  const activeMobileGroup = selectedMobileCat 
    ? displayList.find(c => c.category === selectedMobileCat.category) 
    : null;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Grocery List</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{displayChecked} of {displayTotal} items checked</p>
        </div>
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl self-start sm:self-auto">
          <ShoppingBag size={16} className="text-emerald-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">{displayTotal - displayChecked} remaining</span>
        </div>
      </div>

      {/* Add Item Form Wrapper */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Add Item</h3>
        
        <div className="grid grid-cols-12 sm:flex sm:flex-row gap-2.5 sm:gap-3">
          
          {/* CUSTOM STYLABLE DROPDOWN MENU */}
          <div className="col-span-5 sm:w-48 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-stone-50/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 text-[11px] sm:text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm overflow-hidden"
            >
              <span className="truncate">{selectedCat}</span>
              <ChevronDown size={14} className={`ml-1 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="py-1 max-h-60 overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCat(cat);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[11px] sm:text-xs transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/30 ${
                        selectedCat === cat 
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 font-bold' 
                          : 'text-gray-700 dark:text-gray-300 font-medium'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <input
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)} // FIXED CRASH HERE
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Greek yogurt"
            className="col-span-5 sm:flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0 shadow-sm"
          />
          
          <button 
            onClick={handleAdd} 
            disabled={isAdding || !newItemName.trim()}
            className="col-span-2 sm:w-auto justify-center px-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl flex items-center transition-colors flex-shrink-0 shadow-md shadow-emerald-600/10"
          >
            {isAdding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </div>
      </div>

      {/* Main Lists Presentation Track */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-emerald-500" size={28} />
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl border-gray-200 dark:border-gray-800 text-gray-500 px-4">
          <div className="text-4xl mb-3">🛒</div>
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1 text-sm sm:text-base">Your grocery list is empty</p>
          <p className="text-xs sm:text-sm">Add items above to get started.</p>
        </div>
      ) : (
        <>
          {/* MOBILE 2-COLUMN CATEGORIES STREAM */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            {displayList.map(cat => {
              const boughtCount = cat.items.filter(i => i.purchased).length;
              return (
                <div
                  key={cat.category}
                  onClick={() => setSelectedMobileCat(cat)}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col justify-between h-28 shadow-sm"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-xs truncate mb-1">{cat.category}</h3>
                    <p className="text-[10px] text-gray-400">
                      {cat.items.length === 0 ? 'No items' : `${cat.items.length} items listed`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-gray-800/40">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {boughtCount}/{cat.items.length} done
                    </span>
                    <ChevronRight size={12} className="text-gray-300" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP INTEGRATED LIST GRID CARD VIEW */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {displayList.map(cat => (
              <div key={cat.category} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 w-full">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-50 dark:border-gray-800/40">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate pr-2">{cat.category}</h3>
                  <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {cat.items.filter(i => i.purchased).length}/{cat.items.length}
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {cat.items.map(item => (
                    <li key={item.id} className="flex items-center justify-between gap-2.5 group w-full min-w-0">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          onClick={() => !isDemoMode && toggleItem(item.id)}
                          disabled={isDemoMode}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.purchased ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 dark:border-gray-600'} ${isDemoMode ? 'cursor-default opacity-80' : ''}`}
                        >
                          {item.purchased && <Check size={11} className="text-white" strokeWidth={3} />}
                        </button>
                        <span className={`flex-1 text-xs sm:text-sm transition-colors truncate ${item.purchased ? 'line-through text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.item_name}
                        </span>
                      </div>
                      {!isDemoMode && (
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MOBILE INTERACTIVE CATEGORY FOLDER DRAWER SHEET */}
      {activeMobileGroup && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setSelectedMobileCat(null)} />
          
          <div className="bg-white dark:bg-gray-900 w-full rounded-t-3xl p-5 shadow-2xl relative z-10 border-t border-gray-100 dark:border-gray-800 overflow-y-auto max-h-[80vh] animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-4" onClick={() => setSelectedMobileCat(null)} />
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{activeMobileGroup.category}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {activeMobileGroup.items.filter(i => i.purchased).length} of {activeMobileGroup.items.length} completed
                </p>
              </div>
              <button 
                onClick={() => setSelectedMobileCat(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-gray-800 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            {activeMobileGroup.items.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 italic">
                No items added in this category yet.
              </div>
            ) : (
              <ul className="space-y-4 py-2">
                {activeMobileGroup.items.map(item => (
                  <li key={item.id} className="flex items-center justify-between gap-3 w-full">
                    <div 
                      className={`flex items-center gap-3 flex-1 min-w-0 ${isDemoMode ? 'cursor-default' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (!isDemoMode) {
                          toggleItem(item.id);
                        }
                      }}
                    >
                      <button
                        disabled={isDemoMode}
                        className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.purchased ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 dark:border-gray-600'} ${isDemoMode ? 'opacity-80' : ''}`}
                      >
                        {item.purchased && <Check size={12} className="text-white" strokeWidth={3} />}
                      </button>
                      <span className={`text-sm flex-1 truncate ${item.purchased ? 'line-through text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}`}>
                        {item.item_name}
                      </span>
                    </div>

                    {!isDemoMode && (
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-400 p-1.5 flex-shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            
            <button
              onClick={() => setSelectedMobileCat(null)}
              className="w-full py-3 mt-6 bg-stone-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs"
            >
              Close Folder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}