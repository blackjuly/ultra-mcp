// Type definitions for the tRPC API
// These are duplicated from the backend to avoid cross-compilation issues

export type StatsOverview = {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byProvider: Array<{
    provider: string;
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
  }>;
  last30Days: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
};

export type ConfigResponse = {
  openai?: {
    configured: boolean;
    apiKey?: string;
    baseURL?: string;
  };
  google?: {
    configured: boolean;
    apiKey?: string;
    baseURL?: string;
  };
  azure?: {
    configured: boolean;
    apiKey?: string;
    baseURL?: string;
  };
  xai?: {
    configured: boolean;
    apiKey?: string;
    baseURL?: string;
  };
  bailian?: {
    configured: boolean;
    apiKey?: string;
    baseURL?: string;
  };
};

export type Model = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

// AppRouter type - using any to avoid circular dependencies during build
// At runtime, the actual types are inferred from the backend
export type AppRouter = any;