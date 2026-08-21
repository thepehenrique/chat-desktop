import { app, safeStorage } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import { StoredTokens } from "../interface/stored-token.interface.js";

export class TokenStorage {
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath("userData"), "session.dat");
  }

  async save(refreshToken: string): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("O armazenamento seguro do sistema não está disponível.");
    }

    const encryptedToken = safeStorage.encryptString(refreshToken);

    const data: StoredTokens = {
      refreshToken: encryptedToken.toString("base64"),
    };

    await fs.mkdir(path.dirname(this.filePath), {
      recursive: true,
    });

    await fs.writeFile(this.filePath, JSON.stringify(data), {
      encoding: "utf-8",
      mode: 0o600,
    });
  }

  async load(): Promise<string | null> {
    if (!safeStorage.isEncryptionAvailable()) {
      return null;
    }

    try {
      const content = await fs.readFile(this.filePath, "utf-8");

      const data = JSON.parse(content) as StoredTokens;

      const encryptedToken = Buffer.from(data.refreshToken, "base64");

      return safeStorage.decryptString(encryptedToken);
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch {
      // Arquivo já não existe.
    }
  }
}
