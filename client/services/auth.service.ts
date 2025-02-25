import { IUser } from '@/types/models/user.types';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: IUser;
    token: string;
  };
  error?: string;
}

export class AuthService {
  private static API_URL = 'http://localhost:3001/api';

  static async register(userData: RegisterInput): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store the token in localStorage
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to connect to the server');
    }
  }

  static async login(credentials: LoginInput): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store the token in localStorage
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to connect to the server');
    }
  }

  static async logout(): Promise<void> {
    localStorage.removeItem('token');
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
} 