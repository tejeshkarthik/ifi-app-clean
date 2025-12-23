// Role Permissions Storage
// Defines what each role (Admin, PM, Supervisor, Lead) can access

// ==================== TYPES ====================

export type EmployeeRoleType = 'Admin' | 'PM' | 'Supervisor' | 'Lead';

export interface ModulePermission {
    view: boolean;
    edit: boolean;
    delete: boolean;
}

export interface ModuleWithChildren {
    view: boolean;
    edit: boolean;
    delete: boolean;
    children: Record<string, ModulePermission>;
}

export interface RolePermissions {
    role: EmployeeRoleType;
    projectAccess: 'all' | 'assigned';
    permissions: {
        dashboard: ModulePermission;
        globalData: ModuleWithChildren;
        projects: ModulePermission;
        contactDirectory: ModulePermission;
        fieldForms: ModuleWithChildren;
        billOfLading: ModulePermission;
        settings: ModuleWithChildren;
    };
    updatedAt?: string;
}

// ==================== MODULE DEFINITIONS ====================

export const MODULE_STRUCTURE = {
    dashboard: { label: 'Dashboard', collapsible: false },
    globalData: {
        label: 'Global Data',
        collapsible: true,
        children: {
            company: 'Company',
            owners: 'Owners',
            contractors: 'Contractors',
            inspectors: 'Inspectors',
            employees: 'Employees',
            materials: 'Materials',
            equipment: 'Equipment',
        },
    },
    projects: { label: 'Projects', collapsible: false },
    contactDirectory: { label: 'Contact Directory', collapsible: false },
    fieldForms: {
        label: 'Field Forms',
        collapsible: true,
        children: {
            timesheet: 'Timesheet',
            dailyFieldReport: 'Daily Field Report',
            issuesLog: 'Issues Log',
            safetyJha: 'Safety (JHA)',
            preConstruction: 'Pre-Construction Checklist',
        },
    },
    billOfLading: { label: 'Bill of Lading', collapsible: false },
    settings: {
        label: 'Settings',
        collapsible: true,
        children: {
            approvalWorkflows: 'Approval Workflows',
            roleConfiguration: 'Role Configuration',
        },
    },
} as const;

// ==================== DEFAULT PERMISSIONS ====================

const createFullAccess = (): ModulePermission => ({ view: true, edit: true, delete: true });
const createViewEdit = (): ModulePermission => ({ view: true, edit: true, delete: false });
const createViewOnly = (): ModulePermission => ({ view: true, edit: false, delete: false });
const createNoAccess = (): ModulePermission => ({ view: false, edit: false, delete: false });

export const DEFAULT_PERMISSIONS: Record<EmployeeRoleType, RolePermissions> = {
    Admin: {
        role: 'Admin',
        projectAccess: 'all',
        permissions: {
            dashboard: createFullAccess(),
            globalData: {
                ...createFullAccess(),
                children: {
                    company: createFullAccess(),
                    owners: createFullAccess(),
                    contractors: createFullAccess(),
                    inspectors: createFullAccess(),
                    employees: createFullAccess(),
                    materials: createFullAccess(),
                    equipment: createFullAccess(),
                },
            },
            projects: createFullAccess(),
            contactDirectory: createFullAccess(),
            fieldForms: {
                ...createFullAccess(),
                children: {
                    timesheet: createFullAccess(),
                    dailyFieldReport: createFullAccess(),
                    issuesLog: createFullAccess(),
                    safetyJha: createFullAccess(),
                    preConstruction: createFullAccess(),
                },
            },
            billOfLading: createFullAccess(),
            settings: {
                ...createFullAccess(),
                children: {
                    approvalWorkflows: createFullAccess(),
                    roleConfiguration: createFullAccess(),
                },
            },
        },
    },
    PM: {
        role: 'PM',
        projectAccess: 'all',
        permissions: {
            dashboard: createViewEdit(),
            globalData: {
                ...createViewEdit(),
                children: {
                    company: createViewEdit(),
                    owners: createViewEdit(),
                    contractors: createViewEdit(),
                    inspectors: createViewEdit(),
                    employees: createViewEdit(),
                    materials: createViewEdit(),
                    equipment: createViewEdit(),
                },
            },
            projects: createViewEdit(),
            contactDirectory: createViewEdit(),
            fieldForms: {
                ...createViewEdit(),
                children: {
                    timesheet: createViewEdit(),
                    dailyFieldReport: createViewEdit(),
                    issuesLog: createViewEdit(),
                    safetyJha: createViewEdit(),
                    preConstruction: createViewEdit(),
                },
            },
            billOfLading: createViewEdit(),
            settings: {
                view: true, edit: true, delete: false,
                children: {
                    approvalWorkflows: createViewEdit(),
                    roleConfiguration: createNoAccess(),
                },
            },
        },
    },
    Supervisor: {
        role: 'Supervisor',
        projectAccess: 'assigned',
        permissions: {
            dashboard: createViewOnly(),
            globalData: {
                ...createViewOnly(),
                children: {
                    company: createViewOnly(),
                    owners: createViewOnly(),
                    contractors: createViewOnly(),
                    inspectors: createViewOnly(),
                    employees: createViewOnly(),
                    materials: createViewOnly(),
                    equipment: createViewOnly(),
                },
            },
            projects: createViewOnly(),
            contactDirectory: createViewOnly(),
            fieldForms: {
                ...createViewEdit(),
                children: {
                    timesheet: createViewEdit(),
                    dailyFieldReport: createViewEdit(),
                    issuesLog: createViewEdit(),
                    safetyJha: createViewEdit(),
                    preConstruction: createViewOnly(),
                },
            },
            billOfLading: createViewOnly(),
            settings: {
                ...createNoAccess(),
                children: {
                    approvalWorkflows: createNoAccess(),
                    roleConfiguration: createNoAccess(),
                },
            },
        },
    },
    Lead: {
        role: 'Lead',
        projectAccess: 'assigned',
        permissions: {
            dashboard: createViewOnly(),
            globalData: {
                ...createNoAccess(),
                children: {
                    company: createNoAccess(),
                    owners: createNoAccess(),
                    contractors: createNoAccess(),
                    inspectors: createNoAccess(),
                    employees: createNoAccess(),
                    materials: createNoAccess(),
                    equipment: createNoAccess(),
                },
            },
            projects: createViewOnly(),
            contactDirectory: createViewOnly(),
            fieldForms: {
                ...createViewEdit(),
                children: {
                    timesheet: createViewEdit(),
                    dailyFieldReport: createViewEdit(),
                    issuesLog: createViewEdit(),
                    safetyJha: createViewEdit(),
                    preConstruction: createNoAccess(),
                },
            },
            billOfLading: createNoAccess(),
            settings: {
                ...createNoAccess(),
                children: {
                    approvalWorkflows: createNoAccess(),
                    roleConfiguration: createNoAccess(),
                },
            },
        },
    },
};

