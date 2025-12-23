// Employee type definition
export interface Employee {
    id: string;
    employeeId: string;
    name: string;
    classId: string;
    className: string;
    craftId: string;
    craftName: string;
    role: string; // Job title/position (Admin, PM, Supervisor, Lead, Worker)
    email: string;
    phone: string;
    photo: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    // App access fields
    appRole?: AppRole | null; // null = no app access (worker)
    hasAppAccess?: boolean;
    assignedProjects?: string[]; // Project IDs for supervisor/lead
}

// Job title roles (employee position)
export const EMPLOYEE_ROLES = [
    'Admin',
    'PM',
    'Supervisor',
    'Lead',
    'Worker',
] as const;

export type EmployeeRole = typeof EMPLOYEE_ROLES[number];

// App access roles (login permissions)
export const APP_ROLES = ['super-admin', 'pm', 'supervisor', 'lead'] as const;
export type AppRole = typeof APP_ROLES[number];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
    'super-admin': 'Super Admin',
    'pm': 'PM',
    'supervisor': 'Supervisor',
    'lead': 'Lead',
};

export const APP_ROLE_DESCRIPTIONS: Record<AppRole, string> = {
    'super-admin': 'Full access to everything',
    'pm': 'Full access, no delete/users',
    'supervisor': 'Forms on assigned projects',
    'lead': 'Limited forms on assigned projects',
};

export const APP_ROLE_ICONS: Record<AppRole, string> = {
    'super-admin': '👑',
    'pm': '📋',
    'supervisor': '🔧',
    'lead': '👷',
};

import { SAMPLE_EMPLOYEES } from './sample-data';

const STORAGE_KEY = 'ifi_employees_v7';

// Get all employees
export function getEmployees(): Employee[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        // Initialize with sample data if nothing is stored
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_EMPLOYEES));
        return SAMPLE_EMPLOYEES;
    }

    try {
        const employees = JSON.parse(stored);
        // Optional: Check if we have app roles, if not (old data), merge with sample data
        // This helps if the user already had data but it lacked the new fields
        // For simplicity in this fix, we'll just check if it's an empty array
        if (employees.length === 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_EMPLOYEES));
            return SAMPLE_EMPLOYEES;
        }
        return employees;
    } catch {
        // If error parsing, reset to sample data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_EMPLOYEES));
        return SAMPLE_EMPLOYEES;
    }
}

// Get employee by ID
export function getEmployeeById(id: string): Employee | null {
    const employees = getEmployees();
    return employees.find(e => e.id === id) || null;
}

// Get active employees only
export function getActiveEmployees(): Employee[] {
    return getEmployees().filter(e => e.isActive);
}

// Add new employee
export function addEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const employees = getEmployees();

    const newEmployee: Employee = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    employees.push(newEmployee);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    return newEmployee;
}

// Update employee
export function updateEmployee(id: string, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Employee | null {
    const employees = getEmployees();
    const index = employees.findIndex(e => e.id === id);

    if (index === -1) return null;

    employees[index] = {
        ...employees[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    return employees[index];
}

// Delete employee
export function deleteEmployee(id: string): boolean {
    const employees = getEmployees();
    const index = employees.findIndex(e => e.id === id);

    if (index === -1) return false;

    employees.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    return true;
}

// Toggle employee status
export function toggleEmployeeStatus(id: string): Employee | null {
    const employee = getEmployeeById(id);
    if (!employee) return null;

    return updateEmployee(id, { isActive: !employee.isActive });
}

// Search employees by name
export function searchEmployees(query: string): Employee[] {
    const employees = getEmployees();
    const lowerQuery = query.toLowerCase();
    return employees.filter(e =>
        e.name.toLowerCase().includes(lowerQuery) ||
        e.employeeId.toLowerCase().includes(lowerQuery)
    );
}

// ==================== APP ACCESS HELPERS ====================

// Get employees with app access
export function getEmployeesWithAppAccess(): Employee[] {
    return getEmployees().filter(e => e.hasAppAccess && e.appRole);
}

// Get employees by app role
export function getEmployeesByAppRole(role: AppRole): Employee[] {
    return getEmployees().filter(e => e.appRole === role && e.hasAppAccess);
}

// Get employees without app access (for assign modal)
export function getEmployeesWithoutAppAccess(): Employee[] {
    return getEmployees().filter(e => !e.hasAppAccess || !e.appRole);
}

// Grant app access to employee
export function grantAppAccess(
    employeeId: string,
    appRole: AppRole,
    assignedProjects: string[] = []
): Employee | null {
    return updateEmployee(employeeId, {
        appRole,
        hasAppAccess: true,
        assignedProjects: appRole === 'super-admin' || appRole === 'pm' ? [] : assignedProjects,
    });
}

// Revoke app access from employee
export function revokeAppAccess(employeeId: string): Employee | null {
    return updateEmployee(employeeId, {
        appRole: null,
        hasAppAccess: false,
        assignedProjects: [],
    });
}

// Update employee projects
export function updateEmployeeProjects(employeeId: string, projectIds: string[]): Employee | null {
    return updateEmployee(employeeId, { assignedProjects: projectIds });
}

// ==================== CURRENT USER ====================

const CURRENT_USER_KEY = 'ifi_current_user_email';

// For dev/demo - set current logged-in user by email
export function setCurrentUserEmail(email: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(CURRENT_USER_KEY, email);
    }
}

// Get current logged-in user
export function getCurrentUser(): Employee | null {
    if (typeof window === 'undefined') return null;

    const email = localStorage.getItem(CURRENT_USER_KEY);
    if (!email) {
        // Default to first super-admin for dev
        const admins = getEmployeesByAppRole('super-admin');
        return admins[0] || null;
    }

    const employees = getEmployees();
    return employees.find(e => e.email.toLowerCase() === email.toLowerCase()) || null;
}

// Get current user's app role
export function getCurrentUserAppRole(): AppRole | null {
    const user = getCurrentUser();
    return user?.appRole || null;
}

// Check if current user is assigned to a project
export function isCurrentUserAssignedToProject(projectId: string): boolean {
    const user = getCurrentUser();
    if (!user) return false;

    // Super admin and PM see all projects
    if (user.appRole === 'super-admin' || user.appRole === 'pm') return true;

    // Check assigned projects
    return user.assignedProjects?.includes(projectId) || false;
}

// Generate temporary password
export function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

