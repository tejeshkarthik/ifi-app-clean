'use client';

import { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
    getWorkflows,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    FORM_TYPES,
    ROLE_OPTIONS,
    type Workflow,
    type WorkflowLevel,
    type FormType,
} from '@/lib/workflow-storage';
import { getEmployees, type Employee } from '@/lib/employee-storage';
import {
    Plus, Pencil, Trash2, GitBranch, ArrowUp, ArrowDown, Users, Shield
} from 'lucide-react';

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formIsActive, setFormIsActive] = useState(true);
    const [formLevels, setFormLevels] = useState<WorkflowLevel[]>([]);
    const [formAssignedForms, setFormAssignedForms] = useState<FormType[]>([]);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setWorkflows(getWorkflows());
        setEmployees(getEmployees().filter(e => e.isActive));
    };

    const openAddModal = () => {
        setEditingWorkflow(null);
        setFormName('');
        setFormIsActive(true);
        setFormLevels([]);
        setFormAssignedForms([]);
        setIsModalOpen(true);
    };

    const openEditModal = (workflow: Workflow) => {
        setEditingWorkflow(workflow);
        setFormName(workflow.name);
        setFormIsActive(workflow.isActive);
        setFormLevels([...workflow.levels]);
        setFormAssignedForms([...workflow.assignedForms]);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formName.trim()) return;

        const data = {
            name: formName.trim(),
            isActive: formIsActive,
            levels: formLevels,
            assignedForms: formAssignedForms,
        };

        if (editingWorkflow) {
            updateWorkflow(editingWorkflow.id, data);
        } else {
            addWorkflow(data);
        }

        refreshData();
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (!deletingWorkflow) return;
        deleteWorkflow(deletingWorkflow.id);
        refreshData();
        setIsDeleteDialogOpen(false);
        setDeletingWorkflow(null);
    };

    // Level management
    const addLevel = () => {
        const newLevel: WorkflowLevel = {
            id: crypto.randomUUID(),
            levelNumber: formLevels.length + 1,
            levelType: 'Users',
            approvalType: 'Any',
            approverIds: [],
            approverNames: [],
        };
        setFormLevels([...formLevels, newLevel]);
    };

    const removeLevel = (index: number) => {
        const updated = formLevels.filter((_, i) => i !== index).map((level, i) => ({
            ...level,
            levelNumber: i + 1,
        }));
        setFormLevels(updated);
    };

    const moveLevel = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === formLevels.length - 1) return;

        const updated = [...formLevels];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];

        // Renumber
        updated.forEach((level, i) => {
            level.levelNumber = i + 1;
        });

        setFormLevels(updated);
    };

    const updateLevel = (index: number, updates: Partial<WorkflowLevel>) => {
        const updated = [...formLevels];
        updated[index] = { ...updated[index], ...updates };

        // Clear approvers if type changes
        if (updates.levelType && updates.levelType !== formLevels[index].levelType) {
            updated[index].approverIds = [];
            updated[index].approverNames = [];
        }

        setFormLevels(updated);
    };

    const toggleApprover = (levelIndex: number, id: string, name: string) => {
        const level = formLevels[levelIndex];
        const updated = [...formLevels];

        if (level.approverIds.includes(id)) {
            updated[levelIndex] = {
                ...level,
                approverIds: level.approverIds.filter(aid => aid !== id),
                approverNames: level.approverNames.filter(n => n !== name),
            };
        } else {
            updated[levelIndex] = {
                ...level,
                approverIds: [...level.approverIds, id],
                approverNames: [...level.approverNames, name],
            };
        }

        setFormLevels(updated);
    };

    const toggleAssignedForm = (formType: FormType) => {
        if (formAssignedForms.includes(formType)) {
            setFormAssignedForms(formAssignedForms.filter(f => f !== formType));
        } else {
            setFormAssignedForms([...formAssignedForms, formType]);
        }
    };

    const getFormLabels = (forms: FormType[]) => {
        return forms.map(f => FORM_TYPES.find(ft => ft.value === f)?.label || f).join(', ');
    };

    return (
        <PageWrapper title="Workflows" description="Configure approval workflows">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div></div>
                    <Button onClick={openAddModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Workflow
                    </Button>
                </div>

                {/* Table */}
                {workflows.length === 0 ? (
                    <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-lg">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <GitBranch className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700 mb-1">No workflows yet</h3>
                            <p className="text-sm text-slate-500 mb-4">Create approval workflows for forms</p>
                            <Button onClick={openAddModal}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Workflow
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>Workflow Name</TableHead>
                                    <TableHead>Levels</TableHead>
                                    <TableHead>Assigned Forms</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workflows.map((workflow) => (
                                    <TableRow key={workflow.id}>
                                        <TableCell className="font-medium">{workflow.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{workflow.levels.length} level{workflow.levels.length !== 1 ? 's' : ''}</Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 max-w-xs truncate">
                                            {workflow.assignedForms.length > 0
                                                ? getFormLabels(workflow.assignedForms)
                                                : <span className="text-slate-400">None</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {workflow.isActive ? (
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
                                                    onClick={() => openEditModal(workflow)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDeletingWorkflow(workflow);
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
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingWorkflow ? 'Edit Workflow' : 'Add Workflow'}</DialogTitle>
                        <DialogDescription>
                            Configure approval levels and assign to forms
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Workflow Name *</Label>
                                <Input
                                    id="name"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Timesheet Approval"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label>Active</Label>
                                    <p className="text-sm text-slate-500">Enable this workflow</p>
                                </div>
                                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                            </div>
                        </div>

                        {/* Approval Levels */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Approval Levels</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addLevel}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Level
                                </Button>
                            </div>

                            {formLevels.length === 0 ? (
                                <div className="text-center py-6 text-slate-500 border border-dashed rounded-lg">
                                    No approval levels. Click &quot;Add Level&quot; to start.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formLevels.map((level, index) => (
                                        <div key={level.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-blue-100 text-blue-700">Level {level.levelNumber}</Badge>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => moveLevel(index, 'up')}
                                                            disabled={index === 0}
                                                            className="h-7 w-7 p-0"
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => moveLevel(index, 'down')}
                                                            disabled={index === formLevels.length - 1}
                                                            className="h-7 w-7 p-0"
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeLevel(index)}
                                                    className="h-7 w-7 p-0 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Level Type</Label>
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`levelType-${level.id}`}
                                                                checked={level.levelType === 'Users'}
                                                                onChange={() => updateLevel(index, { levelType: 'Users' })}
                                                                className="w-4 h-4"
                                                            />
                                                            <Users className="h-4 w-4 text-slate-500" />
                                                            <span className="text-sm">Users</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`levelType-${level.id}`}
                                                                checked={level.levelType === 'Roles'}
                                                                onChange={() => updateLevel(index, { levelType: 'Roles' })}
                                                                className="w-4 h-4"
                                                            />
                                                            <Shield className="h-4 w-4 text-slate-500" />
                                                            <span className="text-sm">Roles</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Approval Type</Label>
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`approvalType-${level.id}`}
                                                                checked={level.approvalType === 'Any'}
                                                                onChange={() => updateLevel(index, { approvalType: 'Any' })}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm">Any one can approve</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`approvalType-${level.id}`}
                                                                checked={level.approvalType === 'All'}
                                                                onChange={() => updateLevel(index, { approvalType: 'All' })}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm">All must approve</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Approvers</Label>
                                                <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-white max-h-24 overflow-y-auto">
                                                    {level.levelType === 'Users' ? (
                                                        employees.length > 0 ? employees.map(emp => (
                                                            <label key={emp.id} className="flex items-center gap-2 px-2 py-1 border rounded cursor-pointer hover:bg-slate-50">
                                                                <Checkbox
                                                                    checked={level.approverIds.includes(emp.id)}
                                                                    onCheckedChange={() => toggleApprover(index, emp.id, emp.name)}
                                                                />
                                                                <span className="text-sm">{emp.name}</span>
                                                            </label>
                                                        )) : <span className="text-sm text-slate-500">No employees</span>
                                                    ) : (
                                                        ROLE_OPTIONS.map(role => (
                                                            <label key={role} className="flex items-center gap-2 px-2 py-1 border rounded cursor-pointer hover:bg-slate-50">
                                                                <Checkbox
                                                                    checked={level.approverIds.includes(role)}
                                                                    onCheckedChange={() => toggleApprover(index, role, role)}
                                                                />
                                                                <span className="text-sm">{role}</span>
                                                            </label>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Assign To Forms */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Assign To Forms</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {FORM_TYPES.map(form => (
                                    <label
                                        key={form.value}
                                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50"
                                    >
                                        <Checkbox
                                            checked={formAssignedForms.includes(form.value)}
                                            onCheckedChange={() => toggleAssignedForm(form.value)}
                                        />
                                        <span className="text-sm">{form.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!formName.trim()}>
                            {editingWorkflow ? 'Save Changes' : 'Add Workflow'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingWorkflow?.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageWrapper>
    );
}
