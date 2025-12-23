'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// User type
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'pm' | 'supervisor';
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development - will be replaced with Firebase auth
const MOCK_USER: User = {
    id: '1',
    name: 'John Smith',
    email: 'admin@ifi.com',
    role: 'admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check for existing session (mock - uses localStorage)
        const storedUser = localStorage.getItem('ifi_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Route protection
        if (!isLoading) {
            const isAuthRoute = pathname?.startsWith('/login');

            if (!user && !isAuthRoute) {
                router.push('/login');
            } else if (user && isAuthRoute) {
                router.push('/dashboard');
            }
        }
    }, [user, isLoading, pathname, router]);

    const login = async (email: string, password: string): Promise<boolean> => {
        // Mock login - will be replaced with Firebase auth
        // For now, accept any email/password
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const userData: User = {
            ...MOCK_USER,
            email,
        };

        setUser(userData);
        localStorage.setItem('ifi_user', JSON.stringify(userData));
        setIsLoading(false);
        router.push('/dashboard');
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ifi_user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
