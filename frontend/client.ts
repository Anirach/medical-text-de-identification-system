// API Client for NestJS backend

// Use relative paths - works with Vite proxy in dev and Vercel rewrites in production
const BASE_URL = import.meta.env.VITE_API_URL || '';

export interface User {
  id: string;
  email: string;
}

export interface MaskKeyword {
  id?: number;
  keyword: string;
  entityType: EntityType;
  userId?: string;
}

export type EntityType = "PERSON" | "DATE" | "LOCATION" | "ID" | "CONTACT" | "ORGANIZATION";
export type AnonymizationMethod = "redact" | "mask" | "generalize" | "pseudonymize";

export interface Entity {
  type: EntityType;
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface ProcessRequest {
  text: string;
  method: AnonymizationMethod;
  enabledEntityTypes: EntityType[];
  customMaskList?: MaskKeyword[];
}

export interface ProcessResponse {
  deidentifiedText: string;
  entities: Entity[];
  language: string;
  statistics: {
    totalEntities: number;
    byType: Record<EntityType, number>;
  };
}

export interface ValidateEntitiesRequest {
  text: string;
  regexEntities: Entity[];
  maskList: MaskKeyword[];
}

export interface ValidateEntitiesResponse {
  entities: Entity[];
}

async function fetchAPI<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

export const auth = {
  async signup(email: string, password: string): Promise<{ user: User }> {
    return fetchAPI('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async login(email: string, password: string): Promise<{ user: User }> {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<void> {
    await fetchAPI('/auth/logout', { method: 'POST' });
  },

  async getCurrentUser(): Promise<{ user?: User }> {
    return fetchAPI('/auth/me');
  },
};

export const deid = {
  async process(params: ProcessRequest): Promise<ProcessResponse> {
    return fetchAPI('/process', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async processWithLLM(params: ProcessRequest): Promise<ProcessResponse> {
    return fetchAPI('/process-with-llm', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async validateEntities(params: ValidateEntitiesRequest): Promise<ValidateEntitiesResponse> {
    return fetchAPI('/validate-entities', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async listMaskKeywords(): Promise<{ keywords: MaskKeyword[] }> {
    return fetchAPI('/mask-keywords');
  },

  async createMaskKeyword(params: { keyword: string; entityType: string }): Promise<{ keyword: MaskKeyword }> {
    return fetchAPI('/mask-keywords', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async updateMaskKeyword(params: { id: number; keyword: string; entityType: string }): Promise<void> {
    await fetchAPI(`/mask-keywords/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify({ keyword: params.keyword, entityType: params.entityType }),
    });
  },

  async deleteMaskKeyword(params: { id: number }): Promise<void> {
    await fetchAPI(`/mask-keywords/${params.id}`, { method: 'DELETE' });
  },
};

const client = {
  auth,
  deid,
};

export default client;
