import { supabase } from '@/integrations/supabase/client';

export interface LiveUrl {
  id: string;
  campaign_id: string;
  domain_id?: string;
  domain_table_name?: string;
  source_url: string;
  target_url: string;
  anchor_text?: string;
  placement_type: string;
  content_snippet?: string;
  status: 'pending' | 'processing' | 'posted' | 'verified' | 'failed' | 'removed';
  verification_status: 'unverified' | 'verified' | 'broken' | 'redirect';
  posting_timestamp: string;
  verification_timestamp?: string;
  last_checked: string;
  response_time_ms?: number;
  http_status_code?: number;
  backlink_live: boolean;
  destination_match: boolean;
  sync_status: 'synced' | 'pending_sync' | 'sync_failed';
  ui_placements: string[];
  compute_cost: number;
  quality_score: number;
  authority_passed: number;
  created_at: string;
  updated_at: string;
}

export interface UrlSyncEvent {
  id: number;
  live_url_id: string;
  sync_event: 'created' | 'updated' | 'verified' | 'removed' | 'ui_refresh';
  ui_component: string;
  old_data?: any;
  new_data?: any;
  sync_timestamp: string;
  sync_duration_ms?: number;
  success: boolean;
  error_message?: string;
}

export interface UiPlacementSubscription {
  component: string;
  callback: (url: LiveUrl, event: UrlSyncEvent) => void;
  filters?: {
    campaign_id?: string;
    status?: string[];
    placement_type?: string[];
  };
}

export class LiveUrlSyncService {
  private static subscriptions = new Map<string, UiPlacementSubscription[]>();
  private static syncQueues = new Map<string, LiveUrl[]>();
  private static syncIntervals = new Map<string, NodeJS.Timeout>();
  private static realtimeSubscriptions = new Map<string, any>();

  // ==================== LIVE URL CRUD OPERATIONS ====================

