/**
 * Unit Tests for Centralized OAuth Authentication Module
 * 
 * Tests the getSharedAccessToken() function which provides
 * centralized OAuth token management with caching for all Catalyst services.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Centralized OAuth Authentication', () => {
  // Store original environment variables and fetch
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    
    // Clear fetch mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    
    // Restore environment
    process.env = { ...originalEnv };
  });

  describe('Unit Test 1: Valid credentials should return access token', () => {
    it('should successfully generate and return an access token when all credentials are provided', async () => {
      // Dynamically import to get fresh module instance
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      // Mock the fetch API
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'mock_access_token_12345',
          expires_in: 3600
        })
      } as Response);

      process.env.CATALYST_CLIENT_ID = 'test_client_id';
      process.env.CATALYST_CLIENT_SECRET = 'test_client_secret';
      process.env.CATALYST_REFRESH_TOKEN = 'test_refresh_token';

      const token = await getSharedAccessToken();

      expect(token).toBe('mock_access_token_12345');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should handle OAuth response with all expected fields', async () => {
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'full_response_token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'ZohoCatalyst.functions.CREATE'
        })
      } as Response);

      process.env.CATALYST_CLIENT_ID = 'test_client_id';
      process.env.CATALYST_CLIENT_SECRET = 'test_client_secret';
      process.env.CATALYST_REFRESH_TOKEN = 'test_refresh_token';

      const token = await getSharedAccessToken();

      expect(token).toBe('full_response_token');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unit Test 2: Token caching should reduce API calls', () => {
    it('should return cached token on second call within 60 seconds', async () => {
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'cached_token_xyz',
          expires_in: 3600
        })
      } as Response);

      process.env.CATALYST_CLIENT_ID = 'test_client_id';
      process.env.CATALYST_CLIENT_SECRET = 'test_client_secret';
      process.env.CATALYST_REFRESH_TOKEN = 'test_refresh_token';

      const token1 = await getSharedAccessToken();
      expect(token1).toBe('cached_token_xyz');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const token2 = await getSharedAccessToken();
      expect(token2).toBe('cached_token_xyz');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(token1).toBe(token2);
    });

    it('should refresh token when cache expires', async () => {
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'expiring_token',
            expires_in: 30
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'refreshed_token',
            expires_in: 3600
          })
        } as Response);

      process.env.CATALYST_CLIENT_ID = 'test_client_id';
      process.env.CATALYST_CLIENT_SECRET = 'test_client_secret';
      process.env.CATALYST_REFRESH_TOKEN = 'test_refresh_token';

      const token1 = await getSharedAccessToken();
      expect(token1).toBe('expiring_token');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      await new Promise(resolve => setTimeout(resolve, 100));

      const token2 = await getSharedAccessToken();
      expect(token2).toBe('refreshed_token');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Unit Test 3: Missing credentials should throw clear error', () => {
    it('should throw error when CATALYST_CLIENT_ID is missing', async () => {
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      delete process.env.CATALYST_CLIENT_ID;
      process.env.CATALYST_CLIENT_SECRET = 'test_client_secret';
      process.env.CATALYST_REFRESH_TOKEN = 'test_refresh_token';

      await expect(getSharedAccessToken()).rejects.toThrow(
        /OAuth credentials not configured.*CATALYST_CLIENT_ID/
      );
    });

    it('should throw error when CATALYST_CLIENT_SECRET is missing', async () => {
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      process.env.CATALYST_CLIENT_ID = 'test_client_id';
      delete process.env.CATALYST_CLIENT_SECRET;
      process.env.CATALYST_REFRESH_TOKEN = 'test_refresh_token';

      await expect(getSharedAccessToken()).rejects.toThrow(
        /OAuth credentials not configured.*CATALYST_CLIENT_SECRET/
      );
    });

    it('should throw error when CATALYST_REFRESH_TOKEN is missing', async () => {
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      process.env.CATALYST_CLIENT_ID = 'test_client_id';
      process.env.CATALYST_CLIENT_SECRET = 'test_client_secret';
      delete process.env.CATALYST_REFRESH_TOKEN;

      await expect(getSharedAccessToken()).rejects.toThrow(
        /OAuth credentials not configured.*CATALYST_REFRESH_TOKEN/
      );
    });

    it('should throw error when all credentials are missing', async () => {
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      delete process.env.CATALYST_CLIENT_ID;
      delete process.env.CATALYST_CLIENT_SECRET;
      delete process.env.CATALYST_REFRESH_TOKEN;

      await expect(getSharedAccessToken()).rejects.toThrow(
        /OAuth credentials not configured/
      );
    });
  });

  describe('Unit Test 4: OAuth API error handling', () => {
    it('should throw error when OAuth API returns non-OK status', async () => {
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid refresh token'
      } as Response);

      process.env.CATALYST_CLIENT_ID = 'test_client_id';
      process.env.CATALYST_CLIENT_SECRET = 'test_client_secret';
      process.env.CATALYST_REFRESH_TOKEN = 'invalid_token';

      await expect(getSharedAccessToken()).rejects.toThrow(
        /OAuth token generation failed/
      );
    });

    it('should throw error when OAuth response contains error field', async () => {
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: 'invalid_grant'
        })
      } as Response);

      process.env.CATALYST_CLIENT_ID = 'test_client_id';
      process.env.CATALYST_CLIENT_SECRET = 'test_client_secret';
      process.env.CATALYST_REFRESH_TOKEN = 'expired_token';

      await expect(getSharedAccessToken()).rejects.toThrow(
        /Zoho OAuth Error.*invalid_grant/
      );
    });

    it('should throw error when OAuth response is missing access_token', async () => {
      vi.resetModules();
      const { getSharedAccessToken } = await import('./auth');
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          expires_in: 3600
        })
      } as Response);

      process.env.CATALYST_CLIENT_ID = 'test_client_id';
      process.env.CATALYST_CLIENT_SECRET = 'test_client_secret';
      process.env.CATALYST_REFRESH_TOKEN = 'test_token';

      await expect(getSharedAccessToken()).rejects.toThrow(
        /No access token in OAuth response/
      );
    });
  });
});
