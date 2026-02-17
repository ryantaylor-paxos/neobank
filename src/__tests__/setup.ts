import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Minimal fetch polyfill for non-API tests (components, utils, store)
// API route tests mock their own fetch globally
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}
