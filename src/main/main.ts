import "dotenv/config";
import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { AuthService } from "./services/auth.service.js";
import { SessionService } from "./services/session.service.js";
import { TokenStorage } from "./storage/token.storage.js";
import { AppService } from "./services/app.service.js";
import { SocketService } from "./services/socket.service.js";
import { UserService } from "./services/user.service.js";
import { AuthenticatedUser } from "../commom/interface/authenticated-user.interface.js";

type LoginResult =
  | {
      success: true;
      user: AuthenticatedUser;
    }
  | {
      success: false;
      message: string;
    };

const isDevelopment = !app.isPackaged;
const tokenStorage = new TokenStorage();

const sessionService = new SessionService(tokenStorage);

const authService = new AuthService(sessionService);

const appService = new AppService(authService, sessionService);

const socketService = new SocketService(sessionService);

const userService = new UserService(sessionService);

const createWindow = (): void => {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,

    webPreferences: {
      preload: path.join(import.meta.dirname, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDevelopment) {
    const webUrl = process.env.WEB_URL;

    if (!webUrl) {
      throw new Error("WEB_URL não definida.");
    }

    void window.loadURL(webUrl);
  } else {
    void window.loadFile(
      path.join(import.meta.dirname, "../renderer/index.html")
    );
  }
};

ipcMain.handle("ping", () => {
  return "pong from main";
});

ipcMain.handle(
  "auth:login",
  async (_event, email: string, password: string): Promise<LoginResult> => {
    try {
      await authService.login(email, password);

      const user = await authService.me();

      appService.setAuthenticatedUser(user);

      socketService.connect();

      return {
        success: true,
        user,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "E-mail ou senha incorretos."
      ) {
        return {
          success: false,
          message: error.message,
        };
      }

      throw error;
    }
  }
);

ipcMain.handle("auth:refresh", async () => {
  return authService.refresh();
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle("users:find-all", async () => {
  return userService.findAll();
});

ipcMain.handle(
  "socket:send-message",
  async (_event, receiverId: number, content: string) => {
    socketService.sendMessage(receiverId, content);
  }
);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle(
  "users:register",
  async (_event, name: string, email: string, password: string) => {
    return userService.create({
      name,
      email,
      password,
    });
  }
);

ipcMain.handle(
  "auth:verify-email",
  async (_event, email: string, code: string) => {
    await authService.verifyEmail({
      email,
      code,
    });
  }
);

ipcMain.handle("auth:resend-verification", async (_event, email: string) => {
  await authService.resendVerificationEmail({
    email,
  });
});

ipcMain.handle("auth:logout", async () => {
  socketService.disconnect();

  await appService.logout();

  return true;
});
