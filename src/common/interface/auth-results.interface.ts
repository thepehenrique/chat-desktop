import type { AuthenticatedUser } from "./authenticated-user.interface.js";

export type LoginResult =
  | {
      success: true;
      user: AuthenticatedUser;
    }
  | {
      success: false;
      message: string;
      emailNotVerified?: boolean;
    };

export type VerifyEmailResult =
  | { success: true }
  | { success: false; message: string };
