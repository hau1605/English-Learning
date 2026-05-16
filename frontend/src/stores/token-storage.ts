let accessToken: string | null = null;

export const tokenStorage = {
  getAccessToken: (): string | null => accessToken,

  setAccessToken: (token: string): void => {
    accessToken = token;
  },

  clearAccessToken: (): void => {
    accessToken = null;
  },

  hasAccessToken: (): boolean => {
    return accessToken !== null;
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    tokenStorage.clearAccessToken();
  });
}
