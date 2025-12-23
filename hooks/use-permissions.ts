'use client';

import { useMemo, useState, useEffect } from 'react';
import { getCurrentUser, type Employee, type AppRole } from '@/lib/employee-storage';
import {
    getRolePermissions,
    canViewModule,
    canEditModule,
    canDeleteModule,
    isAssignedProjectsOnly,
    type EmployeeRoleType,
    type RolePermissions,
} from '@/lib/role-permissions-storage';

/**
 * Hook to check permissions for the current user
 * 
 * Usage:
 * const { canView, canEdit, canDelete, isAssignedOnly } = usePermissions();
 * if (canView('globalData', 'employees')) { ... }
 * if (canEdit('fieldForms', 'timesheet')) { ... }
 */
export function usePermissions() {
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);

    useEffect(() => {
        // Initial load
        const loadUser = () => {
            const user = getCurrentUser();
            // Only update if ID changed or role changed to avoid unnecessary re-renders
            // JSON.stringify comparison is cheap enough for this user object
            setCurrentUser(prev => {
                if (JSON.stringify(prev) === JSON.stringify(user)) return prev;
                return user;
            });
        };

        loadUser();

        const handleStorageChange = () => loadUser();

        // Listen for storage changes (cross-tab)
        window.addEventListener('storage', handleStorageChange);
        // Listen for custom event (same-tab)
        window.addEventListener('ifi-user-change', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('ifi-user-change', handleStorageChange);
        };
    }, []);

    // Map AppRole to EmployeeRoleType (they have different casing)
    const employeeRole: EmployeeRoleType | null = useMemo(() => {
        if (!currentUser?.role) return null;

        // Map employee role to EmployeeRoleType
        const roleMap: Record<string, EmployeeRoleType> = {
            'Admin': 'Admin',
            'PM': 'PM',
            'Supervisor': 'Supervisor',
            'Lead': 'Lead',
            // Also handle appRole values if they're used
            'super-admin': 'Admin',
            'pm': 'PM',
            'supervisor': 'Supervisor',
            'lead': 'Lead',
        };

        return roleMap[currentUser.role] || roleMap[currentUser.appRole || ''] || null;
    }, [currentUser]);

    const permissions = useMemo(() => {
        if (!employeeRole) return null;
        return getRolePermissions(employeeRole);
    }, [employeeRole]);

    /**
     * Check if user can VIEW a module (or child module)
     */
    const canView = (module: string, child?: string): boolean => {
        if (!employeeRole) return true; // Default to allow if no role
        return canViewModule(employeeRole, module, child);
    };

    /**
     * Check if user can EDIT in a module (or child module)
     */
    const canEdit = (module: string, child?: string): boolean => {
        if (!employeeRole) return true; // Default to allow if no role
        return canEditModule(employeeRole, module, child);
    };

    /**
     * Check if user can DELETE in a module (or child module)
     */
    const canDelete = (module: string, child?: string): boolean => {
        if (!employeeRole) return true; // Default to allow if no role
        return canDeleteModule(employeeRole, module, child);
    };

    /**
     * Check if user can only see assigned projects
     */
    const isAssignedOnly = (): boolean => {
        if (!employeeRole) return false;
        return isAssignedProjectsOnly(employeeRole);
    };

    /**
     * Get list of project IDs the user is assigned to
     */
    const getAssignedProjects = (): string[] => {
        return currentUser?.assignedProjects || [];
    };

    /**
     * Check if user has access to a specific project
     */
    const hasProjectAccess = (projectId: string): boolean => {
        if (!isAssignedOnly()) return true;
        return getAssignedProjects().includes(projectId);
    };

    return {
        currentUser,
        employeeRole,
        permissions,
        canView,
        canEdit,
        canDelete,
        isAssignedOnly,
        getAssignedProjects,
        hasProjectAccess,
    };
}
