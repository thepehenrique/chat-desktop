import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  ping: (): Promise<string> => {
    return ipcRenderer.invoke("ping");
  },

  auth: {
    login: (email: string, password: string) => {
      return ipcRenderer.invoke("auth:login", email, password);
    },

    register: (
      name: string,
      email: string,
      password: string
    ): Promise<number> => {
      return ipcRenderer.invoke("users:register", name, email, password);
    },

    verifyEmail: (email: string, code: string): Promise<void> => {
      return ipcRenderer.invoke("auth:verify-email", email, code);
    },

    resendVerification: (email: string): Promise<void> => {
      return ipcRenderer.invoke("auth:resend-verification", email);
    },

    refresh: (): Promise<boolean> => {
      return ipcRenderer.invoke("auth:refresh");
    },

    logout: (): Promise<boolean> => {
      return ipcRenderer.invoke("auth:logout");
    },
  },

  socket: {
    onUserOnline: (
      callback: (data: { userId: number }) => void
    ): (() => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: { userId: number }
      ) => {
        callback(data);
      };

      ipcRenderer.on("socket:user-online", listener);

      return () => {
        ipcRenderer.removeListener("socket:user-online", listener);
      };
    },

    onUserOffline: (
      callback: (data: { userId: number }) => void
    ): (() => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: { userId: number }
      ) => {
        callback(data);
      };

      ipcRenderer.on("socket:user-offline", listener);

      return () => {
        ipcRenderer.removeListener("socket:user-offline", listener);
      };
    },

    onOnlineUsers: (
      callback: (data: { userIds: number[] }) => void
    ): (() => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: { userIds: number[] }
      ) => {
        callback(data);
      };

      ipcRenderer.on("socket:online-users", listener);

      return () => {
        ipcRenderer.removeListener("socket:online-users", listener);
      };
    },

    sendMessage: (receiverId: number, content: string): Promise<void> => {
      return ipcRenderer.invoke("socket:send-message", receiverId, content);
    },

    onNewMessage: (
      callback: (data: {
        senderId: number;
        receiverId: number;
        content: string;
      }) => void
    ): void => {
      ipcRenderer.on("socket:new-message", (_event, data) => {
        callback(data);
      });
    },
  },

  users: {
    findAll: () => {
      return ipcRenderer.invoke("users:find-all");
    },
  },
});
