'use client';

import { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { ProjectInfoCard } from '@/components/project-info-card';
import { ExportDropdown } from '@/components/export-modal';
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
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    getPreConstructionChecklists,
    savePreConstructionChecklist,
    deletePreConstructionChecklist,
    duplicateChecklist,
    formatPCCNumber,
    getEmptyChecklist,
    DEFAULT_WAREHOUSES,
    DEFAULT_VAN_TRUCK_TYPES,
    DEFAULT_PIPE_LENGTHS,
    DEFAULT_OTHER_ITEMS,
    OIL_SOURCE_OPTIONS,
    type PreConstructionChecklist,
    type ChecklistItem,
} from '@/lib/preconstruction-storage';
import { toast } from 'sonner';
import {
    Search, Plus, Trash2, Settings, FileText, ArrowLeft, Save, Send, Eye, Copy,
} from 'lucide-react';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
};

interface Project { id: string; name: string; epNumber?: string; contractorId?: string; contractorName?: string; streetAddress?: string; city?: string; state?: string; estimatedStartDate?: string; estimatedDurationDays?: number; materials?: any[]; salespersonId?: string; salespersonName?: string; }
interface Employee { id: string; name: string; role: string; phone?: string; email?: string; }
interface Contractor { id: string; name: string; pocs?: any[]; }

