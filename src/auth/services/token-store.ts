/**
 * Token Store - In-Memory Access Token & Silent Refresh Timer Management
 *
 * Rules (PROMPT_FRONTEND.md):
 * - Access token is kept strictly in RAM (JS variable).
 * - NO localStorage, NO sessionStorage, NO manual cookie.
 * - Silent refresh timer scheduled (expiresIn - 60s).
 */

let inMemoryAccessToken: string | null = null;
let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

export const tokenStore = {
  /**
   * Get the current in-memory access token
   */
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  /**
   * Set or clear the in-memory access token
   */
  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
  },

  /**
   * Schedule pre-emptive silent refresh before token expiry
   * @param expiresIn Expiration time in seconds (from API response)
   * @param refreshCallback Async callback to execute refresh
   */
  scheduleSilentRefresh(
    expiresIn: number,
    refreshCallback: () => Promise<void>,
  ): void {
    // Clear any existing timer
    if (refreshTimerId) {
      clearTimeout(refreshTimerId);
      refreshTimerId = null;
    }

    // Refresh 60 seconds early to account for network latency & clock drift
    const bufferSeconds = 60;
    const delayMs = Math.max(0, (expiresIn - bufferSeconds) * 1000);

    refreshTimerId = setTimeout(() => {
      refreshTimerId = null;
      void refreshCallback();
    }, delayMs);
  },

  /**
   * Clear access token and cancel any scheduled refresh
   */
  clear(): void {
    inMemoryAccessToken = null;
    if (refreshTimerId) {
      clearTimeout(refreshTimerId);
      refreshTimerId = null;
    }
  },
};
