import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { AuthService } from "./services/auth.service.js";
import { SessionService } from "./services/session.service.js";
import { TokenStorage } from "./storage/token.storage.js";
import { AppService } from "./services/app.service.js";
import { SocketService } from "./services/socket.service.js";
import { UserService } from "./services/user.service.js";

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
    void window.loadURL("http://localhost:5173");
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
  async (_event, email: string, password: string) => {
    await authService.login(email, password);

    const user = await authService.me();

    appService.setAuthenticatedUser(user);

    socketService.connect();

    return user;
  }
);

ipcMain.handle("auth:refresh", async () => {
  return authService.refresh();
});

app.whenReady().then(async () => {
  try {
    const user = await appService.initialize();

    if (user) {
      socketService.connect();
    }
  } catch (error) {
    console.error("Erro ao restaurar sessão:", error);
  }

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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("auth:logout", async () => {
  socketService.disconnect();

  await appService.logout();

  return true;
});