export default function PreConstructionPage() {
    const [checklists, setChecklists] = useState<PreConstructionChecklist[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProject, setFilterProject] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterWarehouse, setFilterWarehouse] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [currentChecklist, setCurrentChecklist] = useState<PreConstructionChecklist | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingChecklist, setDeletingChecklist] = useState<PreConstructionChecklist | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState(getEmptyChecklist());
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = () => {
        setChecklists(getPreConstructionChecklists());
        const p = localStorage.getItem('ifi_projects'); setProjects(p ? JSON.parse(p) : []);
        const e = localStorage.getItem('ifi_employees'); setEmployees(e ? JSON.parse(e) : []);
        const c = localStorage.getItem('ifi_contractors'); setContractors(c ? JSON.parse(c) : []);
    };

    const filtered = checklists.filter(c => {
        if (filterProject !== 'all' && c.projectId !== filterProject) return false;
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
        if (filterWarehouse !== 'all' && c.warehouse !== filterWarehouse) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return c.projectName.toLowerCase().includes(q) || c.epNumber.includes(q);
        }
        return true;
    });

    const handleNew = () => {
        setFormData(getEmptyChecklist());
        setSelectedProject(null);
        setCurrentChecklist(null);
        setIsViewMode(false);
        setIsFormOpen(true);
    };

    const handleView = (c: PreConstructionChecklist) => {
        setFormData(c); setCurrentChecklist(c);
        setSelectedProject(projects.find(p => p.id === c.projectId) || null);
        setIsViewMode(true); setIsFormOpen(true);
    };

    const handleEdit = (c: PreConstructionChecklist) => {
        setFormData(c); setCurrentChecklist(c);
        setSelectedProject(projects.find(p => p.id === c.projectId) || null);
        setIsViewMode(false); setIsFormOpen(true);
    };

    const handleDuplicate = (c: PreConstructionChecklist) => {
        const dup = duplicateChecklist(c.id);
        if (dup) { loadData(); toast.success('Checklist duplicated'); }
    };

    const handleDeleteConfirm = () => {
        if (deletingChecklist) { deletePreConstructionChecklist(deletingChecklist.id); loadData(); toast.success('Deleted'); }
        setIsDeleteDialogOpen(false); setDeletingChecklist(null);
    };

    const handleProjectChange = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        setSelectedProject(project);
        const contractor = contractors.find(c => c.id === project.contractorId);
        const poc = contractor?.pocs?.[0];
        setFormData(prev => ({
            ...prev,
            projectId: project.id,
            projectName: project.name,
            epNumber: project.epNumber || '',
            contractor: project.contractorName || '',
            contractorId: project.contractorId || '',
            projectAddress: `${project.streetAddress || ''}, ${project.city || ''}, ${project.state || ''}`,
            estimatedStartDate: project.estimatedStartDate || '',
            estimatedDuration: project.estimatedDurationDays ? `${project.estimatedDurationDays} DAYS` : '',
            superintendentId: poc?.id || '',
            superintendentName: poc?.name || '',
            superintendentPhone: poc?.phone || '',
            superintendentEmail: poc?.email || '',
            salesPerson: project.salespersonId ? [project.salespersonId] : [],
            salesPersonNames: project.salespersonName ? [project.salespersonName] : [],
        }));
    };

    const handleSave = (submit = false) => {
        if (!formData.projectId) { toast.error('Project required'); return; }
        if (submit) {
            if (!formData.warehouse) { toast.error('Warehouse required'); return; }
            if (formData.tackCoatTypes.length === 0) { toast.error('Tack coat type required'); return; }
            if (!formData.signature) { toast.error('Signature required'); return; }
        }
        const toSave: PreConstructionChecklist = {
            ...formData as PreConstructionChecklist,
            id: currentChecklist?.id || crypto.randomUUID(),
            formNumber: currentChecklist?.formNumber || formatPCCNumber(),
            status: submit ? 'pending' : 'draft',
            createdAt: currentChecklist?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: currentChecklist?.createdBy || 'current-user',
        };
        savePreConstructionChecklist(toSave); loadData(); setIsFormOpen(false);
        toast.success(submit ? 'Submitted' : 'Saved');
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

    // LIST VIEW
    if (!isFormOpen) {
        return (
            <PageWrapper title="Pre-Construction Checklist" description="Prepare projects 5 days before start">
                <div className="p-6">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                        <Select value={filterProject} onValueChange={setFilterProject}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Project" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Projects</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem></SelectContent>
                        </Select>
                        <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Warehouse" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All</SelectItem>{DEFAULT_WAREHOUSES.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <div className="ml-auto flex gap-2">
                            <ExportDropdown onExportAll={() => { }} />
                            <Button onClick={handleNew}><Plus className="h-4 w-4 mr-2" />New Checklist</Button>
                            <Button variant="outline" size="icon" onClick={() => setIsConfigOpen(true)}><Settings className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
                            <div className="text-center"><FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" /><h3 className="text-lg font-medium">No checklists</h3><Button onClick={handleNew} className="mt-4"><Plus className="h-4 w-4 mr-2" />New Checklist</Button></div>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader><TableRow className="bg-slate-50"><TableHead>Project</TableHead><TableHead>EP#</TableHead><TableHead>Contractor</TableHead><TableHead>Est. Start</TableHead><TableHead>Warehouse</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filtered.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.projectName}</TableCell>
                                            <TableCell className="font-mono">{c.epNumber || '-'}</TableCell>
                                            <TableCell>{c.contractor || '-'}</TableCell>
                                            <TableCell>{formatDate(c.estimatedStartDate)}</TableCell>
                                            <TableCell>{DEFAULT_WAREHOUSES.find(w => w.id === c.warehouse)?.name || '-'}</TableCell>
                                            <TableCell><Badge className={STATUS_BADGES[c.status]?.className}>{STATUS_BADGES[c.status]?.label}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => handleView(c)} className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                                                    {c.status === 'draft' && <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} className="h-8 w-8 p-0"><FileText className="h-4 w-4" /></Button>}
                                                    <Button variant="ghost" size="sm" onClick={() => handleDuplicate(c)} className="h-8 w-8 p-0"><Copy className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="sm" onClick={() => { setDeletingChecklist(c); setIsDeleteDialogOpen(true); }} className="h-8 w-8 p-0" disabled={c.status === 'approved'}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                <ConfigPanel open={isConfigOpen} onOpenChange={setIsConfigOpen} />
            </PageWrapper>
        );
    }

    // FORM VIEW - See part 2 file
    return (
        <PageWrapper title="Pre-Construction Checklist" description={currentChecklist?.formNumber || 'New'}>
            <PreConstructionForm
                formData={formData}
                setFormData={setFormData}
                selectedProject={selectedProject}
                projects={projects}
                employees={employees}
                contractors={contractors}
                isViewMode={isViewMode}
                onProjectChange={handleProjectChange}
                onSave={handleSave}
                onClose={() => setIsFormOpen(false)}
                currentChecklist={currentChecklist}
            />
        </PageWrapper>
    );
}

