import { supabase } from './supabaseClient';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderAsc?: boolean;
  filterColumn?: string;
  filterValue?: any;
}

export const dbService = {
  async getAll(tableName: string, options?: QueryOptions) {
    let query = supabase.from(tableName).select('*', { count: 'exact' });

    if (options?.filterColumn && options?.filterValue !== undefined) {
      query = query.eq(options.filterColumn, options.filterValue);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderAsc ?? true });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  },

  async getById(tableName: string, id: string | number) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createRecord(tableName: string, data: any) {
    const { data: insertedData, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();
      
    if (error) throw error;
    return insertedData;
  },

  async updateRecord(tableName: string, id: string | number, data: any) {
    const { data: updatedData, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return updatedData;
  },

  async deleteRecord(tableName: string, id: string | number) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
};
