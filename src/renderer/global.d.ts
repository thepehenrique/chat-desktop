import { AuthenticatedUser } from "../commom/interface/authenticated-user.interface";
import { User } from "./interface/user.interface";

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>;

      auth: {
        login: (
          email: string,
          password: string
        ) => Promise<
          | {
              success: true;
              user: AuthenticatedUser;
            }
          | {
              success: false;
              message: string;
            }
        >;

        register: (
          name: string,
          email: string,
          password: string
        ) => Promise<number>;

        verifyEmail: (email: string, code: string) => Promise<void>;

        resendVerification: (email: string) => Promise<void>;

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

        sendMessage: (receiverId: number, content: string) => Promise<void>;

        onNewMessage: (
          callback: (data: {
            senderId: number;
            receiverId: number;
            content: string;
          }) => void
        ) => void;
      };

      users: {
        findAll: () => Promise<User[]>;
      };
    };
  }
}
