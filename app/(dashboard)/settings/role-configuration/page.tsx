'use client';

import { useState, useEffect, Fragment } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Save, RotateCcw, Info } from 'lucide-react';
import {
    EmployeeRoleType,
    RolePermissions,
    ModuleWithChildren,
    MODULE_STRUCTURE,
    getRolePermissions,
    saveRolePermissions,
    resetRolePermissions,
} from '@/lib/role-permissions-storage';

const ROLES: { role: EmployeeRoleType; icon: string; label: string }[] = [
    { role: 'Admin', icon: '👑', label: 'Admin' },
    { role: 'PM', icon: '📋', label: 'PM' },
    { role: 'Supervisor', icon: '🔧', label: 'Supervisor' },
    { role: 'Lead', icon: '👷', label: 'Lead' },
];

type ModuleKey = keyof typeof MODULE_STRUCTURE;

export default function RoleConfigurationPage() {
    const [selectedRole, setSelectedRole] = useState<EmployeeRoleType>('Admin');
    const [permissions, setPermissions] = useState<RolePermissions | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['globalData', 'fieldForms', 'settings']));
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadPermissions(selectedRole);
    }, [selectedRole]);

    const loadPermissions = (role: EmployeeRoleType) => {
        const perms = getRolePermissions(role);
        setPermissions(perms);
        setHasChanges(false);
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }
            return next;
        });
    };

    const updatePermission = (moduleKey: ModuleKey, field: 'view' | 'edit' | 'delete', value: boolean) => {
        if (!permissions) return;

        const newPerms = JSON.parse(JSON.stringify(permissions)) as RolePermissions;
        const module = newPerms.permissions[moduleKey];

        module[field] = value;

        if (field === 'view' && !value) {
            module.edit = false;
            module.delete = false;
        }

        if ('children' in module) {
            Object.keys(module.children).forEach(childKey => {
                module.children[childKey][field] = value;
                if (field === 'view' && !value) {
                    module.children[childKey].edit = false;
                    module.children[childKey].delete = false;
                }
            });
        }

        setPermissions(newPerms);
        setHasChanges(true);
    };

    const updateChildPermission = (
        moduleKey: ModuleKey,
        childKey: string,
        field: 'view' | 'edit' | 'delete',
        value: boolean
    ) => {
        if (!permissions) return;

        const newPerms = JSON.parse(JSON.stringify(permissions)) as RolePermissions;
        const module = newPerms.permissions[moduleKey] as ModuleWithChildren;

        module.children[childKey][field] = value;

        if (field === 'view' && !value) {
            module.children[childKey].edit = false;
            module.children[childKey].delete = false;
        }

        const allChildren = Object.values(module.children);
        module.view = allChildren.some(c => c.view);
        module.edit = allChildren.some(c => c.edit);
        module.delete = allChildren.some(c => c.delete);

        setPermissions(newPerms);
        setHasChanges(true);
    };

    const updateProjectAccess = (value: 'all' | 'assigned') => {
        if (!permissions) return;
        setPermissions({ ...permissions, projectAccess: value });
        setHasChanges(true);
    };

    const toggleSelectAll = (field: 'view' | 'edit' | 'delete', value: boolean) => {
        if (!permissions) return;

        const newPerms = JSON.parse(JSON.stringify(permissions)) as RolePermissions;

        Object.keys(newPerms.permissions).forEach(key => {
            const moduleKey = key as ModuleKey;
            const module = newPerms.permissions[moduleKey];

            module[field] = value;
            if (field === 'view' && !value) {
                module.edit = false;
                module.delete = false;
            }

            if ('children' in module) {
                Object.keys(module.children).forEach(childKey => {
                    module.children[childKey][field] = value;
                    if (field === 'view' && !value) {
                        module.children[childKey].edit = false;
                        module.children[childKey].delete = false;
                    }
                });
            }
        });

        setPermissions(newPerms);
        setHasChanges(true);
    };

    const handleSave = () => {
        if (!permissions) return;
        saveRolePermissions(selectedRole, permissions);
        setHasChanges(false);
        toast.success(`${selectedRole} permissions updated`);
    };

    const handleReset = () => {
        const defaultPerms = resetRolePermissions(selectedRole);
        setPermissions(defaultPerms);
        setHasChanges(false);
        toast.success(`${selectedRole} permissions reset to default`);
    };

    const handleRoleChange = (role: EmployeeRoleType) => {
        if (hasChanges) {
            if (!confirm('You have unsaved changes. Discard changes?')) {
                return;
            }
        }
        setSelectedRole(role);
    };

    const isAllChecked = (field: 'view' | 'edit' | 'delete'): boolean => {
        if (!permissions) return false;
        const modules = Object.values(permissions.permissions);
        return modules.every(m => m[field]);
    };

    const showProjectAccess = selectedRole === 'Supervisor' || selectedRole === 'Lead';

    if (!permissions) return null;

    return (
        <PageWrapper
            title="Role Configuration"
            description="Define what each role can access in the application"
        >
            <div className="p-6">
                {/* Role Tabs */}
                <div className="flex border-b border-slate-200 mb-6">
                    {ROLES.map(({ role, icon, label }) => (
                        <button
                            key={role}
                            onClick={() => handleRoleChange(role)}
                            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${selectedRole === role
                                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <span>{icon}</span>
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Permission Card */}
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <span>{ROLES.find(r => r.role === selectedRole)?.icon}</span>
                            {selectedRole} Permissions
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleReset}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset to Default
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>

                    {/* Project Access (Supervisor/Lead only) */}
                    {showProjectAccess && (
                        <div className="p-4 border-b bg-amber-50">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">⚙️</span>
                                <span className="font-medium">Project Access</span>
                            </div>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="projectAccess"
                                        checked={permissions.projectAccess === 'all'}
                                        onChange={() => updateProjectAccess('all')}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span>All Projects</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="projectAccess"
                                        checked={permissions.projectAccess === 'assigned'}
                                        onChange={() => updateProjectAccess('assigned')}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span>Assigned Projects Only</span>
                                </label>
                            </div>
                            <p className="text-xs text-slate-600 mt-2">
                                ℹ️ When "Assigned Projects Only" is selected, {selectedRole}s will only see projects they are assigned to.
                            </p>
                        </div>
                    )}

                    {/* Permission Table */}
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-slate-100">
                                <th className="text-left py-3 px-4 font-semibold text-slate-700 w-1/2">
                                    MODULE
                                </th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700 w-1/6">
                                    VIEW
                                </th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700 w-1/6">
                                    EDIT
                                </th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700 w-1/6">
                                    DELETE
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Select All Row */}
                            <tr className="border-b bg-slate-50 hover:bg-slate-100">
                                <td className="py-3 px-4 font-medium flex items-center gap-2">
                                    <Checkbox
                                        checked={isAllChecked('view') && isAllChecked('edit') && isAllChecked('delete')}
                                        onCheckedChange={(checked) => {
                                            toggleSelectAll('view', !!checked);
                                            toggleSelectAll('edit', !!checked);
                                            toggleSelectAll('delete', !!checked);
                                        }}
                                    />
                                    <span>Select All</span>
                                </td>
                                <td className="text-center py-3 px-4">
                                    <Checkbox
                                        checked={isAllChecked('view')}
                                        onCheckedChange={(checked) => toggleSelectAll('view', !!checked)}
                                    />
                                </td>
                                <td className="text-center py-3 px-4">
                                    <Checkbox
                                        checked={isAllChecked('edit')}
                                        onCheckedChange={(checked) => toggleSelectAll('edit', !!checked)}
                                    />
                                </td>
                                <td className="text-center py-3 px-4">
                                    <Checkbox
                                        checked={isAllChecked('delete')}
                                        onCheckedChange={(checked) => toggleSelectAll('delete', !!checked)}
                                    />
                                </td>
                            </tr>

                            {/* Module Rows */}
                            {(Object.keys(MODULE_STRUCTURE) as ModuleKey[]).map((moduleKey) => {
                                const moduleConfig = MODULE_STRUCTURE[moduleKey];
                                const modulePerm = permissions.permissions[moduleKey];
                                const isCollapsible = 'children' in moduleConfig;
                                const isExpanded = expandedSections.has(moduleKey);

                                return (
                                    <Fragment key={moduleKey}>
                                        {/* Parent Row */}
                                        <tr className="border-b hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    {isCollapsible ? (
                                                        <button
                                                            onClick={() => toggleSection(moduleKey)}
                                                            className="p-1 hover:bg-slate-200 rounded"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="w-6" />
                                                    )}
                                                    <span className="font-medium">{moduleConfig.label}</span>
                                                </div>
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <Checkbox
                                                    checked={modulePerm.view}
                                                    onCheckedChange={(checked) => updatePermission(moduleKey, 'view', !!checked)}
                                                />
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <Checkbox
                                                    checked={modulePerm.edit}
                                                    disabled={!modulePerm.view}
                                                    onCheckedChange={(checked) => updatePermission(moduleKey, 'edit', !!checked)}
                                                />
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <Checkbox
                                                    checked={modulePerm.delete}
                                                    disabled={!modulePerm.view}
                                                    onCheckedChange={(checked) => updatePermission(moduleKey, 'delete', !!checked)}
                                                />
                                            </td>
                                        </tr>

                                        {/* Children Rows */}
                                        {isCollapsible && isExpanded && 'children' in moduleConfig && (
                                            Object.entries(moduleConfig.children).map(([childKey, childLabel], index, arr) => {
                                                const childPerm = (modulePerm as ModuleWithChildren).children[childKey];
                                                const isLast = index === arr.length - 1;

                                                return (
                                                    <tr
                                                        key={`${moduleKey}-${childKey}`}
                                                        className="border-b bg-slate-50/50 hover:bg-slate-100/50"
                                                    >
                                                        <td className="py-2 px-4 pl-12">
                                                            <span className="text-slate-400 font-mono mr-2">
                                                                {isLast ? '└─' : '├─'}
                                                            </span>
                                                            <span className="text-slate-600">{childLabel}</span>
                                                        </td>
                                                        <td className="text-center py-2 px-4">
                                                            <Checkbox
                                                                checked={childPerm?.view ?? false}
                                                                onCheckedChange={(checked) => updateChildPermission(moduleKey, childKey, 'view', !!checked)}
                                                            />
                                                        </td>
                                                        <td className="text-center py-2 px-4">
                                                            <Checkbox
                                                                checked={childPerm?.edit ?? false}
                                                                disabled={!childPerm?.view}
                                                                onCheckedChange={(checked) => updateChildPermission(moduleKey, childKey, 'edit', !!checked)}
                                                            />
                                                        </td>
                                                        <td className="text-center py-2 px-4">
                                                            <Checkbox
                                                                checked={childPerm?.delete ?? false}
                                                                disabled={!childPerm?.view}
                                                                onCheckedChange={(checked) => updateChildPermission(moduleKey, childKey, 'delete', !!checked)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Info Box */}
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span>
                        Employees with "Worker" role have no app access. They only appear in timesheets and JHA attendance from the Employees roster.
                    </span>
                </div>
            </div>
        </PageWrapper>
    );
}