// Form Component (separate for clarity)
function PreConstructionForm({ formData, setFormData, selectedProject, projects, employees, contractors, isViewMode, onProjectChange, onSave, onClose, currentChecklist }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const salespeople = employees.filter((e: Employee) => e.role === 'Salesperson' || e.role === 'PM');
    const projectTeamEmps = employees.filter((e: Employee) => ['PM', 'Supervisor', 'Salesperson'].includes(e.role));
    const contractor = contractors.find((c: Contractor) => c.id === formData.contractorId);

    const toggleTeamMember = (id: string, name: string) => {
        if (formData.projectTeam.includes(id)) {
            setFormData((p: any) => ({ ...p, projectTeam: p.projectTeam.filter((x: string) => x !== id), projectTeamNames: p.projectTeamNames.filter((x: string) => x !== name) }));
        } else {
            setFormData((p: any) => ({ ...p, projectTeam: [...p.projectTeam, id], projectTeamNames: [...p.projectTeamNames, name] }));
        }
    };

    const toggleSalesPerson = (id: string, name: string) => {
        if (formData.salesPerson.includes(id)) {
            setFormData((p: any) => ({ ...p, salesPerson: p.salesPerson.filter((x: string) => x !== id), salesPersonNames: p.salesPersonNames.filter((x: string) => x !== name) }));
        } else {
            setFormData((p: any) => ({ ...p, salesPerson: [...p.salesPerson, id], salesPersonNames: [...p.salesPersonNames, name] }));
        }
    };

    // Signature handlers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        if (formData.signature) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = formData.signature; }
    }, []);

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => { if (isViewMode) return; setIsDrawing(true); const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return; const rect = canvas.getBoundingClientRect(); const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left; const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top; ctx.beginPath(); ctx.moveTo(x, y); };
    const draw = (e: React.MouseEvent | React.TouchEvent) => { if (!isDrawing || isViewMode) return; const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return; const rect = canvas.getBoundingClientRect(); const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left; const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top; ctx.lineTo(x, y); ctx.stroke(); };
    const stopDraw = () => { setIsDrawing(false); const canvas = canvasRef.current; if (canvas) setFormData((p: any) => ({ ...p, signature: canvas.toDataURL() })); };
    const clearSig = () => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); setFormData((p: any) => ({ ...p, signature: '' })); };

    return (
        <div className="p-6 max-w-6xl mx-auto pb-24">
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={onClose}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                <Badge className={STATUS_BADGES[formData.status || 'draft']?.className}>{STATUS_BADGES[formData.status || 'draft']?.label}</Badge>
            </div>

            {/* Section 1: Project */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
                <Label>Project *</Label>
                <Select value={formData.projectId} onValueChange={onProjectChange} disabled={isViewMode}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>{projects.map((p: Project) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            {selectedProject && <div className="mb-6"><ProjectInfoCard projectId={selectedProject.id} /></div>}

            {/* Section 2: Project Team */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
                <h3 className="font-semibold mb-3">Project Team</h3>
                <div className="mb-4"><Label className="text-sm text-slate-600">PROJECT</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">{projectTeamEmps.map((e: Employee) => (<label key={e.id} className="flex items-center gap-2"><Checkbox checked={formData.projectTeam.includes(e.id)} onCheckedChange={() => toggleTeamMember(e.id, e.name)} disabled={isViewMode} /><span className="text-sm">{e.name}</span></label>))}</div>
                </div>
                <div><Label className="text-sm text-slate-600">SALES PERSON</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">{salespeople.map((e: Employee) => (<label key={e.id} className="flex items-center gap-2"><Checkbox checked={formData.salesPerson.includes(e.id)} onCheckedChange={() => toggleSalesPerson(e.id, e.name)} disabled={isViewMode} /><span className="text-sm">{e.name}</span></label>))}</div>
                </div>
            </div>

            {/* Section 3: Project Info */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
                <h3 className="font-semibold mb-3">Project Information</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div><Label>Contractor</Label><Input value={formData.contractor} readOnly className="bg-slate-50" /></div>
                    <div><Label>Superintendent</Label>
                        <Select value={formData.superintendentId} onValueChange={v => { const poc = contractor?.pocs?.find((p: any) => p.id === v); setFormData((p: any) => ({ ...p, superintendentId: v, superintendentName: poc?.name || '', superintendentPhone: poc?.phone || '', superintendentEmail: poc?.email || '' })); }} disabled={isViewMode}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{(contractor?.pocs || []).map((poc: any) => <SelectItem key={poc.id} value={poc.id}>{poc.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div><Label>Project Address</Label><Input value={formData.projectAddress} readOnly className="bg-slate-50" /></div>
                </div>
            </div>

            {/* Section 4: Special Instructions & Details */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
                <h3 className="font-semibold mb-3">Special Instructions</h3>
                <Textarea value={formData.specialInstructions} onChange={e => setFormData((p: any) => ({ ...p, specialInstructions: e.target.value }))} placeholder="Enter special instructions..." rows={3} disabled={isViewMode} />
            </div>

            <div className="mb-6 p-4 bg-white rounded-lg border space-y-4">
                <div><Label>Project Type</Label><div className="flex flex-wrap gap-4 mt-2">{['City', 'State', 'Private', 'Airport', 'County', 'Port'].map(t => (<label key={t} className="flex items-center gap-2"><input type="radio" name="projectType" checked={formData.projectType === t} onChange={() => setFormData((p: any) => ({ ...p, projectType: t }))} disabled={isViewMode} /><span>{t}</span></label>))}<label className="flex items-center gap-2"><input type="radio" name="projectType" checked={formData.projectType === 'Other'} onChange={() => setFormData((p: any) => ({ ...p, projectType: 'Other' }))} disabled={isViewMode} /><span>Other:</span><Input value={formData.projectTypeOther} onChange={e => setFormData((p: any) => ({ ...p, projectTypeOther: e.target.value }))} className="w-32" disabled={isViewMode || formData.projectType !== 'Other'} /></label></div></div>

                <div><Label>This Project Is</Label><div className="flex gap-6 mt-2"><label className="flex items-center gap-2"><Checkbox checked={formData.dayTime} onCheckedChange={c => setFormData((p: any) => ({ ...p, dayTime: !!c }))} disabled={isViewMode} /><span>Day Time</span></label><label className="flex items-center gap-2"><Checkbox checked={formData.nightTime} onCheckedChange={c => setFormData((p: any) => ({ ...p, nightTime: !!c }))} disabled={isViewMode} /><span>Night Time</span></label></div></div>

                <label className="flex items-center gap-2"><Checkbox checked={formData.rubberTireNotification} onCheckedChange={c => setFormData((p: any) => ({ ...p, rubberTireNotification: !!c }))} disabled={isViewMode} /><span>Contractor has been notified that a rubber tire roller is required with operator</span></label>

                <div className="flex items-center gap-2"><Checkbox checked={!!formData.plansReviewedById} onCheckedChange={() => { }} disabled /><span>Plans have been reviewed by</span>
                    <Select value={formData.plansReviewedById} onValueChange={v => { const e = employees.find((emp: Employee) => emp.id === v); setFormData((p: any) => ({ ...p, plansReviewedById: v, plansReviewedByName: e?.name || '' })); }} disabled={isViewMode}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{employees.map((e: Employee) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>

                <div><Label>Submittals</Label><div className="flex gap-4 mt-2">{['Approved', 'Pending', 'Not Approved'].map(s => (<label key={s} className="flex items-center gap-2"><input type="radio" name="submittals" checked={formData.submittals === s} onChange={() => setFormData((p: any) => ({ ...p, submittals: s }))} disabled={isViewMode} /><span>{s}</span></label>))}</div></div>

                <div className="grid grid-cols-4 gap-4">
                    <div><Label>Contract Number</Label><Input value={formData.contractNumber} onChange={e => setFormData((p: any) => ({ ...p, contractNumber: e.target.value }))} disabled={isViewMode} /></div>
                    <div><Label>EP Number</Label><Input value={formData.epNumber} readOnly className="bg-slate-50" /></div>
                    <div><Label>Est. Start Date</Label><Input value={formData.estimatedStartDate} readOnly className="bg-slate-50" /></div>
                    <div><Label>Est. Duration</Label><Input value={formData.estimatedDuration} readOnly className="bg-slate-50" /></div>
                </div>
            </div>

            {/* Section 5: Materials - simplified */}
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-3">Material Type</h3>
                <p className="text-sm text-slate-600 mb-4">Materials from project scope are auto-selected. Add quantities below.</p>
                <div className="grid grid-cols-3 gap-2">{(selectedProject?.materials || []).slice(0, 9).map((m: any, i: number) => (<label key={i} className="flex items-center gap-2 bg-white p-2 rounded"><Checkbox checked disabled={isViewMode} /><span className="text-sm">{m.materialCode || m.materialName}</span><Input type="number" className="w-16 ml-auto" placeholder="Qty" disabled={isViewMode} /></label>))}</div>
            </div>

            {/* Section 6: Warehouse */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
                <h3 className="font-semibold mb-3">Warehouse *</h3>
                <div className="flex gap-4">{DEFAULT_WAREHOUSES.map(w => (<label key={w.id} className="flex items-center gap-2"><input type="radio" name="warehouse" checked={formData.warehouse === w.id} onChange={() => setFormData((p: any) => ({ ...p, warehouse: w.id }))} disabled={isViewMode} /><span>{w.name}</span></label>))}</div>
            </div>

            {/* Section 7: Tack Coat */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3">Tack Coat Detail</h3>
                <div className="mb-4"><Label>Project Sq. Yds</Label><Input type="number" value={formData.projectSY || ''} onChange={e => setFormData((p: any) => ({ ...p, projectSY: parseFloat(e.target.value) || 0 }))} className="w-40" disabled={isViewMode} /></div>
                <div className="mb-4"><Label>Tack Coat Type *</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">{['Emulsion', 'Trackless', 'Hot applied', 'Jebro', 'UF', 'PG67', 'PG70', 'PG76'].map(t => (<label key={t} className="flex items-center gap-2"><Checkbox checked={formData.tackCoatTypes.includes(t)} onCheckedChange={c => { if (c) setFormData((p: any) => ({ ...p, tackCoatTypes: [...p.tackCoatTypes, t] })); else setFormData((p: any) => ({ ...p, tackCoatTypes: p.tackCoatTypes.filter((x: string) => x !== t) })); }} disabled={isViewMode} /><span className="text-sm">{t}</span></label>))}</div>
                </div>
            </div>

            {/* Section 8: Oil Source */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
                <h3 className="font-semibold mb-3">Applicator/Oil Source</h3>
                <div className="space-y-2">{OIL_SOURCE_OPTIONS.map(o => (<label key={o.id} className="flex items-center gap-2"><input type="radio" name="oilSource" checked={formData.oilSource === o.id} onChange={() => setFormData((p: any) => ({ ...p, oilSource: o.id }))} disabled={isViewMode} /><span className="text-sm">{o.name}</span></label>))}</div>
            </div>

            {/* Section 9: Equipment */}
            <div className="mb-6 p-4 bg-white rounded-lg border space-y-4">
                <h3 className="font-semibold">Equipment</h3>
                <div><Label>Tractor Type</Label><div className="flex gap-4 mt-2">{['Kubota with rollers', 'Kubota with no rollers'].map(t => (<label key={t} className="flex items-center gap-2"><input type="radio" name="tractorType" checked={formData.tractorType === t} onChange={() => setFormData((p: any) => ({ ...p, tractorType: t }))} disabled={isViewMode} /><span>{t}</span></label>))}</div></div>
                <div className="grid grid-cols-3 gap-4">
                    <div><Label>No. of tractors</Label><Input type="number" value={formData.numTractors || ''} onChange={e => setFormData((p: any) => ({ ...p, numTractors: parseInt(e.target.value) || 0 }))} disabled={isViewMode} /></div>
                    <div><Label>Trailer unit #</Label><Input value={formData.trailerUnit} onChange={e => setFormData((p: any) => ({ ...p, trailerUnit: e.target.value }))} disabled={isViewMode} /></div>
                    <div><Label>Tractor unit #</Label><Input value={formData.tractorUnit} onChange={e => setFormData((p: any) => ({ ...p, tractorUnit: e.target.value }))} disabled={isViewMode} /></div>
                </div>
                <label className="flex items-center gap-2"><Checkbox checked={formData.backpackBlowers} onCheckedChange={c => setFormData((p: any) => ({ ...p, backpackBlowers: !!c }))} disabled={isViewMode} /><span>Backpack blowers required</span></label>
                <div><Label>Pipe Length</Label><div className="flex flex-wrap gap-2 mt-2">{DEFAULT_PIPE_LENGTHS.map(p => (<label key={p.id} className="flex items-center gap-2"><Checkbox checked={formData.pipeLengths.includes(p.id)} onCheckedChange={c => { if (c) setFormData((prev: any) => ({ ...prev, pipeLengths: [...prev.pipeLengths, p.id] })); else setFormData((prev: any) => ({ ...prev, pipeLengths: prev.pipeLengths.filter((x: string) => x !== p.id) })); }} disabled={isViewMode} /><span className="text-sm">{p.name}</span></label>))}</div></div>
                <div><Label>Van/Truck Type</Label><div className="flex flex-wrap gap-4 mt-2">{DEFAULT_VAN_TRUCK_TYPES.map(v => (<label key={v.id} className="flex items-center gap-2"><input type="radio" name="vanTruck" checked={formData.vanTruckType === v.id} onChange={() => setFormData((p: any) => ({ ...p, vanTruckType: v.id }))} disabled={isViewMode} /><span className="text-sm">{v.name}</span></label>))}</div></div>
            </div>

            {/* Section 10: Equipment Checklists */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
                <h3 className="font-semibold mb-4">Equipment Checklists</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div><h4 className="font-medium text-sm mb-2">Truck Inspection</h4><div className="space-y-1">{formData.truckInspection.map((item: ChecklistItem, i: number) => (<label key={item.id} className="flex items-center gap-2"><Checkbox checked={item.checked} onCheckedChange={c => { const updated = [...formData.truckInspection]; updated[i] = { ...item, checked: !!c }; setFormData((p: any) => ({ ...p, truckInspection: updated })); }} disabled={isViewMode} /><span className="text-xs">{item.label}</span></label>))}</div></div>
                    <div><h4 className="font-medium text-sm mb-2">Trailer Inspection</h4><div className="space-y-1">{formData.trailerInspection.map((item: ChecklistItem, i: number) => (<label key={item.id} className="flex items-center gap-2"><Checkbox checked={item.checked} onCheckedChange={c => { const updated = [...formData.trailerInspection]; updated[i] = { ...item, checked: !!c }; setFormData((p: any) => ({ ...p, trailerInspection: updated })); }} disabled={isViewMode} /><span className="text-xs">{item.label}</span></label>))}</div></div>
                    <div><h4 className="font-medium text-sm mb-2">Misc Equipment</h4><div className="space-y-1 max-h-64 overflow-y-auto">{formData.miscEquipment.map((item: ChecklistItem, i: number) => (<label key={item.id} className="flex items-center gap-2"><Checkbox checked={item.checked} onCheckedChange={c => { const updated = [...formData.miscEquipment]; updated[i] = { ...item, checked: !!c }; setFormData((p: any) => ({ ...p, miscEquipment: updated })); }} disabled={isViewMode} /><span className="text-xs">{item.label}</span></label>))}</div></div>
                </div>
            </div>

            {/* Section 11: Completion */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
                <h3 className="font-semibold mb-4">Completion</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div><Label>Completed By</Label><Select value={formData.completedById} onValueChange={v => { const e = employees.find((emp: Employee) => emp.id === v); setFormData((p: any) => ({ ...p, completedById: v, completedByName: e?.name || '' })); }} disabled={isViewMode}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{employees.map((e: Employee) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Date Completed</Label><Input type="date" value={formData.dateCompleted} onChange={e => setFormData((p: any) => ({ ...p, dateCompleted: e.target.value }))} disabled={isViewMode} /></div>
                    <div><Label>Date Sent to Ernesto</Label><Input type="date" value={formData.dateSentToErnesto} onChange={e => setFormData((p: any) => ({ ...p, dateSentToErnesto: e.target.value }))} disabled={isViewMode} /></div>
                    <div><Label>Date Sent to Bobby</Label><Input type="date" value={formData.dateSentToBobby} onChange={e => setFormData((p: any) => ({ ...p, dateSentToBobby: e.target.value }))} disabled={isViewMode} /></div>
                </div>
                <Label>Signature *</Label>
                <div className="border rounded-lg overflow-hidden mt-2">
                    <canvas ref={canvasRef} width={500} height={120} className="w-full bg-white cursor-crosshair touch-none" onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
                    <div className="flex justify-between items-center p-2 bg-slate-50 border-t"><span className="text-sm">{formData.completedByName || 'Unknown'}</span>{!isViewMode && <Button variant="ghost" size="sm" onClick={clearSig}>Clear</Button>}</div>
                </div>
                <p className="text-xs text-slate-500 mt-2">I have verified all equipment in checkboxes above. I am responsible for all items checked out above.</p>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center z-50">
                <Badge className={STATUS_BADGES[formData.status || 'draft']?.className}>{STATUS_BADGES[formData.status || 'draft']?.label}</Badge>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {!isViewMode && <><Button variant="outline" onClick={() => onSave(false)}><Save className="h-4 w-4 mr-2" />Save Draft</Button><Button onClick={() => onSave(true)}><Send className="h-4 w-4 mr-2" />Submit</Button></>}
                </div>
            </div>
        </div>
    );
}

// Configure Panel
function ConfigPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[500px]">
                <SheetHeader><SheetTitle>Configure Pre-Construction</SheetTitle></SheetHeader>
                <Tabs defaultValue="warehouses" className="mt-6">
                    <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="warehouses">Warehouses</TabsTrigger><TabsTrigger value="trucks">Van/Trucks</TabsTrigger><TabsTrigger value="pipes">Pipes</TabsTrigger></TabsList>
                    <TabsContent value="warehouses" className="mt-4"><p className="text-sm text-slate-500">Warehouse configuration coming soon</p></TabsContent>
                    <TabsContent value="trucks" className="mt-4"><p className="text-sm text-slate-500">Van/Truck configuration coming soon</p></TabsContent>
                    <TabsContent value="pipes" className="mt-4"><p className="text-sm text-slate-500">Pipe configuration coming soon</p></TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
