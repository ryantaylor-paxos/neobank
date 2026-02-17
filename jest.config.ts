import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss)$': '<rootDir>/src/__tests__/__mocks__/styleMock.ts',
    '^next/server$': '<rootDir>/src/__tests__/__mocks__/next-server.ts',
    '^next/navigation$': '<rootDir>/src/__tests__/__mocks__/next-navigation.ts',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
};

export default config;
