'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageWrapper } from '@/components/page-wrapper';
import { ProjectInfoCard } from '@/components/project-info-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    getTimesheetById,
    addTimesheet,
    updateTimesheet,
    calculateEntryTotalHours,
    type Timesheet,
    type TimeEntry,
    type TimesheetStatus,
} from '@/lib/timesheet-storage';
import { getProjects, getProjectById, type Project } from '@/lib/project-storage';
import { getEmployees, type Employee } from '@/lib/employee-storage';
import { getActiveLookupValues } from '@/lib/lookup-storage';
import {
    ArrowLeft, Save, Plus, Trash2, Copy, Clock, Send, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser, getCurrentUser } from '@/lib/user-storage';
import { getWorkflows, type Workflow } from '@/lib/workflow-storage';
import { notifyApprovers } from '@/lib/notification-storage';
import { ApprovalActions } from '@/components/approval-actions';

const STATUS_COLORS: Record<TimesheetStatus, string> = {
    'Draft': 'bg-slate-100 text-slate-700',
    'Pending Approval': 'bg-amber-100 text-amber-700',
    'Approved': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
};

export default function TimesheetFormPage() {
    const router = useRouter();
    const params = useParams();
    const timesheetId = params.id as string;
    const isEditing = timesheetId && timesheetId !== 'new';

    // Form state
    const [projectId, setProjectId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [shiftId, setShiftId] = useState('');
    const [shiftName, setShiftName] = useState('');
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<TimesheetStatus>('Draft');
    const [approvalLevel, setApprovalLevel] = useState<number>(1);
    const [approvalHistory, setApprovalHistory] = useState<Timesheet['approvalHistory']>([]);

    // User role for approvals
    const { user, role } = useUser();

    // Clone modal
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [cloneSourceIndex, setCloneSourceIndex] = useState<number | null>(null);
    const [cloneTargets, setCloneTargets] = useState<string[]>([]);
    const [recentlyClonedIds, setRecentlyClonedIds] = useState<string[]>([]);

    // Options
    const [projects, setProjects] = useState<Project[]>([]);
    const [shiftOptions, setShiftOptions] = useState<{ id: string; name: string }[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [crewEmployees, setCrewEmployees] = useState<Employee[]>([]);

    // Selected project info
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    useEffect(() => {
        loadOptions();

        if (isEditing) {
            const timesheet = getTimesheetById(timesheetId);
            if (timesheet) {
                setProjectId(timesheet.projectId);
                setDate(timesheet.date);
                setShiftId(timesheet.shiftId);
                setShiftName(timesheet.shiftName);
                setEntries(timesheet.entries);
                setNotes(timesheet.notes);
                setNotes(timesheet.notes);
                setStatus(timesheet.status);
                setApprovalLevel(timesheet.approvalLevel || 1);
                setApprovalHistory(timesheet.approvalHistory || []);

                // Load project crew
                const project = getProjectById(timesheet.projectId);
                if (project) {
                    setSelectedProject(project);
                    loadCrewForProject(project);
                }
            }
        }
    }, [isEditing, timesheetId]);

    const loadOptions = () => {
        setProjects(getProjects().filter(p => !p.isDraft));
        setShiftOptions(getActiveLookupValues('shift_types').map(v => ({ id: v.id, name: v.name })));
        setAllEmployees(getEmployees().filter(e => e.isActive));
    };

    const loadCrewForProject = (project: Project) => {
        // Load employees directly from storage to avoid stale state issues
        const employees = getEmployees().filter(e => e.isActive);
        const empMap = new Map(employees.map(e => [e.id, e]));

        // Debug logging
        console.log('=== DEBUG: loadCrewForProject ===');
        console.log('Selected Project:', project.name, project.id);
        console.log('Project Personnel Arrays:');
        console.log('  - pmIds:', project.pmIds);
        console.log('  - supervisorIds:', project.supervisorIds);
        console.log('  - leadIds:', project.leadIds);
        console.log('  - workerIds:', project.workerIds);

        const crewIds = [
            ...project.pmIds,
            ...project.supervisorIds,
            ...project.leadIds,
            ...project.workerIds,
        ];

        console.log('Combined crewIds:', crewIds);
        console.log('Available employees in storage:', employees.map(e => ({ id: e.id, name: e.name })));

        const crew = crewIds.map(id => empMap.get(id)).filter(Boolean) as Employee[];

        console.log('Matched crew employees:', crew.map(e => ({ id: e.id, name: e.name })));
        console.log('=================================');

        setCrewEmployees(crew);
    };

    const handleProjectChange = (newProjectId: string) => {
        setProjectId(newProjectId);
        const project = getProjectById(newProjectId);
        if (project) {
            setSelectedProject(project);
            loadCrewForProject(project);
            // Clear entries when project changes
            setEntries([]);
        }
    };

    const handleShiftChange = (newShiftId: string) => {
        setShiftId(newShiftId);
        const shift = shiftOptions.find(s => s.id === newShiftId);
        setShiftName(shift?.name || '');
    };

    // Entry management
    const addEntry = () => {
        const newEntry: TimeEntry = {
            id: crypto.randomUUID(),
            employeeId: '',
            employeeName: '',
            certifiedIn: '',
            certifiedOut: '',
            nonCertifiedIn: '',
            nonCertifiedOut: '',
            totalHours: 0,
        };
        setEntries([...entries, newEntry]);
    };

    const removeEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const updateEntry = (index: number, field: keyof TimeEntry, value: string) => {
        const updated = [...entries];

        if (field === 'employeeId') {
            const emp = crewEmployees.find(e => e.id === value);
            updated[index] = {
                ...updated[index],
                employeeId: value,
                employeeName: emp?.name || '',
            };
        } else {
            (updated[index] as any)[field] = value;
        }

        // Recalculate total hours
        updated[index].totalHours = calculateEntryTotalHours(updated[index]);

        setEntries(updated);
    };

    // Clone functionality - shows ALL crew members from the project, not just existing entries
    const openCloneModal = (sourceIndex: number) => {
        console.log('=== Opening Clone Modal ===');
        console.log('Source index:', sourceIndex);
        console.log('Source entry:', entries[sourceIndex]);
        console.log('Crew employees available:', crewEmployees);

        setCloneSourceIndex(sourceIndex);
        // Don't pre-select - let user choose
        setCloneTargets([]);
        setIsCloneModalOpen(true);
    };

    // Get crew members not yet in the timesheet OR already in the timesheet but not the source row
    const getAvailableCloneTargets = () => {
        if (cloneSourceIndex === null) return [];
        const sourceEntry = entries[cloneSourceIndex];

        // Include crew members NOT in entries yet
        const existingEmployeeIds = entries.map(e => e.employeeId);
        const notInTimesheet = crewEmployees.filter(emp => !existingEmployeeIds.includes(emp.id));

        // Also include existing entries (except the source)
        const existingOtherEntries = entries.filter((entry, i) => i !== cloneSourceIndex && entry.employeeId);

        // Combine both: new employees + existing entries
        const combined = [
            ...notInTimesheet.map(emp => ({ type: 'new' as const, employeeId: emp.id, employeeName: emp.name, entryId: null })),
            ...existingOtherEntries.map(entry => ({ type: 'existing' as const, employeeId: entry.employeeId, employeeName: entry.employeeName, entryId: entry.id })),
        ];

        console.log('Available clone targets:', combined);
        return combined;
    };

    const applyClone = () => {
        if (cloneSourceIndex === null) return;

        const source = entries[cloneSourceIndex];
        console.log('=== Applying Clone ===');
        console.log('Source:', source);
        console.log('Targets:', cloneTargets); // These are now employee IDs, not entry IDs
        console.log('Entries before:', entries);

        const clonedEntryIds: string[] = [];
        const updatedEntries = [...entries];

        // Process each target
        cloneTargets.forEach(targetId => {
            // Check if this employee already has an entry
            const existingIndex = updatedEntries.findIndex(e => e.employeeId === targetId);

            if (existingIndex >= 0 && existingIndex !== cloneSourceIndex) {
                // Update existing entry
                const entryId = updatedEntries[existingIndex].id;
                clonedEntryIds.push(entryId);
                updatedEntries[existingIndex] = {
                    ...updatedEntries[existingIndex],
                    certifiedIn: source.certifiedIn,
                    certifiedOut: source.certifiedOut,
                    nonCertifiedIn: source.nonCertifiedIn,
                    nonCertifiedOut: source.nonCertifiedOut,
                    totalHours: source.totalHours,
                };
            } else {
                // Create new entry for this employee
                const employee = crewEmployees.find(e => e.id === targetId);
                if (employee) {
                    const newEntryId = crypto.randomUUID();
                    clonedEntryIds.push(newEntryId);
                    updatedEntries.push({
                        id: newEntryId,
                        employeeId: employee.id,
                        employeeName: employee.name,
                        certifiedIn: source.certifiedIn,
                        certifiedOut: source.certifiedOut,
                        nonCertifiedIn: source.nonCertifiedIn,
                        nonCertifiedOut: source.nonCertifiedOut,
                        totalHours: source.totalHours,
                    });
                }
            }
        });

        console.log('Entries after:', updatedEntries);
        console.log('Cloned entry IDs:', clonedEntryIds);

        setEntries(updatedEntries);
        setRecentlyClonedIds(clonedEntryIds);
        setIsCloneModalOpen(false);
        setCloneSourceIndex(null);
        setCloneTargets([]);

        // Show success toast
        toast.success(`Hours cloned to ${cloneTargets.length} employee${cloneTargets.length !== 1 ? 's' : ''}`);

        // Clear highlight after 2 seconds
        setTimeout(() => {
            setRecentlyClonedIds([]);
        }, 2000);
    };

    const toggleCloneTarget = (employeeId: string) => {
        if (cloneTargets.includes(employeeId)) {
            setCloneTargets(cloneTargets.filter(id => id !== employeeId));
        } else {
            setCloneTargets([...cloneTargets, employeeId]);
        }
    };

    const availableTargets = getAvailableCloneTargets();
    const allSelected = availableTargets.length > 0 && cloneTargets.length === availableTargets.length;

    const selectAllCloneTargets = () => {
        setCloneTargets(availableTargets.map(t => t.employeeId));
    };

    const deselectAllCloneTargets = () => {
        setCloneTargets([]);
    };



    // ==================== APPROVAL HELPERS ====================

    const checkCanApprove = (currentStatus: TimesheetStatus, levelNum?: number): boolean => {
        if (currentStatus !== 'Pending Approval' || !role) return false;

        const workflows = getWorkflows();
        const workflow = workflows.find(w => w.isActive && w.assignedForms.includes('timesheet'));

        if (!workflow) return false;

        const currentLevelNum = levelNum || 1;
        const level = workflow.levels.find(l => l.levelNumber === currentLevelNum);

        if (!level) return false;

        const isDirectApprover = level.approverIds.includes(user?.id || '');
        const isRoleApprover = level.approverIds.some(id =>
            id.toLowerCase() === role.toLowerCase() ||
            (role === 'super-admin' && id === 'Admin')
        );

        return isDirectApprover || isRoleApprover;
    };

    const handleApproveTimesheet = (comment: string) => {
        const workflows = getWorkflows();
        const workflow = workflows.find(w => w.isActive && w.assignedForms.includes('timesheet'));

        if (!workflow) return;

        const currentLevelNum = approvalLevel || 1;
        const nextLevel = workflow.levels.find(l => l.levelNumber === currentLevelNum + 1);

        const newHistory = [
            ...(approvalHistory || []),
            {
                level: currentLevelNum,
                status: 'approved' as const,
                byUserId: user?.id || '',
                byUserName: user?.name || 'Unknown',
                date: new Date().toISOString(),
                comment
            }
        ];

        let updates: Partial<Timesheet>;

        if (nextLevel) {
            updates = {
                approvalLevel: currentLevelNum + 1,
                approvalHistory: newHistory,
            };
            setApprovalLevel(currentLevelNum + 1);
            setApprovalHistory(newHistory);

            // Notify next level
            notifyApprovers(
                nextLevel.approverIds,
                'Action Required: Timesheet Approval',
                `Timesheet for ${selectedProject?.name} is ready for Level ${nextLevel.levelNumber} approval.`,
                `/forms/timesheet/${timesheetId}`
            );
            toast.success('Approved and sent to next level');
        } else {
            updates = {
                status: 'Approved',
                approvalHistory: newHistory,
            };
            setStatus('Approved');
            setApprovalHistory(newHistory);

            // Notify submitter (would need submitter ID, for now just log or notify admin/supervisors)
            // If we tracked createdBy, we'd use it. For now, notifying all PMs/Admins or just toast.
            // Assuming we'd notify the person who submitted it if we had that info readily available.
            // We'll notify the project managers as a proxy for "submitter" or interested parties.
            if (selectedProject) {
                notifyApprovers(
                    selectedProject.pmIds,
                    'Timesheet Approved',
                    `Timesheet for ${selectedProject.name} has been fully approved.`,
                    `/forms/timesheet/${timesheetId}`
                );
            }
            toast.success('Timesheet fully approved');
        }

        // Save updates
        if (isEditing) {
            updateTimesheet(timesheetId, updates);
        }
    };

    const handleRejectTimesheet = (reason: string) => {
        const newHistory = [
            ...(approvalHistory || []),
            {
                level: approvalLevel || 1,
                status: 'rejected' as const,
                byUserId: user?.id || '',
                byUserName: user?.name || 'Unknown',
                date: new Date().toISOString(),
                comment: reason
            }
        ];

        const updates: Partial<Timesheet> = {
            status: 'Rejected',
            approvalHistory: newHistory
        };

        setStatus('Rejected');
        setApprovalHistory(newHistory);

        if (isEditing) {
            updateTimesheet(timesheetId, updates);
        }

        // Notify relevant parties (PMs)
        if (selectedProject) {
            notifyApprovers(
                selectedProject.pmIds,
                'Timesheet Rejected',
                `Timesheet for ${selectedProject.name} was rejected. Reason: ${reason}`,
                `/forms/timesheet/${timesheetId}`
            );
        }

        toast.error('Timesheet rejected');
    };

    // Save handlers
    const handleSave = (newStatus: TimesheetStatus) => {
        if (!projectId || !date) return;

        const project = getProjectById(projectId);
        if (!project) return;

        const data = {
            projectId,
            projectName: project.name,
            epNumber: project.epNumber,
            date,
            shiftId,
            shiftName,
            entries,
            notes,
            status: newStatus,
            approvalLevel: approvalLevel,
            approvalHistory: approvalHistory,
            submittedAt: newStatus === 'Pending Approval' ? new Date().toISOString() : null,
            submittedBy: newStatus === 'Pending Approval' ? (user?.name || 'Current User') : null,
        };

        if (isEditing) {
            updateTimesheet(timesheetId, data);
        } else {
            addTimesheet(data);
        }

        // Notify if submitting for approval
        if (newStatus === 'Pending Approval' && status !== 'Pending Approval') {
            const workflows = getWorkflows();
            const workflow = workflows.find(w => w.isActive && w.assignedForms.includes('timesheet'));

            if (workflow && workflow.levels.length > 0) {
                const firstLevel = workflow.levels[0];
                notifyApprovers(
                    firstLevel.approverIds,
                    'New Timesheet Pending Approval',
                    `A new timesheet for ${project.name} has been submitted.`,
                    `/forms/timesheet/${isEditing ? timesheetId : 'new'}` // Ideally we'd get the new ID but 'new' might not work for link. On edit it works. 
                    // Valid point: if creating new, we don't have ID yet in current scope easily without return from addTimesheet. 
                    // But we redirect to list anyway.
                );
            }
        }

        router.push('/forms/timesheet');
    };

    const getTotalHours = () => {
        return entries.reduce((sum, e) => sum + (e.totalHours || 0), 0).toFixed(2);
    };

    const isReadOnly = status === 'Approved' || status === 'Pending Approval';

    return (
        <PageWrapper
            title={isEditing ? 'Edit Timesheet' : 'New Timesheet'}
            description={isEditing ? `Editing timesheet for ${selectedProject?.name || ''}` : 'Create a new daily timesheet'}
        >
            <div className="p-6">
                {/* Approval UI */}
                {status === 'Pending Approval' && (
                    <div className="mb-6">
                        <ApprovalActions
                            status={status}
                            canApprove={checkCanApprove(status, approvalLevel)}
                            onApprove={handleApproveTimesheet}
                            onReject={handleRejectTimesheet}
                        />
                    </div>
                )}

                {/* Header Actions */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => router.push('/forms/timesheet')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Timesheets
                    </Button>

                    <div className="flex items-center gap-3">
                        <Badge className={STATUS_COLORS[status]}>{status}</Badge>
                        {!isReadOnly && (
                            <>
                                <Button variant="outline" onClick={() => handleSave('Draft')}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save as Draft
                                </Button>
                                <Button onClick={() => handleSave('Pending Approval')}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit for Approval
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {/* Header Section */}
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800 mb-4">Timesheet Details</h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Project *</Label>
                                <Select value={projectId} onValueChange={handleProjectChange} disabled={isReadOnly}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.epNumber})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Shift</Label>
                                <Select value={shiftId} onValueChange={handleShiftChange} disabled={isReadOnly}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select shift" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shiftOptions.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Project Info Card */}
                    {projectId && (
                        <div className="p-6 border-b border-slate-200">
                            <ProjectInfoCard projectId={projectId} />
                        </div>
                    )}

                    {/* Time Entries */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-slate-800">Employee Time Entries</h3>
                                <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    Total: {getTotalHours()} hrs
                                </Badge>
                            </div>
                            {!isReadOnly && (
                                <Button type="button" variant="outline" size="sm" onClick={addEntry} disabled={!projectId}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Employee
                                </Button>
                            )}
                        </div>

                        {entries.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 border border-dashed rounded-lg">
                                {projectId
                                    ? 'No time entries. Click "Add Employee" to start.'
                                    : 'Select a project first to add time entries.'}
                            </div>
                        ) : (
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Employee</TableHead>
                                            <TableHead className="text-center">Certified IN</TableHead>
                                            <TableHead className="text-center">Certified OUT</TableHead>
                                            <TableHead className="text-center">Non-Cert IN</TableHead>
                                            <TableHead className="text-center">Non-Cert OUT</TableHead>
                                            <TableHead className="text-center">Total Hrs</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entries.map((entry, index) => (
                                            <TableRow
                                                key={entry.id}
                                                className={
                                                    recentlyClonedIds.includes(entry.id)
                                                        ? 'bg-green-100 animate-pulse transition-colors duration-1000'
                                                        : ''
                                                }
                                            >
                                                <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={entry.employeeId}
                                                        onValueChange={(v) => updateEntry(index, 'employeeId', v)}
                                                        disabled={isReadOnly}
                                                    >
                                                        <SelectTrigger className="w-44">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {crewEmployees.map(emp => (
                                                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="time"
                                                        value={entry.certifiedIn}
                                                        onChange={(e) => updateEntry(index, 'certifiedIn', e.target.value)}
                                                        className="w-28"
                                                        disabled={isReadOnly}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="time"
                                                        value={entry.certifiedOut}
                                                        onChange={(e) => updateEntry(index, 'certifiedOut', e.target.value)}
                                                        className="w-28"
                                                        disabled={isReadOnly}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="time"
                                                        value={entry.nonCertifiedIn}
                                                        onChange={(e) => updateEntry(index, 'nonCertifiedIn', e.target.value)}
                                                        className="w-28"
                                                        disabled={isReadOnly}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="time"
                                                        value={entry.nonCertifiedOut}
                                                        onChange={(e) => updateEntry(index, 'nonCertifiedOut', e.target.value)}
                                                        className="w-28"
                                                        disabled={isReadOnly}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-medium">
                                                    {entry.totalHours.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!isReadOnly && (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openCloneModal(index)}
                                                                className="h-8 w-8 p-0"
                                                                title="Clone to other employees"
                                                                disabled={crewEmployees.length <= 1}
                                                            >
                                                                <Copy className="h-4 w-4 text-blue-500" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeEntry(index)}
                                                                className="h-8 w-8 p-0 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    {/* Notes Section */}
                    <div className="p-6 border-t border-slate-200">
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any notes for this timesheet..."
                                rows={3}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Clone Modal */}
            <Dialog open={isCloneModalOpen} onOpenChange={setIsCloneModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Copy className="h-5 w-5 text-blue-600" />
                            Clone Time Entry
                        </DialogTitle>
                        <DialogDescription>
                            Copy hours from <span className="font-semibold text-slate-700">{cloneSourceIndex !== null && entries[cloneSourceIndex]?.employeeName}</span> to other employees
                        </DialogDescription>
                    </DialogHeader>

                    {/* Source Hours Preview */}
                    {cloneSourceIndex !== null && entries[cloneSourceIndex] && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Hours to copy</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500">Certified:</span>
                                    <span className="font-mono font-semibold text-slate-800">
                                        {entries[cloneSourceIndex].certifiedIn || '--:--'} - {entries[cloneSourceIndex].certifiedOut || '--:--'}
                                    </span>
                                </div>
                                {(entries[cloneSourceIndex].nonCertifiedIn || entries[cloneSourceIndex].nonCertifiedOut) && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">Non-Cert:</span>
                                        <span className="font-mono font-semibold text-slate-800">
                                            {entries[cloneSourceIndex].nonCertifiedIn || '--:--'} - {entries[cloneSourceIndex].nonCertifiedOut || '--:--'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 pt-2 border-t border-blue-100">
                                <span className="text-xs text-slate-500">Total: </span>
                                <span className="font-mono font-bold text-blue-700">{entries[cloneSourceIndex].totalHours.toFixed(2)} hrs</span>
                            </div>
                        </div>
                    )}

                    <div className="py-2">
                        {/* Select All */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                            <Label className="text-sm font-medium">Select employees to receive hours:</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={allSelected ? deselectAllCloneTargets : selectAllCloneTargets}
                                className="text-xs h-7"
                            >
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>

                        {/* Employee List - Shows ALL project crew members */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableTargets.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p className="text-sm">No other employees available to clone to.</p>
                                    <p className="text-xs mt-1">Assign more employees to this project first.</p>
                                </div>
                            ) : (
                                availableTargets.map((target) => (
                                    <label
                                        key={target.employeeId}
                                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${cloneTargets.includes(target.employeeId)
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'hover:bg-slate-50 border-slate-200'
                                            }`}
                                    >
                                        <Checkbox
                                            checked={cloneTargets.includes(target.employeeId)}
                                            onCheckedChange={() => toggleCloneTarget(target.employeeId)}
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-800">{target.employeeName}</span>
                                            {target.type === 'new' && (
                                                <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">New</span>
                                            )}
                                            {target.type === 'existing' && (
                                                <span className="ml-2 text-xs text-slate-400">(already in timesheet)</span>
                                            )}
                                        </div>
                                        {cloneTargets.includes(target.employeeId) && (
                                            <Check className="h-4 w-4 text-blue-600" />
                                        )}
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsCloneModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={applyClone}
                            disabled={cloneTargets.length === 0}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Apply to {cloneTargets.length} Selected
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageWrapper>
    );
}
