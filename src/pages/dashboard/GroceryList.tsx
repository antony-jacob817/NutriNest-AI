import { useState } from 'react';
import { Plus, Check, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
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

  // Demo state (local only, not persisted)
  const [demoList] = useState(
    groceryList.map(c => ({
      category: c.category,
      items: c.items.map(i => ({ id: i, item_name: i, purchased: false })),
    }))
  );

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    if (isDemoMode) { setNewItemName(''); return; }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grocery List</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{displayChecked} of {displayTotal} items checked</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
          <ShoppingBag size={16} className="text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{displayTotal - displayChecked} remaining</span>
        </div>
      </div>

      {/* Add Item */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Add Item</h3>
        <div className="flex gap-3 flex-wrap">
          <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Greek yogurt"
            className="flex-1 min-w-[160px] px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button onClick={handleAdd} disabled={isAdding || !newItemName.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
            {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}
            Add
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-emerald-500" size={28} />
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl border-gray-200 dark:border-gray-800 text-gray-500">
          <div className="text-4xl mb-3">🛒</div>
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Your grocery list is empty</p>
          <p className="text-sm">Add items above to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayList.map(cat => (
            <div key={cat.category} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{cat.category}</h3>
                <span className="text-xs text-gray-400">
                  {cat.items.filter(i => i.purchased).length}/{cat.items.length}
                </span>
              </div>
              <ul className="space-y-2">
                {cat.items.map(item => (
                  <li key={item.id} className="flex items-center gap-3 group">
                    <button
                      onClick={() => !isDemoMode && toggleItem(item.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.purchased ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 dark:border-gray-600'}`}
                    >
                      {item.purchased && <Check size={12} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className={`flex-1 text-sm transition-colors ${item.purchased ? 'line-through text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                      {item.item_name}
                    </span>
                    {!isDemoMode && (
                      <button onClick={() => removeItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
