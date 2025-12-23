'use client';

import { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from 'sonner';
import { Search, Plus, UserCircle, X, Copy, Info, Shield, ClipboardList, Wrench, HardHat, Eye, Pencil, Trash2 } from 'lucide-react';
import {
    Employee,
    AppRole,
    APP_ROLES,
    APP_ROLE_LABELS,
    APP_ROLE_DESCRIPTIONS,
    APP_ROLE_ICONS,
    getEmployees,
    getEmployeesByAppRole,
    getEmployeesWithoutAppAccess,
    grantAppAccess,
    revokeAppAccess,
    updateEmployeeProjects,
    generateTempPassword,
} from '@/lib/employee-storage';
import { getProjects } from '@/lib/project-storage';

const ROLE_COLORS: Record<AppRole, string> = {
    'super-admin': 'bg-red-50 border-red-200',
    'pm': 'bg-blue-50 border-blue-200',
    'supervisor': 'bg-green-50 border-green-200',
    'lead': 'bg-amber-50 border-amber-200',
};

const ROLE_BADGE_COLORS: Record<AppRole, string> = {
    'super-admin': 'bg-red-100 text-red-700',
    'pm': 'bg-blue-100 text-blue-700',
    'supervisor': 'bg-green-100 text-green-700',
    'lead': 'bg-amber-100 text-amber-700',
};

interface Project {
    id: string;
    name: string;
    epNumber?: string;
}

export default function UserRolesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Add modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addingToRole, setAddingToRole] = useState<AppRole | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

    // Credentials modal
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    const [newUserCredentials, setNewUserCredentials] = useState<{ email: string; password: string } | null>(null);

    // Remove access dialog
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(null);

    // Edit projects modal
    const [isEditProjectsOpen, setIsEditProjectsOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [editingProjects, setEditingProjects] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setEmployees(getEmployees());
        setProjects(getProjects());
    };

    const getEmployeesForRole = (role: AppRole): Employee[] => {
        return employees.filter(e => e.appRole === role && e.hasAppAccess);
    };

    const getAvailableEmployees = (): Employee[] => {
        const available = employees.filter(e => !e.hasAppAccess || !e.appRole);
        if (!searchQuery) return available;
        const q = searchQuery.toLowerCase();
        return available.filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.email?.toLowerCase().includes(q)
        );
    };

    const handleOpenAddModal = (role: AppRole) => {
        setAddingToRole(role);
        setSelectedEmployeeId('');
        setSelectedProjects([]);
        setSearchQuery('');
        setIsAddModalOpen(true);
    };

    const handleAddEmployee = () => {
        if (!selectedEmployeeId || !addingToRole) return;

        // For supervisor/lead, require at least one project
        if ((addingToRole === 'supervisor' || addingToRole === 'lead') && selectedProjects.length === 0) {
            toast.error('Please select at least one project');
            return;
        }

        const result = grantAppAccess(selectedEmployeeId, addingToRole, selectedProjects);
        if (result) {
            const tempPassword = generateTempPassword();
            setNewUserCredentials({ email: result.email, password: tempPassword });
            setIsAddModalOpen(false);
            setIsCredentialsModalOpen(true);
            loadData();
            toast.success(`${result.name} added as ${APP_ROLE_LABELS[addingToRole]}`);
        }
    };

    const handleRemoveAccess = () => {
        if (!employeeToRemove) return;
        revokeAppAccess(employeeToRemove.id);
        loadData();
        setRemoveDialogOpen(false);
        setEmployeeToRemove(null);
        toast.success('App access removed');
    };

    const handleEditProjects = (employee: Employee) => {
        setEditingEmployee(employee);
        setEditingProjects(employee.assignedProjects || []);
        setIsEditProjectsOpen(true);
    };

    const handleSaveProjects = () => {
        if (!editingEmployee) return;
        updateEmployeeProjects(editingEmployee.id, editingProjects);
        loadData();
        setIsEditProjectsOpen(false);
        toast.success('Projects updated');
    };

    const copyCredentials = () => {
        if (!newUserCredentials) return;
        navigator.clipboard.writeText(`Email: ${newUserCredentials.email}\nTemporary Password: ${newUserCredentials.password}`);
        toast.success('Credentials copied to clipboard');
    };

    const showProjectsForRole = (role: AppRole) => role === 'supervisor' || role === 'lead';

    return (
        <PageWrapper title="User Roles" description="Assign employees to roles to grant app access">
            <div className="p-6">
                {/* Role Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {APP_ROLES.map(role => (
                        <div
                            key={role}
                            className={`border rounded-xl p-4 ${ROLE_COLORS[role]}`}
                        >
                            {/* Role Header */}
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
                                <span className="text-2xl">{APP_ROLE_ICONS[role]}</span>
                                <div>
                                    <h3 className="font-semibold text-lg">{APP_ROLE_LABELS[role].toUpperCase()}</h3>
                                    <p className="text-sm text-slate-600">{APP_ROLE_DESCRIPTIONS[role]}</p>
                                </div>
                            </div>

                            {/* Employees List */}
                            <div className="space-y-2 min-h-[100px]">
                                {getEmployeesForRole(role).length === 0 ? (
                                    <p className="text-sm text-slate-500 italic py-4 text-center">No employees assigned</p>
                                ) : (
                                    getEmployeesForRole(role).map(emp => (
                                        <Popover key={emp.id}>
                                            <PopoverTrigger asChild>
                                                <div className="flex items-start gap-3 p-2 rounded-lg bg-white/70 hover:bg-white cursor-pointer transition-colors">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                                        <UserCircle className="h-5 w-5 text-slate-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-sm truncate">{emp.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                                                        {showProjectsForRole(role) && emp.assignedProjects?.length ? (
                                                            <p className="text-xs text-slate-400 mt-0.5">
                                                                📁 {emp.assignedProjects.length} project{emp.assignedProjects.length > 1 ? 's' : ''}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-72" align="start">
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="font-medium">{emp.name}</p>
                                                        <p className="text-sm text-slate-500">{emp.email}</p>
                                                        {emp.phone && (
                                                            <p className="text-sm text-slate-500">{emp.phone}</p>
                                                        )}
                                                    </div>

                                                    {showProjectsForRole(role) && (
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-600 mb-1">Assigned Projects:</p>
                                                            {emp.assignedProjects?.length ? (
                                                                <ul className="text-sm space-y-0.5">
                                                                    {emp.assignedProjects.map(pid => {
                                                                        const proj = projects.find(p => p.id === pid);
                                                                        return proj ? (
                                                                            <li key={pid}>• {proj.name}</li>
                                                                        ) : null;
                                                                    })}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-sm text-slate-400 italic">No projects assigned</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 pt-2 border-t">
                                                        {showProjectsForRole(role) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEditProjects(emp)}
                                                            >
                                                                <Pencil className="h-3 w-3 mr-1" />
                                                                Edit Projects
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                setEmployeeToRemove(emp);
                                                                setRemoveDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    ))
                                )}
                            </div>

                            {/* Add Button */}
                            <div className="mt-4 pt-3 border-t border-slate-200/50">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleOpenAddModal(role)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Employee
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Box */}
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span>
                        Workers don't need app access. They appear in timesheets and JHA attendance automatically from the Employees roster.
                    </span>
                </div>

                {/* Stats */}
                <div className="mt-4 text-sm text-slate-500">
                    {employees.filter(e => e.hasAppAccess).length} employee{employees.filter(e => e.hasAppAccess).length !== 1 ? 's' : ''} with app access
                </div>
            </div>

            {/* Add Employee Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Add {addingToRole ? APP_ROLE_LABELS[addingToRole] : ''}
                        </DialogTitle>
                        <DialogDescription>
                            Select an employee to grant app access
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Search */}
                        <div>
                            <Label>Select Employee</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search employees..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Employee List */}
                        <div className="border rounded-lg max-h-48 overflow-y-auto">
                            {getAvailableEmployees().length === 0 ? (
                                <p className="text-sm text-slate-500 italic p-3 text-center">
                                    No available employees
                                </p>
                            ) : (
                                getAvailableEmployees().map(emp => (
                                    <label
                                        key={emp.id}
                                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 border-b last:border-b-0 ${selectedEmployeeId === emp.id ? 'bg-blue-50' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="employee"
                                            value={emp.id}
                                            checked={selectedEmployeeId === emp.id}
                                            onChange={() => setSelectedEmployeeId(emp.id)}
                                            className="text-blue-600"
                                        />
                                        <div>
                                            <p className="font-medium text-sm">{emp.name}</p>
                                            <p className="text-xs text-slate-500">{emp.email}</p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            Only showing employees without app access
                        </p>

                        {/* Project Selection (for Supervisor/Lead) */}
                        {addingToRole && showProjectsForRole(addingToRole) && (
                            <div>
                                <Label>Assign to Projects *</Label>
                                <div className="border rounded-lg max-h-40 overflow-y-auto mt-1">
                                    {projects.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic p-3">No projects available</p>
                                    ) : (
                                        projects.map(proj => (
                                            <label key={proj.id} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-50">
                                                <Checkbox
                                                    checked={selectedProjects.includes(proj.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedProjects(prev => [...prev, proj.id]);
                                                        } else {
                                                            setSelectedProjects(prev => prev.filter(id => id !== proj.id));
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm">
                                                    {proj.name}
                                                    {proj.epNumber && <span className="text-slate-400 ml-1">(EP# {proj.epNumber})</span>}
                                                </span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddEmployee} disabled={!selectedEmployeeId}>
                            Add to Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Credentials Modal */}
            <Dialog open={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-green-500">✅</span>
                            Access Granted
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Login credentials:
                        </p>

                        <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm space-y-2">
                            <div>
                                <span className="text-slate-500">Email:</span>
                                <br />
                                <span className="font-medium">{newUserCredentials?.email}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Temporary Password:</span>
                                <br />
                                <span className="font-medium">{newUserCredentials?.password}</span>
                            </div>
                        </div>

                        <p className="text-xs text-amber-600 flex items-start gap-1">
                            <span>⚠️</span>
                            Share this password securely. User will be prompted to change it on first login.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={copyCredentials}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Credentials
                        </Button>
                        <Button onClick={() => setIsCredentialsModalOpen(false)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Projects Modal */}
            <Dialog open={isEditProjectsOpen} onOpenChange={setIsEditProjectsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Projects for {editingEmployee?.name}</DialogTitle>
                    </DialogHeader>

                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                        {projects.map(proj => (
                            <label key={proj.id} className="flex items-center gap-2 p-3 cursor-pointer hover:bg-slate-50 border-b last:border-b-0">
                                <Checkbox
                                    checked={editingProjects.includes(proj.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setEditingProjects(prev => [...prev, proj.id]);
                                        } else {
                                            setEditingProjects(prev => prev.filter(id => id !== proj.id));
                                        }
                                    }}
                                />
                                <span className="text-sm">
                                    {proj.name}
                                    {proj.epNumber && <span className="text-slate-400 ml-1">(EP# {proj.epNumber})</span>}
                                </span>
                            </label>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditProjectsOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveProjects}>
                            Save Projects
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Access Dialog */}
            <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove App Access</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove app access for <strong>{employeeToRemove?.name}</strong>?
                            They will no longer be able to log in to the application.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveAccess} className="bg-red-600 hover:bg-red-700">
                            Remove Access
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageWrapper>
    );
}
