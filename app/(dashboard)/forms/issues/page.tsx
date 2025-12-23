'use client';

import { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { ProjectInfoCard } from '@/components/project-info-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
    getIssuesLogs,
    saveIssuesLog,
    deleteIssuesLog,
    type IssuesLog,
} from '@/lib/forms-storage';
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
    AlertTriangle,
    Camera,
    X,
    Clock,
} from 'lucide-react';

// ==================== INTERFACES ====================

interface Project {
    id: string;
    name: string;
}

interface Employee {
    id: string;
    name: string;
    isActive: boolean;
}

interface LookupValue {
    id: string;
    name: string;
    isActive: boolean;
}

// ==================== STATUS HELPERS ====================

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
};

// ==================== MAIN COMPONENT ====================

export default function IssuesLogPage() {
    // List state
    const [logs, setLogs] = useState<IssuesLog[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProject, setFilterProject] = useState<string>('all');
    const [filterIssueType, setFilterIssueType] = useState<string>('all');
    const [filterFlag, setFilterFlag] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [currentLog, setCurrentLog] = useState<IssuesLog | null>(null);

    // Configure panel state
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [newLookupItem, setNewLookupItem] = useState<Record<string, string>>({});

    // Data sources
    const [projects, setProjects] = useState<Project[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [lookupValues, setLookupValues] = useState<Record<string, LookupValue[]>>({});

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form data
    const [formData, setFormData] = useState<Partial<IssuesLog>>({
        projectId: '',
        projectName: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        issueTypeId: '',
        issueTypeName: '',
        flag: 'normal',
        description: '',
        temperature: null,
        hasRain: false,
        rainDuration: '',
        hasPlantBreakdown: false,
        plantBreakdownDuration: '',
        photos: [],
        reportedById: '',
        reportedByName: '',
        notes: '',
        status: 'draft',
    });

    useEffect(() => {
        loadLogs();
        loadProjects();
        loadEmployees();
        loadLookupValues();
    }, []);

    const loadLogs = () => setLogs(getIssuesLogs());

    const loadProjects = () => {
        const stored = localStorage.getItem('ifi_projects');
        setProjects(stored ? JSON.parse(stored) : []);
    };

    const loadEmployees = () => {
        const stored = localStorage.getItem('ifi_employees');
        setEmployees(stored ? JSON.parse(stored) : []);
    };

    const loadLookupValues = () => {
        const stored = localStorage.getItem('ifi_lookup_values');
        setLookupValues(stored ? JSON.parse(stored) : {});
    };

    const saveLookupValues = (values: Record<string, LookupValue[]>) => {
        localStorage.setItem('ifi_lookup_values', JSON.stringify(values));
        setLookupValues(values);
    };

    // ==================== FILTERING ====================

    const filteredLogs = logs.filter(log => {
        if (filterProject !== 'all' && log.projectId !== filterProject) return false;
        if (filterIssueType !== 'all' && log.issueTypeId !== filterIssueType) return false;
        if (filterFlag !== 'all' && log.flag !== filterFlag) return false;
        if (filterStatus !== 'all' && log.status !== filterStatus) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                log.projectName.toLowerCase().includes(q) ||
                log.description.toLowerCase().includes(q) ||
                log.issueTypeName.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // ==================== FORM HANDLERS ====================

    const openNewForm = () => {
        setFormData({
            projectId: '',
            projectName: '',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
            issueTypeId: '',
            issueTypeName: '',
            flag: 'normal',
            description: '',
            temperature: null,
            hasRain: false,
            rainDuration: '',
            hasPlantBreakdown: false,
            plantBreakdownDuration: '',
            photos: [],
            reportedById: '',
            reportedByName: '',
            notes: '',
            status: 'draft',
        });
        setCurrentLog(null);
        setIsViewMode(false);
        setIsFormOpen(true);
    };

    const openEditForm = (log: IssuesLog, viewOnly = false) => {
        setFormData({ ...log });
        setCurrentLog(log);
        setIsViewMode(viewOnly || log.status === 'approved' || log.status === 'pending');
        setIsFormOpen(true);
    };

    const handleProjectChange = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setFormData(prev => ({
                ...prev,
                projectId,
                projectName: project.name,
            }));
        }
    };

    const handleIssueTypeChange = (typeId: string) => {
        const type = lookupValues.issue_types?.find(t => t.id === typeId);
        setFormData(prev => ({
            ...prev,
            issueTypeId: typeId,
            issueTypeName: type?.name || '',
        }));
    };

    const handleReportedByChange = (employeeId: string) => {
        const emp = employees.find(e => e.id === employeeId);
        setFormData(prev => ({
            ...prev,
            reportedById: employeeId,
            reportedByName: emp?.name || '',
        }));
    };

    // Photo handlers
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({
                    ...prev,
                    photos: [...(prev.photos || []), event.target?.result as string],
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setFormData(prev => ({
            ...prev,
            photos: (prev.photos || []).filter((_, i) => i !== index),
        }));
    };

    // Save handlers
    const handleSave = (submitForApproval = false) => {
        if (!formData.projectId) {
            toast.error('Please select a project');
            return;
        }
        if (!formData.description?.trim()) {
            toast.error('Please enter a description');
            return;
        }

        const log: IssuesLog = {
            id: currentLog?.id || crypto.randomUUID(),
            projectId: formData.projectId!,
            projectName: formData.projectName!,
            date: formData.date!,
            time: formData.time!,
            issueTypeId: formData.issueTypeId || '',
            issueTypeName: formData.issueTypeName || '',
            flag: formData.flag || 'normal',
            description: formData.description!,
            temperature: formData.temperature ?? null,
            hasRain: formData.hasRain || false,
            rainDuration: formData.rainDuration || '',
            hasPlantBreakdown: formData.hasPlantBreakdown || false,
            plantBreakdownDuration: formData.plantBreakdownDuration || '',
            photos: formData.photos || [],
            reportedById: formData.reportedById || '',
            reportedByName: formData.reportedByName || '',
            notes: formData.notes || '',
            status: submitForApproval ? 'pending' : 'draft',
            createdAt: currentLog?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        saveIssuesLog(log);
        loadLogs();
        setIsFormOpen(false);
        toast.success(submitForApproval ? 'Submitted for approval' : 'Saved as draft');
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this issue?')) {
            deleteIssuesLog(id);
            loadLogs();
            toast.success('Issue deleted');
        }
    };

    // ==================== CONFIGURE PANEL ====================

    const addLookupItem = (key: string) => {
        const name = newLookupItem[key]?.trim();
        if (!name) return;
        const updated = { ...lookupValues };
        if (!updated[key]) updated[key] = [];
        updated[key].push({ id: crypto.randomUUID(), name, isActive: true });
        saveLookupValues(updated);
        setNewLookupItem(prev => ({ ...prev, [key]: '' }));
    };

    const toggleLookupItem = (key: string, id: string) => {
        const updated = { ...lookupValues };
        updated[key] = updated[key].map(item =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
        );
        saveLookupValues(updated);
    };

    const deleteLookupItem = (key: string, id: string) => {
        const updated = { ...lookupValues };
        updated[key] = updated[key].filter(item => item.id !== id);
        saveLookupValues(updated);
    };

    // ==================== RENDER ====================

    if (isFormOpen) {
        const isUrgent = formData.flag === 'urgent';

        return (
            <PageWrapper title="Issues Log" description={isViewMode ? 'View issue details' : (currentLog ? 'Edit issue' : 'Report new issue')}>
                <div className="p-6">
                    {/* Form Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to List
                            </Button>
                            {isUrgent && (
                                <Badge className="bg-red-500 text-white">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    URGENT
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {formData.status && (
                                <Badge className={STATUS_BADGES[formData.status]?.className}>
                                    {STATUS_BADGES[formData.status]?.label}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className={`space-y-8 max-w-4xl mx-auto ${isUrgent ? 'border-l-4 border-red-500 pl-6' : ''}`}>
                        {/* Main Section */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Issue Details</h3>
                            <div className="grid grid-cols-3 gap-4">
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
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                        disabled={isViewMode}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Time</Label>
                                    <Input
                                        type="time"
                                        value={formData.time}
                                        onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                        disabled={isViewMode}
                                    />
                                </div>
                            </div>

                            {/* Project Info Card */}
                            {formData.projectId && (
                                <div className="mt-4">
                                    <ProjectInfoCard projectId={formData.projectId} />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Issue Type</Label>
                                    <Select
                                        value={formData.issueTypeId}
                                        onValueChange={handleIssueTypeChange}
                                        disabled={isViewMode}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(lookupValues.issue_types || []).filter(t => t.isActive).map(type => (
                                                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Flag</Label>
                                    <div className="flex gap-4 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="flag"
                                                value="normal"
                                                checked={formData.flag === 'normal'}
                                                onChange={() => setFormData(prev => ({ ...prev, flag: 'normal' }))}
                                                disabled={isViewMode}
                                                className="w-4 h-4"
                                            />
                                            <span>Normal</span>
                                        </label>
                                        <label className={`flex items-center gap-2 cursor-pointer ${formData.flag === 'urgent' ? 'text-red-600 font-medium' : ''}`}>
                                            <input
                                                type="radio"
                                                name="flag"
                                                value="urgent"
                                                checked={formData.flag === 'urgent'}
                                                onChange={() => setFormData(prev => ({ ...prev, flag: 'urgent' }))}
                                                disabled={isViewMode}
                                                className="w-4 h-4 accent-red-500"
                                            />
                                            <AlertTriangle className={`h-4 w-4 ${formData.flag === 'urgent' ? 'text-red-500' : 'text-slate-400'}`} />
                                            <span>Urgent</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <Label>Description *</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    disabled={isViewMode}
                                    placeholder="Describe the issue in detail..."
                                    className={isUrgent ? 'border-red-300 focus-visible:ring-red-500' : ''}
                                />
                            </div>
                        </div>

                        {/* Jobsite Conditions */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Jobsite Conditions</h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label>Temperature (°F)</Label>
                                    <Input
                                        type="number"
                                        value={formData.temperature ?? ''}
                                        onChange={e => setFormData(prev => ({
                                            ...prev,
                                            temperature: e.target.value ? parseFloat(e.target.value) : null
                                        }))}
                                        disabled={isViewMode}
                                        placeholder="65"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Rain</Label>
                                        <Switch
                                            checked={formData.hasRain}
                                            onCheckedChange={v => setFormData(prev => ({ ...prev, hasRain: v, rainDuration: v ? prev.rainDuration : '' }))}
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    {formData.hasRain && (
                                        <Input
                                            value={formData.rainDuration}
                                            onChange={e => setFormData(prev => ({ ...prev, rainDuration: e.target.value }))}
                                            disabled={isViewMode}
                                            placeholder="Duration (e.g., 2 hours)"
                                        />
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Plant Breakdown</Label>
                                        <Switch
                                            checked={formData.hasPlantBreakdown}
                                            onCheckedChange={v => setFormData(prev => ({ ...prev, hasPlantBreakdown: v, plantBreakdownDuration: v ? prev.plantBreakdownDuration : '' }))}
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    {formData.hasPlantBreakdown && (
                                        <Input
                                            value={formData.plantBreakdownDuration}
                                            onChange={e => setFormData(prev => ({ ...prev, plantBreakdownDuration: e.target.value }))}
                                            disabled={isViewMode}
                                            placeholder="Duration (e.g., 45 minutes)"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Documentation */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Documentation</h3>

                            {/* Photos */}
                            <div className="space-y-3">
                                <Label>Photos</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                                <div className="flex flex-wrap gap-3">
                                    {(formData.photos || []).map((photo, index) => (
                                        <div key={index} className="relative w-24 h-24 group">
                                            <img
                                                src={photo}
                                                alt={`Photo ${index + 1}`}
                                                className="w-full h-full object-cover rounded-lg border border-slate-200"
                                            />
                                            {!isViewMode && (
                                                <button
                                                    onClick={() => removePhoto(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {!isViewMode && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-colors"
                                        >
                                            <Camera className="h-6 w-6 mb-1" />
                                            <span className="text-xs">Add Photo</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="space-y-2">
                                    <Label>Reported By</Label>
                                    <Select
                                        value={formData.reportedById}
                                        onValueChange={handleReportedByChange}
                                        disabled={isViewMode}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.filter(e => e.isActive).map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    disabled={isViewMode}
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        {!isViewMode && (
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="outline" onClick={() => handleSave(false)}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save as Draft
                                </Button>
                                <Button onClick={() => handleSave(true)} className={isUrgent ? 'bg-red-600 hover:bg-red-700' : ''}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit for Approval
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </PageWrapper>
        );
    }

    // ==================== LIST VIEW ====================

    return (
        <PageWrapper title="Issues Log" description="Track and manage field issues">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <Select value={filterProject} onValueChange={setFilterProject}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterIssueType} onValueChange={setFilterIssueType}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {(lookupValues.issue_types || []).filter(t => t.isActive).map(type => (
                                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterFlag} onValueChange={setFilterFlag}>
                            <SelectTrigger className="w-28">
                                <SelectValue placeholder="All Flags" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
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
                            New Issue
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Issue Type</TableHead>
                                <TableHead>Flag</TableHead>
                                <TableHead>Reported By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                        No issues found. Click "New Issue" to report one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map(log => (
                                    <TableRow key={log.id} className={`hover:bg-slate-50 ${log.flag === 'urgent' ? 'bg-red-50' : ''}`}>
                                        <TableCell className="font-medium">
                                            {new Date(log.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                {log.time}
                                            </div>
                                        </TableCell>
                                        <TableCell>{log.projectName}</TableCell>
                                        <TableCell>{log.issueTypeName || '-'}</TableCell>
                                        <TableCell>
                                            {log.flag === 'urgent' ? (
                                                <Badge className="bg-red-500 text-white">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Urgent
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-500">Normal</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{log.reportedByName || '-'}</TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_BADGES[log.status]?.className}>
                                                {STATUS_BADGES[log.status]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEditForm(log, true)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditForm(log)}
                                                    disabled={log.status === 'approved'}
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(log.id)}
                                                    disabled={log.status === 'approved'}
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
                    {filteredLogs.length} issue{filteredLogs.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Configure Panel */}
            <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <SheetContent className="w-[400px]">
                    <SheetHeader>
                        <SheetTitle>Configure</SheetTitle>
                        <SheetDescription>Manage issue types</SheetDescription>
                    </SheetHeader>
                    <Tabs defaultValue="issue_types" className="mt-6">
                        <TabsList className="w-full">
                            <TabsTrigger value="issue_types" className="flex-1">Issue Types</TabsTrigger>
                        </TabsList>
                        <TabsContent value="issue_types" className="mt-4">
                            <div className="flex gap-2 mb-4">
                                <Input
                                    placeholder="Enter issue type..."
                                    value={newLookupItem['issue_types'] || ''}
                                    onChange={e => setNewLookupItem(prev => ({ ...prev, 'issue_types': e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && addLookupItem('issue_types')}
                                />
                                <Button variant="outline" size="sm" onClick={() => addLookupItem('issue_types')}>
                                    <Plus className="h-4 w-4 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {(lookupValues.issue_types || []).map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                        <span className={item.isActive ? '' : 'text-slate-400 line-through'}>{item.name}</span>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => toggleLookupItem('issue_types', item.id)}>
                                                {item.isActive ? 'Disable' : 'Enable'}
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => deleteLookupItem('issue_types', item.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </SheetContent>
            </Sheet>
        </PageWrapper>
    );
}
