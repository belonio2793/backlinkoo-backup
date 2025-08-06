/**
 * Schema Compatibility Helper
 * Handles differences between expected schema and actual database schema
 */

import { supabase } from '../integrations/supabase/client';

export interface TableInfo {
  tableName: string;
  exists: boolean;
  alternativeTable?: string;
}

export class SchemaCompatibility {
  private static tableCache = new Map<string, boolean>();

  /**
   * Check if a table exists in the database
   */
  static async tableExists(tableName: string): Promise<boolean> {
    if (this.tableCache.has(tableName)) {
      return this.tableCache.get(tableName)!;
    }

    try {
      const { error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(0);

      const exists = !error || !error.message.includes('does not exist');
      this.tableCache.set(tableName, exists);
      return exists;
    } catch {
      this.tableCache.set(tableName, false);
      return false;
    }
  }

  /**
   * Get the correct table name for premium subscriptions
   * Handles both 'premium_subscriptions' and 'subscribers' tables
   */
  static async getSubscriptionTableName(): Promise<string> {
    const premiumTableExists = await this.tableExists('premium_subscriptions');
    if (premiumTableExists) {
      return 'premium_subscriptions';
    }

    const subscribersTableExists = await this.tableExists('subscribers');
    if (subscribersTableExists) {
      return 'subscribers';
    }

    // Default fallback
    return 'subscribers';
  }

  /**
   * Get profiles with subscription data using the correct table
   */
  static async getProfilesWithSubscriptions(filters: {
    offset?: number;
    limit?: number;
    search?: string;
    role?: string;
  } = {}) {
    const subscriptionTable = await this.getSubscriptionTableName();
    
    console.log(`📋 Using subscription table: ${subscriptionTable}`);

    let query = supabase
      .from('profiles')
      .select(`
        *,
        ${subscriptionTable} (
          id,
          status,
          plan_type,
          current_period_end
        )
      `)
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 100) - 1);

    // Apply filters
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
    }

    if (filters.role && filters.role !== 'all') {
      query = query.eq('role', filters.role);
    }

    return query;
  }

  /**
   * Create or update subscription record using the correct table
   */
  static async upsertSubscription(subscriptionData: {
    user_id: string;
    status: string;
    plan_type?: string;
    current_period_end?: string;
    [key: string]: any;
  }) {
    const subscriptionTable = await this.getSubscriptionTableName();
    
    console.log(`📝 Upserting subscription to: ${subscriptionTable}`);

    return supabase
      .from(subscriptionTable)
      .upsert(subscriptionData);
  }

  /**
   * Clear table cache (useful for testing)
   */
  static clearCache(): void {
    this.tableCache.clear();
  }
}
