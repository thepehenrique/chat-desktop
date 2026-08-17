export {};

interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  role: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>;

      auth: {
        login: (email: string, password: string) => Promise<AuthenticatedUser>;

        refresh: () => Promise<boolean>;

        logout: () => Promise<boolean>;
      };

      socket: {
        onOnlineUsers: (
          callback: (data: { userIds: number[] }) => void
        ) => () => void;

        onUserOnline: (
          callback: (data: { userId: number }) => void
        ) => () => void;

        onUserOffline: (
          callback: (data: { userId: number }) => void
        ) => () => void;
      };

      users: {
        findAll: () => Promise<User[]>;
      };
    };
  }
}
