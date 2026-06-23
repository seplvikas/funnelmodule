// Re-export funnel database functions for compatibility
// This allows controllers to use executeQuery while actually using the funnel database
export { executeFunnelQuery as executeQuery, getFunnelPool as getPool, isFunnelConnected } from './funnelDatabase';
