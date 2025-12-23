// User storage for role-based access control
// Provides CRUD operations for user management

// Define UserRole type locally (same as AppRole from employee-storage)
export type UserRole = 'super-admin' | 'pm' | 'supervisor' | 'lead';

const USERS_KEY = 'ifi_users';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    employeeId?: string; // Optional link to employee
    assignedProjects: string[]; // Project IDs for supervisor/lead
    status: 'active' | 'inactive';
    tempPassword?: string; // Only for new users
    createdAt: string;
    lastLogin?: string;
}

// ==================== CRUD OPERATIONS ====================

export function getUsers(): User[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    // Initialize with sample data
    const sampleUsers = getSampleUsers();
    localStorage.setItem(USERS_KEY, JSON.stringify(sampleUsers));
    return sampleUsers;
}

export function getUserById(id: string): User | null {
    const users = getUsers();
    return users.find(u => u.id === id) || null;
}

export function getUserByEmail(email: string): User | null {
    const users = getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function saveUser(user: User): User {
    const users = getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);

    if (existingIndex >= 0) {
        users[existingIndex] = user;
    } else {
        users.push({
            ...user,
            id: user.id || crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        });
    }

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return existingIndex >= 0 ? users[existingIndex] : users[users.length - 1];
}

export function deleteUser(id: string): boolean {
    const users = getUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
    return true;
}

// ==================== HELPERS ====================

export function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export function getUsersForRole(role: UserRole): User[] {
    const users = getUsers();
    return users.filter(u => u.role === role && u.status === 'active');
}

export function getActiveUsers(): User[] {
    const users = getUsers();
    return users.filter(u => u.status === 'active');
}

// ==================== SAMPLE DATA ====================

function getSampleUsers(): User[] {
    // Try to get users from employee storage first (to ensure matching IDs)
    if (typeof window !== 'undefined') {
        const storedEmployees = localStorage.getItem('ifi_employees_v7');
        if (storedEmployees) {
            try {
                const employees = JSON.parse(storedEmployees);
                const appUsers = employees.filter((e: any) => e.hasAppAccess && e.appRole);

                if (appUsers.length > 0) {
                    return appUsers.map((e: any) => ({
                        id: e.id, // Use the SAME ID as employee
                        email: e.email,
                        name: e.name,
                        role: e.appRole, // Map appRole to role
                        assignedProjects: e.assignedProjects || [],
                        status: e.isActive ? 'active' : 'inactive',
                        createdAt: e.createdAt || new Date().toISOString(),
                    }));
                }
            } catch (err) {
                console.error('Failed to sync users from employees', err);
            }
        }
    }

    // Fallback to sample data if no employees found
    return [
        {
            id: 'user-001',
            email: 'bboothe@ind-fab.com',
            name: 'Barry Boothe',
            role: 'super-admin',
            assignedProjects: [],
            status: 'active',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'user-002',
            email: 'bevans@ind-fab.com',
            name: 'Bobby Evans',
            role: 'super-admin',
            assignedProjects: [],
            status: 'active',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'user-003',
            email: 'plandrum@ind-fab.com',
            name: 'Paige Landrum',
            role: 'pm',
            assignedProjects: [],
            status: 'active',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'user-004',
            email: 'sramos@ind-fab.com',
            name: 'Santiago Ramos',
            role: 'supervisor',
            assignedProjects: [],
            status: 'active',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'user-005',
            email: 'mmolina@ind-fab.com',
            name: 'Milton Molina',
            role: 'lead',
            assignedProjects: [],
            status: 'active',
            createdAt: new Date().toISOString(),
        },
    ];
}

// ==================== CURRENT USER (Mock) ====================

// For now, simulate a logged-in user. In production, this would come from Firebase Auth.
// NO DEFAULT HERE - rely on storage
// let currentUserEmail = 'bboothe@ind-fab.com'; 

export function getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    // 1. Get current email from storage (set by sidebar)
    const currentEmail = localStorage.getItem('ifi_current_user_email');
    if (!currentEmail) {
        // Fallback or default? Let's check fallback if no user logged in
        return getUserByEmail('bboothe@ind-fab.com'); // Legacy fallback
    }

    // 2. Try to find in employees (Source of Truth for IDs)
    try {
        const storedEmployees = localStorage.getItem('ifi_employees_v7');
        if (storedEmployees) {
            const employees = JSON.parse(storedEmployees);
            const employee = employees.find((e: any) => e.email.toLowerCase() === currentEmail.toLowerCase());

            if (employee && employee.hasAppAccess) {
                // Map Employee to User to ensure ID matches workflow
                return {
                    id: employee.id, // This is the UUID required for workflows!
                    email: employee.email,
                    name: employee.name,
                    role: employee.appRole, // Map appRole to UserRole
                    employeeId: employee.id, // Link back just in case
                    assignedProjects: employee.assignedProjects || [],
                    status: employee.isActive ? 'active' : 'inactive',
                    createdAt: employee.createdAt,
                    lastLogin: new Date().toISOString()
                };
            }
        }
    } catch (err) {
        console.error('Error resolving user from employees:', err);
    }

    // 3. Last resort: check legacy users list
    return getUserByEmail(currentEmail);
}

export function setCurrentUserEmail(email: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('ifi_current_user_email', email);
    }
}

export function getCurrentUserRole(): UserRole {
    const user = getCurrentUser();
    return user?.role || 'lead'; // Default to most restricted
}

export function isCurrentUserAssignedToProject(projectId: string): boolean {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === 'super-admin' || user.role === 'pm') return true;
    return user.assignedProjects.includes(projectId);
}

// ==================== REACT HOOKS ====================

import { useState, useEffect } from 'react';

export function useUser() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Initial load
        setUser(getCurrentUser());

        // Listen for storage changes
        const handleStorageChange = () => {
            setUser(getCurrentUser());
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return {
        user,
        role: user?.role,
        isAdmin: user?.role === 'super-admin',
        isPM: user?.role === 'pm',
        isSupervisor: user?.role === 'supervisor',
    };
}
