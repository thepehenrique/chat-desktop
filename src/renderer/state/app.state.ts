import { AuthenticatedUser } from "../../commom/interface/authenticated-user.interface.js";
import { ChatMessage } from "../interface/chat-message.interface.js";
import { User } from "../interface/user.interface.js";

export class AppState {
  private authenticatedUser: AuthenticatedUser | null = null;

  private users: User[] = [];

  private selectedUser: User | null = null;

  private onlineUsers = new Set<number>();

  private messages: ChatMessage[] = [];

  setAuthenticatedUser(user: AuthenticatedUser): void {
    this.authenticatedUser = user;
  }

  getAuthenticatedUser(): AuthenticatedUser | null {
    return this.authenticatedUser;
  }

  setUsers(users: User[]): void {
    this.users = users;
  }

  getUsers(): User[] {
    return this.users;
  }

  setUserOnline(userId: number): void {
    this.onlineUsers.add(userId);
  }

  setUserOffline(userId: number): void {
    this.onlineUsers.delete(userId);
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineUsers(): number[] {
    return Array.from(this.onlineUsers);
  }

  setOnlineUsers(userIds: number[]): void {
    this.onlineUsers = new Set(userIds);
  }

  setSelectedUser(user: User): void {
    this.selectedUser = user;
  }

  getSelectedUser(): User | null {
    return this.selectedUser;
  }

  addMessage(message: ChatMessage): void {
    this.messages.push(message);
  }

  getMessages(): ChatMessage[] {
    return this.messages;
  }

  clearSelectedUser(): void {
    this.selectedUser = null;
  }

  clear(): void {
    this.authenticatedUser = null;
    this.users = [];
    this.onlineUsers.clear();
    this.selectedUser = null;
    this.messages = [];
  }
}
