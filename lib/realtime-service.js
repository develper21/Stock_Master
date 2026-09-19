import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

// Store active connections
const connections = new Map();

export class RealtimeService {
  constructor() {
    this.supabase = getSupabaseServiceClient();
    this.setupDatabaseListeners();
  }

  setupDatabaseListeners() {
    // Listen to stock_levels changes
    this.supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'stock_levels' 
        },
        (payload) => {
          this.broadcastToAll('stock_update', {
            type: 'stock_update',
            data: payload,
            timestamp: new Date().toISOString()
          });
        }
      )
      .subscribe();

    // Listen to stock_ledger changes
    this.supabase
      .channel('ledger-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'stock_ledger' 
        },
        (payload) => {
          this.broadcastToAll('ledger_update', {
            type: 'ledger_update',
            data: payload,
            timestamp: new Date().toISOString()
          });
        }
      )
      .subscribe();

    // Listen to receipts, deliveries, transfers
    ['receipts', 'deliveries', 'internal_transfers'].forEach(table => {
      this.supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table 
          },
          (payload) => {
            this.broadcastToAll('document_update', {
              type: 'document_update',
              table,
              data: payload,
              timestamp: new Date().toISOString()
            });
          }
        )
        .subscribe();
    });
  }

  addConnection(userId, response) {
    connections.set(userId, response);
    
    // Send initial connection message
    this.sendToUser(userId, {
      type: 'connected',
      message: 'Real-time connection established',
      timestamp: new Date().toISOString()
    });

    // Clean up on connection close
    if (typeof response.on === 'function') {
      response.on('close', () => {
        connections.delete(userId);
      });
    }
  }

  sendToUser(userId, data) {
    const connection = connections.get(userId);
    if (connection) {
      try {
        connection.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Failed to send to user:', userId, error);
        connections.delete(userId);
      }
    }
  }

  broadcastToAll(eventType, data) {
    connections.forEach((connection, userId) => {
      this.sendToUser(userId, data);
    });
  }

  broadcastToRole(role, data) {
    // Broadcast to all
    this.broadcastToAll(data.type, data);
  }
}

// Singleton instance
const realtimeService = new RealtimeService();

export function setupSSEConnection(userId, response) {
  // Set SSE headers if supported (Node.js ServerResponse)
  if (typeof response.writeHead === 'function') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
  }

  // Add connection to service
  realtimeService.addConnection(userId, response);

  // Send periodic keep-alive
  const keepAlive = setInterval(() => {
    try {
      response.write(': keep-alive\n\n');
    } catch (error) {
      clearInterval(keepAlive);
    }
  }, 30000);

  if (typeof response.on === 'function') {
    response.on('close', () => {
      clearInterval(keepAlive);
    });
  }
}

export function sendCustomNotification(userId, notification) {
  realtimeService.sendToUser(userId, {
    type: 'custom_notification',
    data: notification,
    timestamp: new Date().toISOString()
  });
}
