export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL!,
  TIMEOUT: 30000,
  ENDPOINTS: {
    AUTH: '/auth',
    USER: '/users',
    PROPERTIES: '/properties',
  }
} as const; 

export const SITE_CONFIG = {
  name: 'Agent-Ready Boilerplate',
  description: 'A premium foundation for Next.js projects.',
  url: 'https://example.com',
} as const;