// ==================== STORAGE ====================

const STORAGE_KEY = 'ifi_role_permissions';

export function getRolePermissions(role: EmployeeRoleType): RolePermissions {
    if (typeof window === 'undefined') return DEFAULT_PERMISSIONS[role];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PERMISSIONS[role];

    try {
        const allPermissions: Record<string, RolePermissions> = JSON.parse(stored);
        return allPermissions[role] || DEFAULT_PERMISSIONS[role];
    } catch {
        return DEFAULT_PERMISSIONS[role];
    }
}

export function getAllRolePermissions(): Record<EmployeeRoleType, RolePermissions> {
    if (typeof window === 'undefined') return DEFAULT_PERMISSIONS;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PERMISSIONS;

    try {
        const allPermissions = JSON.parse(stored);
        return {
            Admin: allPermissions.Admin || DEFAULT_PERMISSIONS.Admin,
            PM: allPermissions.PM || DEFAULT_PERMISSIONS.PM,
            Supervisor: allPermissions.Supervisor || DEFAULT_PERMISSIONS.Supervisor,
            Lead: allPermissions.Lead || DEFAULT_PERMISSIONS.Lead,
        };
    } catch {
        return DEFAULT_PERMISSIONS;
    }
}

export function saveRolePermissions(role: EmployeeRoleType, permissions: RolePermissions): void {
    if (typeof window === 'undefined') return;

    const current = getAllRolePermissions();
    current[role] = {
        ...permissions,
        updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function resetRolePermissions(role: EmployeeRoleType): RolePermissions {
    const defaultPerm = DEFAULT_PERMISSIONS[role];
    saveRolePermissions(role, defaultPerm);
    return defaultPerm;
}

export function resetAllPermissions(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

// ==================== PERMISSION HELPERS ====================

export function canViewModule(role: EmployeeRoleType, moduleName: string, childName?: string): boolean {
    const perms = getRolePermissions(role);
    const moduleKey = moduleName as keyof typeof perms.permissions;
    const modulePerm = perms.permissions[moduleKey];

    if (!modulePerm) return false;

    if (childName && 'children' in modulePerm) {
        const childPerm = modulePerm.children[childName];
        return childPerm?.view ?? false;
    }

    return modulePerm.view;
}

export function canEditModule(role: EmployeeRoleType, moduleName: string, childName?: string): boolean {
    const perms = getRolePermissions(role);
    const moduleKey = moduleName as keyof typeof perms.permissions;
    const modulePerm = perms.permissions[moduleKey];

    if (!modulePerm) return false;

    if (childName && 'children' in modulePerm) {
        const childPerm = modulePerm.children[childName];
        return childPerm?.edit ?? false;
    }

    return modulePerm.edit;
}

export function canDeleteModule(role: EmployeeRoleType, moduleName: string, childName?: string): boolean {
    const perms = getRolePermissions(role);
    const moduleKey = moduleName as keyof typeof perms.permissions;
    const modulePerm = perms.permissions[moduleKey];

    if (!modulePerm) return false;

    if (childName && 'children' in modulePerm) {
        const childPerm = modulePerm.children[childName];
        return childPerm?.delete ?? false;
    }

    return modulePerm.delete;
}

export function isAssignedProjectsOnly(role: EmployeeRoleType): boolean {
    const perms = getRolePermissions(role);
    return perms.projectAccess === 'assigned';
}
