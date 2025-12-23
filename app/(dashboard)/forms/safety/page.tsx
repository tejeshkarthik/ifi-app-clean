'use client';

import { useState, useEffect, useRef } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    getJHAs,
    saveJHA,
    deleteJHA,
    getEmptyJHA,
    generateJHAFormNo,
    getDefaultTasks,
    saveDefaultTasks,
    createInitialTasks,
    type JHA,
    type JHATask,
    type JHACrewMember,
} from '@/lib/jha-storage';
import { getProjects, getProjectById, type Project } from '@/lib/project-storage';
import { getEmployees, type Employee } from '@/lib/employee-storage';
import { getActiveLookupValues } from '@/lib/lookup-storage';
import { toast } from 'sonner';
import {
    Search,
    Plus,
    Trash2,
    Settings,
    FileText,
    ArrowLeft,
    Save,
    Send,
    Eye,
    ShieldCheck,
    Users,
    ClipboardCheck,
} from 'lucide-react';

// ==================== CONSTANTS ====================

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
    pending: { label: 'Pending Approval', className: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
};

// ==================== MAIN COMPONENT ====================

export default function SafetyJHAPage() {
    // List state
    const [jhas, setJHAs] = useState<JHA[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProject, setFilterProject] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [currentJHA, setCurrentJHA] = useState<JHA | null>(null);

    // Configure panel state
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [defaultTasks, setDefaultTasks] = useState<any[]>([]);
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskHazard, setNewTaskHazard] = useState('');

    // Data sources
    const [projects, setProjects] = useState<Project[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shiftOptions, setShiftOptions] = useState<{ id: string; name: string }[]>([]);
    const [projectCrew, setProjectCrew] = useState<Employee[]>([]);

    // Form data
    const [formData, setFormData] = useState<any>({});

    // Signature canvas
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setJHAs(getJHAs());
        setProjects(getProjects().filter(p => !p.isDraft));
        setEmployees(getEmployees().filter(e => e.isActive));
        setShiftOptions(getActiveLookupValues('shift_types').map(v => ({ id: v.id, name: v.name })));
        setDefaultTasks(getDefaultTasks());
    };

    // ==================== FILTERING ====================

    const filteredJHAs = jhas.filter(jha => {
        if (filterProject !== 'all' && jha.projectId !== filterProject) return false;
        if (filterStatus !== 'all' && jha.status !== filterStatus) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                jha.projectName.toLowerCase().includes(q) ||
                jha.epNumber.toLowerCase().includes(q) ||
                jha.completedByName.toLowerCase().includes(q) ||
                jha.formNo.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // ==================== FORM HANDLERS ====================

    const openNewForm = () => {
        const today = new Date().toISOString().split('T')[0];
        const emptyJHA = getEmptyJHA(today);
        setFormData({
            id: crypto.randomUUID(),
            ...emptyJHA,
        });
        setCurrentJHA(null);
        setIsViewMode(false);
        setIsFormOpen(true);
        setProjectCrew([]);

        // Clear signature canvas
        setTimeout(() => {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            }
        }, 100);
    };

    const openEditForm = (jha: JHA, viewOnly = false) => {
        setFormData({ ...jha });
        setCurrentJHA(jha);
        setIsViewMode(viewOnly || jha.status === 'approved' || jha.status === 'pending');
        setIsFormOpen(true);

        // Load project crew
        const project = getProjectById(jha.projectId);
        if (project) {
            loadProjectCrew(project);
        }

        // Load signature
        setTimeout(() => {
            if (canvasRef.current && jha.signature) {
                const ctx = canvasRef.current.getContext('2d');
                const img = new Image();
                img.onload = () => {
                    ctx?.drawImage(img, 0, 0);
                };
                img.src = jha.signature;
            }
        }, 100);
    };

    const handleProjectChange = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setFormData((prev: any) => ({
                ...prev,
                projectId,
                projectName: project.name,
                epNumber: project.epNumber,
                location: `${project.city}, ${project.state}`,
            }));
            loadProjectCrew(project);
        }
    };

    const loadProjectCrew = (project: Project) => {
        const crewIds = [
            ...(project.supervisorIds || []),
            ...(project.leadIds || []),
            ...(project.workerIds || []),
        ];
        const crew = employees.filter(e => crewIds.includes(e.id));
        setProjectCrew(crew);

        // Initialize crew attendance if empty
        if (!formData.crewAttendance || formData.crewAttendance.length === 0) {
            const attendance: JHACrewMember[] = crew.map(e => ({
                employeeId: e.id,
                employeeName: e.name,
                attended: false,
            }));
            setFormData((prev: any) => ({ ...prev, crewAttendance: attendance }));
        }
    };

    // Get supervisors for "Completed By" dropdown
    const getSupervisors = () => {
        return employees.filter(e =>
            e.isActive && (e.role === 'Supervisor' || e.craftName?.toLowerCase().includes('foreman'))
        );
    };

    // Task handlers
    const addTask = () => {
        const tasks = formData.tasks || [];
        const newTask: JHATask = {
            id: crypto.randomUUID(),
            taskNo: tasks.length + 1,
            description: '',
            hazards: '',
            isDefault: false,
        };
        setFormData((prev: any) => ({ ...prev, tasks: [...tasks, newTask] }));
    };

    const updateTask = (id: string, field: keyof JHATask, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            tasks: prev.tasks.map((t: JHATask) =>
                t.id === id ? { ...t, [field]: value } : t
            ),
        }));
    };

    const removeTask = (id: string) => {
        setFormData((prev: any) => {
            const tasks = prev.tasks.filter((t: JHATask) => t.id !== id);
            // Renumber
            return {
                ...prev,
                tasks: tasks.map((t: JHATask, i: number) => ({ ...t, taskNo: i + 1 })),
            };
        });
    };

    // Crew attendance handlers
    const toggleCrewMember = (employeeId: string) => {
        setFormData((prev: any) => {
            const attendance = prev.crewAttendance.map((a: JHACrewMember) =>
                a.employeeId === employeeId ? { ...a, attended: !a.attended } : a
            );
            const crewCount = attendance.filter((a: JHACrewMember) => a.attended).length;
            return { ...prev, crewAttendance: attendance, crewCount };
        });
    };

    const selectAllCrew = (selectAll: boolean) => {
        setFormData((prev: any) => {
            const attendance = prev.crewAttendance.map((a: JHACrewMember) => ({
                ...a,
                attended: selectAll,
            }));
            const crewCount = selectAll ? attendance.length : 0;
            return { ...prev, crewAttendance: attendance, crewCount };
        });
    };

    // Signature canvas handlers
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (isViewMode) return;
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || isViewMode) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const getSignatureData = () => {
        const canvas = canvasRef.current;
        if (!canvas) return '';
        return canvas.toDataURL('image/png');
    };

    // Save handlers
    const handleSave = (submitForApproval = false) => {
        // Validation
        if (!formData.projectId) {
            toast.error('Please select a project');
            return;
        }
        if (!formData.date) {
            toast.error('Please select a date');
            return;
        }
        if (!formData.completedById) {
            toast.error('Please select who completed the form');
            return;
        }

        const tasksWithContent = formData.tasks.filter((t: JHATask) => t.description && t.hazards);
        if (tasksWithContent.length === 0) {
            toast.error('At least one task with description and hazards is required');
            return;
        }

        const attendedCount = formData.crewAttendance.filter((a: JHACrewMember) => a.attended).length;
        if (attendedCount === 0) {
            toast.error('At least one crew member must be marked as attended');
            return;
        }

        if (submitForApproval) {
            const signature = getSignatureData();
            if (!signature || signature === canvasRef.current?.toDataURL()) {
                // Check if canvas is blank
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                    const isBlank = imageData?.data.every((val, i) => i % 4 === 3 || val === 255);
                    if (isBlank) {
                        toast.error('Signature is required to submit');
                        return;
                    }
                }
            }
        }

        const jha: JHA = {
            ...formData,
            signature: getSignatureData(),
            signedName: formData.completedByName,
            signedDate: new Date().toISOString(),
            status: submitForApproval ? 'pending' : 'draft',
            crewCount: formData.crewAttendance.filter((a: JHACrewMember) => a.attended).length,
        };

        saveJHA(jha);
        loadData();
        setIsFormOpen(false);
        toast.success(submitForApproval ? 'Submitted for approval' : 'Saved as draft');
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this JHA form?')) {
            deleteJHA(id);
            loadData();
            toast.success('JHA form deleted');
        }
    };

    // ==================== CONFIGURE PANEL ====================

    const addDefaultTask = () => {
        if (!newTaskDesc.trim()) return;
        const updated = [...defaultTasks, {
            taskNo: defaultTasks.length + 1,
            description: newTaskDesc.trim(),
            hazards: newTaskHazard.trim(),
            isDefault: true,
        }];
        saveDefaultTasks(updated);
        setDefaultTasks(updated);
        setNewTaskDesc('');
        setNewTaskHazard('');
    };

    const removeDefaultTask = (index: number) => {
        const updated = defaultTasks.filter((_, i) => i !== index).map((t, i) => ({ ...t, taskNo: i + 1 }));
        saveDefaultTasks(updated);
        setDefaultTasks(updated);
    };

    // ==================== RENDER ====================

    if (isFormOpen) {
        const attendedCount = formData.crewAttendance?.filter((a: JHACrewMember) => a.attended).length || 0;
        const totalCrew = formData.crewAttendance?.length || 0;

        return (
            <PageWrapper title="OSHA Job Hazard Analysis (JHA)" description={isViewMode ? 'View JHA details' : (currentJHA ? 'Edit JHA' : 'Create new JHA')}>
                <div className="p-6">
                    {/* Form Header */}
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Safety Forms
                        </Button>
                        <div className="flex items-center gap-2">
                            {formData.status && (
                                <Badge className={STATUS_BADGES[formData.status]?.className}>
                                    {STATUS_BADGES[formData.status]?.label}
                                </Badge>
                            )}
                            {!isViewMode && (
                                <>
                                    <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                    <Button variant="outline" onClick={() => handleSave(false)}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save as Draft
                                    </Button>
                                    <Button onClick={() => handleSave(true)}>
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit for Approval
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 max-w-5xl mx-auto">
                        {/* Section 1: Form Information */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5 text-blue-600" />
                                Form Information
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>JHA Form No.</Label>
                                    <Input value={formData.formNo} readOnly className="bg-slate-100 font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => {
                                            const newDate = e.target.value;
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                date: newDate,
                                                formNo: generateJHAFormNo(newDate),
                                            }));
                                        }}
                                        disabled={isViewMode}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Project *</Label>
                                    <Select
                                        value={formData.projectId}
                                        onValueChange={handleProjectChange}
                                        disabled={isViewMode}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select project..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Location / EP Number</Label>
                                    <Input
                                        value={formData.epNumber ? `EP ${formData.epNumber} - ${formData.location || ''}` : ''}
                                        readOnly
                                        className="bg-slate-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Job Description</Label>
                                    <Input
                                        value={formData.jobDescription}
                                        onChange={e => setFormData((prev: any) => ({ ...prev, jobDescription: e.target.value }))}
                                        disabled={isViewMode}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Time</Label>
                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            type="button"
                                            variant={formData.timeOfDay === 'AM' ? 'default' : 'outline'}
                                            onClick={() => setFormData((prev: any) => ({ ...prev, timeOfDay: 'AM' }))}
                                            disabled={isViewMode}
                                            className="w-16"
                                        >
                                            AM
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={formData.timeOfDay === 'PM' ? 'default' : 'outline'}
                                            onClick={() => setFormData((prev: any) => ({ ...prev, timeOfDay: 'PM' }))}
                                            disabled={isViewMode}
                                            className="w-16"
                                        >
                                            PM
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Shift</Label>
                                    <Select
                                        value={formData.shiftId}
                                        onValueChange={v => {
                                            const shift = shiftOptions.find(s => s.id === v);
                                            setFormData((prev: any) => ({ ...prev, shiftId: v, shiftName: shift?.name || '' }));
                                        }}
                                        disabled={isViewMode}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select shift..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {shiftOptions.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Form Completed By *</Label>
                                    <Select
                                        value={formData.completedById}
                                        onValueChange={v => {
                                            const emp = employees.find(e => e.id === v);
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                completedById: v,
                                                completedByName: emp?.name || '',
                                            }));
                                        }}
                                        disabled={isViewMode}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select supervisor..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map(e => (
                                                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Project Info Card */}
                        {formData.projectId && (
                            <ProjectInfoCard projectId={formData.projectId} />
                        )}

                        {/* Section 3: Task & Hazard Analysis */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-orange-600" />
                                        Task & Hazard Analysis
                                    </h3>
                                    <p className="text-sm text-slate-500">Identify tasks and potential hazards for today's work</p>
                                </div>
                                {!isViewMode && (
                                    <Button variant="outline" size="sm" onClick={addTask}>
                                        <Plus className="h-4 w-4 mr-1" /> Add Task
                                    </Button>
                                )}
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="w-20">Task #</TableHead>
                                        <TableHead>Description of Task</TableHead>
                                        <TableHead>Potential Hazards</TableHead>
                                        {!isViewMode && <TableHead className="w-16">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(formData.tasks || []).map((task: JHATask, index: number) => (
                                        <TableRow key={task.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                            <TableCell className="font-medium text-center">{task.taskNo}</TableCell>
                                            <TableCell>
                                                <Input
                                                    value={task.description}
                                                    onChange={e => updateTask(task.id, 'description', e.target.value)}
                                                    disabled={isViewMode}
                                                    className="border-0 bg-transparent focus:bg-white focus:border"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={task.hazards}
                                                    onChange={e => updateTask(task.id, 'hazards', e.target.value)}
                                                    disabled={isViewMode}
                                                    className="border-0 bg-transparent focus:bg-white focus:border"
                                                />
                                            </TableCell>
                                            {!isViewMode && (
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeTask(task.id)}
                                                        className="hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="mt-4 space-y-2">
                                <Label>Additional Safety Notes</Label>
                                <Textarea
                                    value={formData.additionalNotes}
                                    onChange={e => setFormData((prev: any) => ({ ...prev, additionalNotes: e.target.value }))}
                                    disabled={isViewMode}
                                    rows={3}
                                    placeholder="Night time visibility, cool down breaks, special instructions..."
                                />
                            </div>
                        </div>

                        {/* Section 4: Crew Attendance */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Users className="h-5 w-5 text-green-600" />
                                        Crew Attendance - Safety Briefing
                                    </h3>
                                    <p className="text-sm text-slate-500">Select all workers who attended this safety briefing</p>
                                </div>
                                <Badge variant="outline" className="text-sm">
                                    {attendedCount} of {totalCrew} selected
                                </Badge>
                            </div>

                            {totalCrew === 0 ? (
                                <div className="text-center py-8 text-slate-500 border border-dashed rounded-lg">
                                    Select a project to load crew members
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 pb-3 border-b mb-4">
                                        <Checkbox
                                            checked={attendedCount === totalCrew && totalCrew > 0}
                                            onCheckedChange={checked => selectAllCrew(!!checked)}
                                            disabled={isViewMode}
                                        />
                                        <Label className="font-semibold">Select All</Label>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {formData.crewAttendance?.map((member: JHACrewMember) => (
                                            <div
                                                key={member.employeeId}
                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${member.attended
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Checkbox
                                                    checked={member.attended}
                                                    onCheckedChange={() => toggleCrewMember(member.employeeId)}
                                                    disabled={isViewMode}
                                                />
                                                <span className={member.attended ? 'font-medium text-green-800' : 'text-slate-700'}>
                                                    {member.employeeName}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Section 5: Signature */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Supervisor Signature</h3>
                            <div className="space-y-4">
                                <div className="relative">
                                    <canvas
                                        ref={canvasRef}
                                        width={500}
                                        height={150}
                                        className="border-2 border-slate-300 rounded-lg w-full max-w-[500px] bg-white cursor-crosshair"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                    />
                                    {!isViewMode && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearSignature}
                                            className="absolute top-2 right-2"
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-w-[500px]">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500">Printed Name</Label>
                                        <Input value={formData.completedByName || ''} readOnly className="bg-slate-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500">Date Signed</Label>
                                        <Input value={new Date().toLocaleDateString()} readOnly className="bg-slate-100" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    // ==================== LIST VIEW ====================

    return (
        <PageWrapper title="OSHA Job Hazard Analysis (JHA)" description="Daily safety briefing documentation">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Select value={filterProject} onValueChange={setFilterProject}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending">Pending Approval</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsConfigOpen(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                        </Button>
                        <Button onClick={openNewForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            New JHA
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Date</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>EP#</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead>Completed By</TableHead>
                                <TableHead className="text-center">Crew</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredJHAs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                        No JHA forms found. Click "New JHA" to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredJHAs.map(jha => (
                                    <TableRow key={jha.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">
                                            {new Date(jha.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{jha.projectName}</TableCell>
                                        <TableCell className="font-mono text-sm">{jha.epNumber}</TableCell>
                                        <TableCell>{jha.shiftName}</TableCell>
                                        <TableCell>{jha.completedByName}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline">{jha.crewCount}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_BADGES[jha.status]?.className}>
                                                {STATUS_BADGES[jha.status]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEditForm(jha, true)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditForm(jha)}
                                                    disabled={jha.status === 'approved'}
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(jha.id)}
                                                    disabled={jha.status === 'approved'}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 text-sm text-slate-500">
                    {filteredJHAs.length} form{filteredJHAs.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Configure Panel */}
            <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <SheetContent className="w-[500px] sm:max-w-[500px]">
                    <SheetHeader>
                        <SheetTitle>Configure JHA Defaults</SheetTitle>
                        <SheetDescription>Manage default tasks that appear on every new JHA form</SheetDescription>
                    </SheetHeader>
                    <Tabs defaultValue="tasks" className="mt-6">
                        <TabsList className="grid grid-cols-2 w-full">
                            <TabsTrigger value="tasks">Default Tasks</TabsTrigger>
                            <TabsTrigger value="hazards">Common Hazards</TabsTrigger>
                        </TabsList>
                        <TabsContent value="tasks" className="mt-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        placeholder="Task description..."
                                        value={newTaskDesc}
                                        onChange={e => setNewTaskDesc(e.target.value)}
                                    />
                                    <Input
                                        placeholder="Default hazard..."
                                        value={newTaskHazard}
                                        onChange={e => setNewTaskHazard(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="sm" onClick={addDefaultTask} className="w-full">
                                    <Plus className="h-4 w-4 mr-1" /> Add Default Task
                                </Button>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {defaultTasks.map((task, index) => (
                                        <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-slate-50">
                                            <span className="text-sm font-medium text-slate-500 w-6">{index + 1}.</span>
                                            <div className="flex-1 text-sm">
                                                <div className="font-medium">{task.description}</div>
                                                <div className="text-slate-500">{task.hazards}</div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeDefaultTask(index)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="hazards" className="mt-4">
                            <div className="text-sm text-slate-500 text-center py-8">
                                Common hazards list for autocomplete suggestions.
                                <br />
                                <span className="text-xs">(Coming soon)</span>
                            </div>
                        </TabsContent>
                    </Tabs>
                </SheetContent>
            </Sheet>
        </PageWrapper>
    );
}
