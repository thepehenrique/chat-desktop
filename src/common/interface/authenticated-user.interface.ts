export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  role: string;
}