  static async createLiveUrl(urlData: Omit<LiveUrl, 'id' | 'created_at' | 'updated_at'>): Promise<LiveUrl | null> {
    try {
      const { data, error } = await supabase
        .from('live_urls')
        .insert({
          ...urlData,
          ui_placements: urlData.ui_placements || [],
          posting_timestamp: urlData.posting_timestamp || new Date().toISOString(),
          last_checked: urlData.last_checked || new Date().toISOString(),
          sync_status: 'synced'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating live URL:', error);
        return null;
      }

      // Log sync event
      await this.logSyncEvent(data.id, 'created', 'system', null, data);

      // Notify UI components
      await this.notifyUiComponents(data, 'created');

      // Calculate and update compute cost
      await this.updateComputeCost(data.id, urlData.placement_type);

      return data;
    } catch (error) {
      console.error('Error in createLiveUrl:', error);
      return null;
    }
  }

  static async updateLiveUrl(
    urlId: string,
    updates: Partial<LiveUrl>,
    uiComponent: string = 'system'
  ): Promise<LiveUrl | null> {
    try {
      // Get current data for logging
      const { data: currentData } = await supabase
        .from('live_urls')
        .select('*')
        .eq('id', urlId)
        .single();

      // Update the URL
      const { data, error } = await supabase
        .from('live_urls')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          sync_status: 'synced'
        })
        .eq('id', urlId)
        .select()
        .single();

      if (error) {
        console.error('Error updating live URL:', error);
        return null;
      }

      // Log sync event
      await this.logSyncEvent(urlId, 'updated', uiComponent, currentData, data);

      // Notify UI components
      await this.notifyUiComponents(data, 'updated');

      return data;
    } catch (error) {
      console.error('Error in updateLiveUrl:', error);
      return null;
    }
  }

  static async verifyLiveUrl(
    urlId: string,
    verificationData: {
      verification_status: LiveUrl['verification_status'];
      http_status_code?: number;
      response_time_ms?: number;
      backlink_live?: boolean;
      destination_match?: boolean;
    }
  ): Promise<boolean> {
    try {
      const success = await this.updateLiveUrl(urlId, {
        ...verificationData,
        verification_timestamp: new Date().toISOString(),
        last_checked: new Date().toISOString()
      }, 'verification_system');

      if (success) {
        await this.logSyncEvent(urlId, 'verified', 'verification_system', null, verificationData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying live URL:', error);
      return false;
    }
  }

  static async deleteLiveUrl(urlId: string, uiComponent: string = 'system'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('live_urls')
        .delete()
        .eq('id', urlId);

      if (error) {
        console.error('Error deleting live URL:', error);
        return false;
      }

      // Log sync event
      await this.logSyncEvent(urlId, 'removed', uiComponent);

      return true;
    } catch (error) {
      console.error('Error in deleteLiveUrl:', error);
      return false;
    }
  }

  // ==================== UI PLACEMENT SUBSCRIPTION SYSTEM ====================

  static subscribeUiComponent(
    componentId: string,
    subscription: UiPlacementSubscription
  ): () => void {
    if (!this.subscriptions.has(componentId)) {
      this.subscriptions.set(componentId, []);
    }
    
    this.subscriptions.get(componentId)!.push(subscription);

    // Start real-time subscription if not exists
    this.startRealtimeSubscription(componentId);

    console.log(`📡 UI component ${componentId} subscribed to live URL sync`);

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(componentId);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
        }
        if (subs.length === 0) {
          this.subscriptions.delete(componentId);
          this.stopRealtimeSubscription(componentId);
        }
      }
    };
  }

  private static startRealtimeSubscription(componentId: string): void {
    if (this.realtimeSubscriptions.has(componentId)) return;

    const subscription = supabase
      .channel(`live_urls_${componentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_urls'
        },
        async (payload) => {
          await this.handleRealtimeChange(payload, componentId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'url_sync_log'
        },
        async (payload) => {
          await this.handleSyncLogChange(payload, componentId);
        }
      )
      .subscribe();

    this.realtimeSubscriptions.set(componentId, subscription);
  }

  private static stopRealtimeSubscription(componentId: string): void {
    const subscription = this.realtimeSubscriptions.get(componentId);
    if (subscription) {
      subscription.unsubscribe();
      this.realtimeSubscriptions.delete(componentId);
    }
  }

  private static async handleRealtimeChange(payload: any, componentId: string): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    try {
      let syncEvent: UrlSyncEvent['sync_event'];
      switch (eventType) {
        case 'INSERT': syncEvent = 'created'; break;
        case 'UPDATE': syncEvent = 'updated'; break;
        case 'DELETE': syncEvent = 'removed'; break;
        default: return;
      }

      const syncEventData: UrlSyncEvent = {
        id: Date.now(),
        live_url_id: newRecord?.id || oldRecord?.id,
        sync_event: syncEvent,
        ui_component: componentId,
        old_data: oldRecord,
        new_data: newRecord,
        sync_timestamp: new Date().toISOString(),
        success: true
      };

      await this.notifyUiComponents(newRecord || oldRecord, syncEvent, syncEventData);
    } catch (error) {
      console.error('Error handling realtime change:', error);
    }
  }

  private static async handleSyncLogChange(payload: any, componentId: string): Promise<void> {
    // Handle sync log events for detailed UI updates
    try {
      const syncLog = payload.new;
      if (syncLog.ui_component === componentId) {
        // Self-triggered event, skip to prevent loops
        return;
      }

      // Get the updated URL data
      const { data: urlData } = await supabase
        .from('live_urls')
        .select('*')
        .eq('id', syncLog.live_url_id)
        .single();

      if (urlData) {
        await this.notifyUiComponents(urlData, syncLog.sync_event, syncLog);
      }
    } catch (error) {
      console.error('Error handling sync log change:', error);
    }
  }

  private static async notifyUiComponents(
    url: LiveUrl,
    eventType: string,
    syncEvent?: UrlSyncEvent
  ): Promise<void> {
    for (const [componentId, subscriptions] of this.subscriptions.entries()) {
      for (const subscription of subscriptions) {
        try {
          // Check filters
          if (subscription.filters) {
            const { campaign_id, status, placement_type } = subscription.filters;
            
            if (campaign_id && url.campaign_id !== campaign_id) continue;
            if (status && !status.includes(url.status)) continue;
            if (placement_type && !placement_type.includes(url.placement_type)) continue;
          }

          // Update UI placements tracking
          if (eventType === 'created' || eventType === 'updated') {
            await this.updateUiPlacements(url.id, subscription.component, 'add');
          } else if (eventType === 'removed') {
            await this.updateUiPlacements(url.id, subscription.component, 'remove');
          }

          // Call the subscription callback
          subscription.callback(url, syncEvent || {
            id: Date.now(),
            live_url_id: url.id,
            sync_event: eventType as any,
            ui_component: subscription.component,
            sync_timestamp: new Date().toISOString(),
            success: true
          });

        } catch (error) {
          console.error(`Error notifying UI component ${subscription.component}:`, error);
        }
      }
    }
  }

  // ==================== UI PLACEMENTS TRACKING ====================

  private static async updateUiPlacements(
    urlId: string,
    component: string,
    action: 'add' | 'remove'
  ): Promise<void> {
    try {
      if (action === 'add') {
        // Add component to ui_placements array
        await supabase.rpc('add_ui_placement', {
          url_id: urlId,
          component_name: component
        });
      } else {
        // Remove component from ui_placements array
        await supabase.rpc('remove_ui_placement', {
          url_id: urlId,
          component_name: component
        });
      }
    } catch (error) {
      console.error('Error updating UI placements:', error);
    }
  }

  static async getUrlsForUiComponent(
    componentId: string,
    filters?: {
      campaign_id?: string;
      status?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<LiveUrl[]> {
    try {
      let query = supabase
        .from('live_urls')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filters?.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id);
      }

      if (filters?.status) {
        query = query.in('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching URLs for UI component:', error);
        return [];
      }

      // Update UI placements for fetched URLs
      for (const url of data || []) {
        await this.updateUiPlacements(url.id, componentId, 'add');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUrlsForUiComponent:', error);
      return [];
    }
  }

  // ==================== SYNC LOGGING ====================

  private static async logSyncEvent(
    liveUrlId: string,
    syncEvent: UrlSyncEvent['sync_event'],
    uiComponent: string,
    oldData?: any,
    newData?: any
  ): Promise<void> {
    try {
      await supabase
        .from('url_sync_log')
        .insert({
          live_url_id: liveUrlId,
          sync_event: syncEvent,
          ui_component: uiComponent,
          old_data: oldData,
          new_data: newData,
          sync_timestamp: new Date().toISOString(),
          success: true
        });
    } catch (error) {
      console.error('Error logging sync event:', error);
    }
  }

  // ==================== COMPUTE COST TRACKING ====================

  private static async updateComputeCost(
    urlId: string,
    placementType: string
  ): Promise<void> {
    try {
      // Get compute cost from cost matrix
      const { data: costData } = await supabase
        .from('compute_cost_matrix')
        .select('base_cost, hosting_factor')
        .eq('operation_type', 'content_posting')
        .eq('engine_type', placementType)
        .eq('difficulty_level', 'medium')
        .single();

      if (costData) {
        const computeCost = costData.base_cost * costData.hosting_factor;
        
        await supabase
          .from('live_urls')
          .update({ compute_cost: computeCost })
          .eq('id', urlId);
      }
    } catch (error) {
      console.error('Error updating compute cost:', error);
    }
  }

  // ==================== BATCH SYNC OPERATIONS ====================

  static async batchSyncUrls(
    urlIds: string[],
    uiComponent: string
  ): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const urlId of urlIds) {
      try {
        const success = await supabase.rpc('sync_url_data', {
          p_live_url_id: urlId,
          p_ui_component: uiComponent
        });

        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Error syncing URL ${urlId}:`, error);
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount };
  }

  static async forceSyncAllUrls(uiComponent: string): Promise<void> {
    try {
      // Mark all URLs as pending sync
      await supabase
        .from('live_urls')
        .update({ sync_status: 'pending_sync' })
        .neq('sync_status', 'synced');

      // Trigger batch sync
      const { data: urlIds } = await supabase
        .from('live_urls')
        .select('id')
        .eq('sync_status', 'pending_sync');

      if (urlIds) {
        await this.batchSyncUrls(
          urlIds.map(url => url.id),
          uiComponent
        );
      }
    } catch (error) {
      console.error('Error in forceSyncAllUrls:', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  static async getUrlSyncStatus(urlId: string): Promise<UrlSyncEvent[]> {
    try {
      const { data, error } = await supabase
        .from('url_sync_log')
        .select('*')
        .eq('live_url_id', urlId)
        .order('sync_timestamp', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching sync status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUrlSyncStatus:', error);
      return [];
    }
  }

  static async getUiComponentStats(componentId: string): Promise<{
    total_urls: number;
    synced_urls: number;
    pending_sync: number;
    failed_sync: number;
    last_sync: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('live_urls')
        .select('sync_status, updated_at')
        .contains('ui_placements', [componentId]);

      if (error) {
        console.error('Error fetching UI component stats:', error);
        return {
          total_urls: 0,
          synced_urls: 0,
          pending_sync: 0,
          failed_sync: 0,
          last_sync: null
        };
      }

      const stats = {
        total_urls: data.length,
        synced_urls: data.filter(url => url.sync_status === 'synced').length,
        pending_sync: data.filter(url => url.sync_status === 'pending_sync').length,
        failed_sync: data.filter(url => url.sync_status === 'sync_failed').length,
        last_sync: data.length > 0 ? 
          Math.max(...data.map(url => new Date(url.updated_at).getTime())) : null
      };

      return {
        ...stats,
        last_sync: stats.last_sync ? new Date(stats.last_sync).toISOString() : null
      };
    } catch (error) {
      console.error('Error in getUiComponentStats:', error);
      return {
        total_urls: 0,
        synced_urls: 0,
        pending_sync: 0,
        failed_sync: 0,
        last_sync: null
      };
    }
  }

  // ==================== CLEANUP ====================

  static cleanup(componentId: string): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.delete(componentId);
    this.stopRealtimeSubscription(componentId);

    // Clear sync queues
    this.syncQueues.delete(componentId);

    // Clear intervals
    const interval = this.syncIntervals.get(componentId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(componentId);
    }

    console.log(`🧹 Cleaned up live URL sync for component ${componentId}`);
  }

  static cleanupAll(): void {
    // Cleanup all subscriptions and intervals
    for (const componentId of this.subscriptions.keys()) {
      this.cleanup(componentId);
    }
  }
}

// Helper function to create PostgreSQL functions for UI placements
export const createUiPlacementFunctions = async () => {
  try {
    // Function to add UI placement
    await supabase.rpc('create_function', {
      function_sql: `
        CREATE OR REPLACE FUNCTION add_ui_placement(url_id UUID, component_name TEXT)
        RETURNS BOOLEAN AS $$
        BEGIN
          UPDATE live_urls 
          SET ui_placements = array_append(
            CASE 
              WHEN ui_placements IS NULL THEN '{}'::text[]
              ELSE ui_placements
            END,
            component_name
          )
          WHERE id = url_id 
          AND NOT (ui_placements @> ARRAY[component_name]);
          
          RETURN true;
        EXCEPTION WHEN OTHERS THEN
          RETURN false;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    // Function to remove UI placement
    await supabase.rpc('create_function', {
      function_sql: `
        CREATE OR REPLACE FUNCTION remove_ui_placement(url_id UUID, component_name TEXT)
        RETURNS BOOLEAN AS $$
        BEGIN
          UPDATE live_urls 
          SET ui_placements = array_remove(ui_placements, component_name)
          WHERE id = url_id;
          
          RETURN true;
        EXCEPTION WHEN OTHERS THEN
          RETURN false;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    console.log('✅ UI placement functions created successfully');
  } catch (error) {
    console.error('Error creating UI placement functions:', error);
  }
};
