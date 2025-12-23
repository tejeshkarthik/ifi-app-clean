'use client';

import { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
} from '@/components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    getEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    EMPLOYEE_ROLES,
    type Employee,
} from '@/lib/employee-storage';
import { getActiveLookupValues } from '@/lib/lookup-storage';
import { ConfigurePanel } from '@/components/configure-panel';
import { ExcelImport } from '@/components/excel-import';
import { Plus, Pencil, Trash2, Search, Upload, X, ArrowUpDown, Settings } from 'lucide-react';

type SortField = 'employeeId' | 'name' | 'className' | 'craftName' | 'role' | 'phone';
type SortDirection = 'asc' | 'desc';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

    // Lookup values
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
    const [crafts, setCrafts] = useState<{ id: string; name: string }[]>([]);

    // Configure panel state
    const [isConfigureOpen, setIsConfigureOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        classId: '',
        craftId: '',
        role: '',
        email: '',
        phone: '',
        photo: null as string | null,
        isActive: true,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setEmployees(getEmployees());
        setClasses(getActiveLookupValues('employee_classes').map(v => ({ id: v.id, name: v.name })));
        setCrafts(getActiveLookupValues('employee_crafts').map(v => ({ id: v.id, name: v.name })));
    };

    // Filter and sort employees
    const filteredEmployees = employees
        .filter(e =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const aVal = a[sortField]?.toString().toLowerCase() || '';
            const bVal = b[sortField]?.toString().toLowerCase() || '';
            return sortDirection === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        });

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const openAddModal = () => {
        setEditingEmployee(null);
        setFormData({
            employeeId: '',
            name: '',
            classId: '',
            craftId: '',
            role: '',
            email: '',
            phone: '',
            photo: null,
            isActive: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        setFormData({
            employeeId: employee.employeeId,
            name: employee.name,
            classId: employee.classId,
            craftId: employee.craftId,
            role: employee.role,
            email: employee.email,
            phone: employee.phone,
            photo: employee.photo,
            isActive: employee.isActive,
        });
        setIsModalOpen(true);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, photo: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setFormData(prev => ({ ...prev, photo: null }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = () => {
        if (!formData.employeeId.trim() || !formData.name.trim()) return;

        // Email is required for non-Worker roles (they need app access)
        const requiresEmail = formData.role && formData.role !== 'Worker';
        if (requiresEmail && !formData.email.trim()) {
            return; // Button should be disabled anyway
        }

        const className = classes.find(c => c.id === formData.classId)?.name || '';
        const craftName = crafts.find(c => c.id === formData.craftId)?.name || '';

        const employeeData = {
            employeeId: formData.employeeId.trim(),
            name: formData.name.trim(),
            classId: formData.classId,
            className,
            craftId: formData.craftId,
            craftName,
            role: formData.role,
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            photo: formData.photo,
            isActive: formData.isActive,
        };

        if (editingEmployee) {
            updateEmployee(editingEmployee.id, employeeData);
        } else {
            addEmployee(employeeData);
        }

        refreshData();
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (!deletingEmployee) return;
        deleteEmployee(deletingEmployee.id);
        refreshData();
        setIsDeleteDialogOpen(false);
        setDeletingEmployee(null);
    };

    const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <TableHead
            className="cursor-pointer hover:bg-slate-50 select-none"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-1">
                {children}
                <ArrowUpDown className={`h-4 w-4 ${sortField === field ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>
        </TableHead>
    );

    return (
        <PageWrapper title="Employees" description="Manage employee roster">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsConfigureOpen(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                        </Button>
                        <ExcelImport
                            columns={[
                                { key: 'employeeId', header: 'Employee ID', required: true },
                                { key: 'name', header: 'Name', required: true },
                                { key: 'class', header: 'Class' },
                                { key: 'craft', header: 'Craft' },
                                { key: 'role', header: 'Role' },
                                { key: 'email', header: 'Email' },
                                { key: 'phone', header: 'Phone' },
                            ]}
                            templateFilename="employees_template"
                            onImport={(data) => {
                                data.forEach(row => {
                                    const matchedClass = classes.find(c => c.name.toLowerCase() === row['class']?.toLowerCase());
                                    const matchedCraft = crafts.find(c => c.name.toLowerCase() === row['craft']?.toLowerCase());
                                    addEmployee({
                                        employeeId: row['employeeId'] || '',
                                        name: row['name'] || '',
                                        classId: matchedClass?.id || '',
                                        className: matchedClass?.name || '',
                                        craftId: matchedCraft?.id || '',
                                        craftName: matchedCraft?.name || '',
                                        role: row['role'] || '',
                                        email: row['email'] || '',
                                        phone: row['phone'] || '',
                                        photo: null,
                                        isActive: true,
                                    });
                                });
                                refreshData();
                                return { success: data.length, errors: 0 };
                            }}
                        />
                        <Button onClick={openAddModal}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Employee
                        </Button>
                    </div>
                </div>

                {/* Table */}
                {filteredEmployees.length === 0 ? (
                    <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-lg">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Plus className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700 mb-1">
                                {searchQuery ? 'No employees found' : 'No employees yet'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {searchQuery ? 'Try a different search term' : 'Add your first employee to get started'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={openAddModal}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Employee
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <SortableHeader field="employeeId">Employee ID</SortableHeader>
                                    <SortableHeader field="name">Name</SortableHeader>
                                    <SortableHeader field="className">Class</SortableHeader>
                                    <SortableHeader field="craftName">Craft</SortableHeader>
                                    <SortableHeader field="role">Role</SortableHeader>
                                    <SortableHeader field="phone">Phone</SortableHeader>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell className="font-mono text-sm">{employee.employeeId}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    {employee.photo && <AvatarImage src={employee.photo} />}
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                                        {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{employee.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{employee.className || '-'}</TableCell>
                                        <TableCell>{employee.craftName || '-'}</TableCell>
                                        <TableCell>
                                            {employee.role && (
                                                <Badge variant="outline" className="font-normal">
                                                    {employee.role}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-600">{employee.phone || '-'}</TableCell>
                                        <TableCell>
                                            {employee.isActive ? (
                                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditModal(employee)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDeletingEmployee(employee);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <div className="mt-4 text-sm text-slate-500">
                    {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
                    {searchQuery && ` matching "${searchQuery}"`}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
                        <DialogDescription>
                            {editingEmployee ? 'Update employee information' : 'Add a new employee to the roster'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Photo Upload */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="h-20 w-20">
                                    {formData.photo && <AvatarImage src={formData.photo} />}
                                    <AvatarFallback className="bg-slate-100 text-slate-400 text-lg">
                                        {formData.name ? formData.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'NA'}
                                    </AvatarFallback>
                                </Avatar>
                                {formData.photo && (
                                    <button
                                        onClick={removePhoto}
                                        className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handlePhotoUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Photo
                                </Button>
                                <p className="text-xs text-slate-500 mt-1">JPG, PNG up to 2MB</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employeeId">Employee ID *</Label>
                                <Input
                                    id="employeeId"
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                                    placeholder="E001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="John Smith"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Class</Label>
                                <Select
                                    value={formData.classId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.length === 0 ? (
                                            <div className="px-2 py-4 text-sm text-slate-500 text-center">
                                                No classes configured.<br />
                                                Add them in Lookup Tables.
                                            </div>
                                        ) : (
                                            classes.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Craft</Label>
                                <Select
                                    value={formData.craftId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, craftId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select craft" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {crafts.length === 0 ? (
                                            <div className="px-2 py-4 text-sm text-slate-500 text-center">
                                                No crafts configured.<br />
                                                Add them in Lookup Tables.
                                            </div>
                                        ) : (
                                            crafts.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EMPLOYEE_ROLES.map((role) => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email Address {formData.role && formData.role !== 'Worker' && <span className="text-red-500">*</span>}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="john@company.com"
                                />
                                {formData.role && formData.role !== 'Worker' && (
                                    <p className="text-xs text-slate-500">Required for app access</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <Label htmlFor="status">Active Employee</Label>
                                <p className="text-sm text-slate-500">Employee can be assigned to projects</p>
                            </div>
                            <Switch
                                id="status"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={
                                !formData.employeeId.trim() ||
                                !formData.name.trim() ||
                                !!(formData.role && formData.role !== 'Worker' && !formData.email.trim())
                            }
                        >
                            {editingEmployee ? 'Save Changes' : 'Add Employee'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingEmployee?.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Configure Panel */}
            <ConfigurePanel
                isOpen={isConfigureOpen}
                onClose={() => {
                    setIsConfigureOpen(false);
                    refreshData();
                }}
                title="Employee Configuration"
                description="Manage employee classes and crafts"
                lookups={[
                    { category: 'employee_classes', label: 'Employee Classes' },
                    { category: 'employee_crafts', label: 'Employee Crafts' },
                ]}
            />
        </PageWrapper>
    );
}
