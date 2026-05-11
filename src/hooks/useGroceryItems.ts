import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export interface GroceryItem {
  id: string;
  grocery_list_id: string;
  ingredient_id: string | null;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  purchased: boolean;
  // Derived for display
  category?: string;
}

export interface GroceryList {
  id: string;
  family_id: string;
  meal_plan_id: string | null;
  estimated_cost: number | null;
  status: string;
  created_at: string;
}

export function useGroceryItems(familyId: string | null, isDemoMode: boolean) {
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (isDemoMode || !familyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Get latest grocery list for family
      const { data: listData } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (listData) {
        setGroceryList(listData);

        const { data: itemData, error: itemErr } = await supabase
          .from('grocery_items')
          .select(`
            *,
            ingredients ( name, category )
          `)
          .eq('grocery_list_id', listData.id);

        if (itemErr) throw itemErr;

        // Flatten ingredient category
        const normalized = (itemData ?? []).map((i: any) => ({
          ...i,
          item_name: i.item_name || i.ingredients?.name || 'Item',
          category: i.ingredients?.category ?? 'Other',
        }));

        setItems(normalized);
      } else {
        setGroceryList(null);
        setItems([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [familyId, isDemoMode]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const ensureList = async (): Promise<string> => {
    if (groceryList) return groceryList.id;
    if (!familyId) throw new Error('No family profile');

    const { data: newList, error: createErr } = await supabase
      .from('grocery_lists')
      .insert({ family_id: familyId, status: 'active' })
      .select()
      .single();
    if (createErr) throw createErr;
    setGroceryList(newList);
    return newList.id;
  };

  const addItem = async (itemName: string, category?: string) => {
    if (!familyId) throw new Error('No family profile');

    const listId = await ensureList();
    const tempId = `temp-${Date.now()}`;
    const optimistic: GroceryItem = {
      id: tempId, grocery_list_id: listId, ingredient_id: null,
      item_name: itemName, quantity: null, unit: null, purchased: false, category: category ?? 'Other',
    };
    setItems(prev => [...prev, optimistic]);

    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .insert({ grocery_list_id: listId, item_name: itemName, purchased: false })
        .select()
        .single();
      if (error) throw error;
      setItems(prev => prev.map(i => i.id === tempId ? { ...data, category: category ?? 'Other' } : i));
    } catch (err: any) {
      setItems(prev => prev.filter(i => i.id !== tempId));
      throw err;
    }
  };

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, purchased: !i.purchased } : i));
    const { error } = await supabase.from('grocery_items').update({ purchased: !item.purchased }).eq('id', id);
    if (error) setItems(prev => prev.map(i => i.id === id ? { ...i, purchased: item.purchased } : i));
  };

  const removeItem = async (id: string) => {
    const prev = [...items];
    setItems(i => i.filter(item => item.id !== id));
    const { error } = await supabase.from('grocery_items').delete().eq('id', id);
    if (error) setItems(prev);
  };

  // Group by category
  const categories = Array.from(new Set(items.map(i => i.category ?? 'Other')));
  const grouped = categories.map(cat => ({
    category: cat,
    items: items.filter(i => (i.category ?? 'Other') === cat),
  }));

  const totalItems = items.length;
  const checkedItems = items.filter(i => i.purchased).length;

  return { groceryList, items, grouped, isLoading, error, totalItems, checkedItems, addItem, toggleItem, removeItem, refetch: fetchItems };
}
