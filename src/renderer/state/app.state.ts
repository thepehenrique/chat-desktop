import { AuthenticatedUser } from "../../commom/interface/authenticated-user.interface.js";
import { ChatMessage } from "../interface/chat-message.interface.js";
import { User } from "../interface/user.interface.js";

export type CallStatus = "idle" | "calling" | "incoming" | "connected";
export class AppState {
  private authenticatedUser: AuthenticatedUser | null = null;

  private users: User[] = [];

  private selectedUser: User | null = null;

  private onlineUsers = new Set<number>();

  private messages: ChatMessage[] = [];

  private callStatus: CallStatus = "idle";

  private callUser: User | null = null;

  private unreadMessages = new Map<number, number>();

  private callStartedAt: number | null = null;

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

  incrementUnreadMessages(userId: number): void {
    const current = this.unreadMessages.get(userId) ?? 0;

    this.unreadMessages.set(userId, current + 1);
  }

  getUnreadMessages(userId: number): number {
    return this.unreadMessages.get(userId) ?? 0;
  }

  clearUnreadMessages(userId: number): void {
    this.unreadMessages.delete(userId);
  }

  setCallStartedAt(): void {
    this.callStartedAt = Date.now();
  }

  getCallStartedAt(): number | null {
    return this.callStartedAt;
  }

  setCallStatus(status: CallStatus): void {
    this.callStatus = status;
  }

  getCallStatus(): CallStatus {
    return this.callStatus;
  }

  setCallUser(user: User | null): void {
    this.callUser = user;
  }

  getCallUser(): User | null {
    return this.callUser;
  }

  clearCall(): void {
    this.callStatus = "idle";
    this.callUser = null;
    this.callStartedAt = null;
  }

  clear(): void {
    this.authenticatedUser = null;
    this.users = [];
    this.onlineUsers.clear();
    this.selectedUser = null;
    this.messages = [];
    this.clearCall();
  }
}
