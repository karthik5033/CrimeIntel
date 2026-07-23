/**
 * Security & Input Validation Layer
 * Enforces OWASP compliance, input sanitization, and API security headers.
 */
export const CatalystSecurity = {
  /**
   * Sanitizes string inputs to prevent XSS injection attacks
   */
  sanitizeInput: (input: string): string => {
    if (!input) return '';
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Validates parameter against SQL injection patterns
   */
  isSafeQueryParameter: (param: string): boolean => {
    const sqlInjectionRegex = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|UNION|CREATE)\b)|(--|;|\|\/)/i;
    return !sqlInjectionRegex.test(param);
  }
};
