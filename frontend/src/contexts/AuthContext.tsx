import React, { createContext, useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "student" | "guest";
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (requiredRole: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database - chỉ admin có thể đăng nhập
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin123",
    user: {
      id: "1",
      username: "admin",
      email: "admin@vov.edu.vn",
      role: "admin",
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user từ localStorage khi app khởi động
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Error loading saved user:", err);
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const mockUser = MOCK_USERS[username];

    if (!mockUser || mockUser.password !== password) {
      return false;
    }

    setUser(mockUser.user);
    localStorage.setItem("currentUser", JSON.stringify(mockUser.user));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const hasPermission = (requiredRole: string): boolean => {
    if (!user) return false;
    
    // Admin có quyền làm mọi thứ
    if (user.role === "admin") return true;
    
    // Kiểm tra từng role
    return user.role === requiredRole;
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
