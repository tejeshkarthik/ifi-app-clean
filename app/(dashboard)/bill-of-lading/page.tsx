'use client';

import { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
    getBillsOfLading,
    saveBillOfLading,
    deleteBillOfLading,
    generateBOLFromReports,
    formatBOLNumber,
    type BillOfLading,
} from '@/lib/bol-storage';
import { getProjects, type Project } from '@/lib/project-storage';
import { exportFormToPDF } from '@/lib/export-utils';
import { toast } from 'sonner';
import {
    Search,
    Plus,
    Trash2,
    FileText,
    ArrowLeft,
    Save,
    Send,
    Eye,
    Download,
    RefreshCw,
    Printer,
} from 'lucide-react';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
};

// Signature Canvas Component
function SignatureCanvas({
    value,
    onChange,
    label,
    signerName,
    disabled = false
}: {
    value: string;
    onChange: (sig: string) => void;
    label: string;
    signerName: string;
    disabled?: boolean;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = disabled ? '#f8fafc' : '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        if (value) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = value;
        }
    }, [disabled]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
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
        if (!isDrawing || disabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas && !disabled) {
            onChange(canvas.toDataURL());
        }
    };

    const clearSignature = () => {
        if (disabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        onChange('');
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            <canvas
                ref={canvasRef}
                width={350}
                height={100}
                className={`w-full ${disabled ? 'bg-slate-50 cursor-not-allowed' : 'bg-white cursor-crosshair'} touch-none`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <div className="flex items-center justify-between p-2 bg-slate-50 border-t">
                <span className="text-sm font-medium text-slate-700">{label}: {signerName || 'Not specified'}</span>
                {!disabled && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function BillOfLadingPage() {
    // List state
    const [bols, setBols] = useState<BillOfLading[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProject, setFilterProject] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingBol, setDeletingBol] = useState<BillOfLading | null>(null);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [currentBol, setCurrentBol] = useState<BillOfLading | null>(null);

    // Generation state
    const [generateProjectId, setGenerateProjectId] = useState('');
    const [generateFromDate, setGenerateFromDate] = useState('');
    const [generateToDate, setGenerateToDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Data sources
    const [projects, setProjects] = useState<Project[]>([]);

    // Form data
    const [formData, setFormData] = useState<Partial<BillOfLading>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setBols(getBillsOfLading());
        const storedProjects = localStorage.getItem('ifi_projects');
        setProjects(storedProjects ? JSON.parse(storedProjects) : []);
    };

    const filteredBols = bols.filter(bol => {
        if (filterProject !== 'all' && bol.projectId !== filterProject) return false;
        if (filterStatus !== 'all' && bol.status !== filterStatus) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return bol.projectName.toLowerCase().includes(q) || bol.epNumber.includes(q);
        }
        return true;
    });

    const handleGenerate = () => {
        if (!generateProjectId) {
            toast.error('Please select a project');
            return;
        }
        if (!generateFromDate || !generateToDate) {
            toast.error('Please select a date range');
            return;
        }

        setIsGenerating(true);
        const result = generateBOLFromReports(generateProjectId, generateFromDate, generateToDate);
        setIsGenerating(false);

        if (!result) {
            toast.error('No approved Daily Field Reports found for this date range');
            return;
        }

        setFormData(result);
        setCurrentBol(null);
        setIsViewMode(false);
        setIsFormOpen(true);
        toast.success(`BOL generated from ${result.sourceReportIds.length} approved reports`);
    };

    const handleViewBol = (bol: BillOfLading) => {
        setFormData(bol);
        setCurrentBol(bol);
        setIsViewMode(true);
        setIsFormOpen(true);
    };

    const handleEditBol = (bol: BillOfLading) => {
        setFormData(bol);
        setCurrentBol(bol);
        setIsViewMode(false);
        setIsFormOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (deletingBol) {
            deleteBillOfLading(deletingBol.id);
            loadData();
            toast.success('Bill of Lading deleted');
        }
        setIsDeleteDialogOpen(false);
        setDeletingBol(null);
    };

    const handleSave = (submitForApproval = false) => {
        if (submitForApproval) {
            if (!formData.supervisorSignature) {
                toast.error('Supervisor signature is required');
                return;
            }
            if (!formData.customerSignature) {
                toast.error('Customer signature is required');
                return;
            }
        }

        const bolToSave: BillOfLading = {
            id: currentBol?.id || crypto.randomUUID(),
            projectId: formData.projectId || '',
            projectName: formData.projectName || '',
            epNumber: formData.epNumber || '',
            fromDate: formData.fromDate || '',
            toDate: formData.toDate || '',
            materialsSummary: formData.materialsSummary || [],
            standbySummary: formData.standbySummary || [],
            totalGallonsUsed: formData.totalGallonsUsed || 0,
            totalNetSy: formData.totalNetSy || 0,
            description: formData.description || 'FIBERGLASS REINFORCED FABRIC',
            notes: formData.notes || '',
            sourceReportIds: formData.sourceReportIds || [],
            supervisorSignature: formData.supervisorSignature || '',
            supervisorName: formData.supervisorName || '',
            customerSignature: formData.customerSignature || '',
            customerName: formData.customerName || '',
            status: submitForApproval ? 'pending' : 'draft',
            createdAt: currentBol?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: currentBol?.createdBy || 'current-user',
        };

        saveBillOfLading(bolToSave);
        loadData();
        setIsFormOpen(false);
        toast.success(submitForApproval ? 'BOL submitted for approval' : 'BOL saved as draft');
    };

    const handleDownloadPDF = () => {
        const htmlContent = `
            <h2 style="text-align: center; margin-bottom: 20px;">BILL OF LADING</h2>
            <table style="width: 100%; margin-bottom: 20px;">
                <tr><td><strong>Project:</strong> ${formData.projectName}</td><td><strong>EP#:</strong> ${formData.epNumber}</td></tr>
                <tr><td><strong>From:</strong> ${formData.fromDate}</td><td><strong>To:</strong> ${formData.toDate}</td></tr>
            </table>
            <h3>Materials Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background: #f3f4f6;"><th style="border: 1px solid #ddd; padding: 8px;">Material</th><th style="border: 1px solid #ddd; padding: 8px;">Total Rolls</th><th style="border: 1px solid #ddd; padding: 8px;">Total Net SY</th></tr>
                ${(formData.materialsSummary || []).map(m => `<tr><td style="border: 1px solid #ddd; padding: 8px;">${m.materialCode}</td><td style="border: 1px solid #ddd; padding: 8px;">${m.totalRolls.toFixed(2)}</td><td style="border: 1px solid #ddd; padding: 8px;">${m.totalNetSy.toLocaleString()}</td></tr>`).join('')}
                <tr style="font-weight: bold;"><td style="border: 1px solid #ddd; padding: 8px;">TOTAL</td><td style="border: 1px solid #ddd; padding: 8px;">${(formData.materialsSummary || []).reduce((s, m) => s + m.totalRolls, 0).toFixed(2)}</td><td style="border: 1px solid #ddd; padding: 8px;">${formData.totalNetSy?.toLocaleString()}</td></tr>
            </table>
            <p><strong>Total Gallons Used:</strong> ${formData.totalGallonsUsed?.toLocaleString()}</p>
            <p><strong>Description:</strong> ${formData.description}</p>
            ${formData.notes ? `<p><strong>Notes:</strong> ${formData.notes}</p>` : ''}
        `;
        exportFormToPDF(htmlContent, `Bill of Lading - ${formData.projectName}`);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // ==================== LIST VIEW ====================
    if (!isFormOpen) {
        return (
            <PageWrapper title="Bill of Lading" description="Generate and manage bills of lading">
                <div className="p-6">
                    {/* Generate BOL Section */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Generate New Bill of Lading</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label>Project</Label>
                                <Select value={generateProjectId} onValueChange={setGenerateProjectId}>
                                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>From Date</Label>
                                <Input type="date" value={generateFromDate} onChange={e => setGenerateFromDate(e.target.value)} />
                            </div>
                            <div>
                                <Label>To Date</Label>
                                <Input type="date" value={generateToDate} onChange={e => setGenerateToDate(e.target.value)} />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                                    {isGenerating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Generate BOL
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                            Only approved Daily Field Reports within the date range will be included.
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search BOLs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                        <Select value={filterProject} onValueChange={setFilterProject}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Filter by project" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    {filteredBols.length === 0 ? (
                        <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
                            <div className="text-center">
                                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-slate-700 mb-1">No Bills of Lading</h3>
                                <p className="text-sm text-slate-500">Generate a BOL from approved Daily Field Reports above</p>
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>BOL #</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Date Range</TableHead>
                                        <TableHead className="text-right">Total Net SY</TableHead>
                                        <TableHead className="text-right">Total Gallons</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBols.map(bol => (
                                        <TableRow key={bol.id}>
                                            <TableCell className="font-mono text-sm">{formatBOLNumber(bol)}</TableCell>
                                            <TableCell>{bol.projectName}</TableCell>
                                            <TableCell className="text-sm">{formatDate(bol.fromDate)} - {formatDate(bol.toDate)}</TableCell>
                                            <TableCell className="text-right font-medium">{bol.totalNetSy.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{bol.totalGallonsUsed.toLocaleString()}</TableCell>
                                            <TableCell><Badge className={STATUS_BADGES[bol.status]?.className}>{STATUS_BADGES[bol.status]?.label}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewBol(bol)} className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                                                    {bol.status === 'draft' && (
                                                        <Button variant="ghost" size="sm" onClick={() => handleEditBol(bol)} className="h-8 w-8 p-0"><FileText className="h-4 w-4" /></Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" onClick={() => { setDeletingBol(bol); setIsDeleteDialogOpen(true); }} className="h-8 w-8 p-0 hover:bg-red-50" disabled={bol.status === 'approved'}>
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

                    <div className="mt-4 text-sm text-slate-500">{filteredBols.length} BOL{filteredBols.length !== 1 ? 's' : ''}</div>
                </div>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Bill of Lading</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete this BOL? This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </PageWrapper>
        );
    }

    // ==================== FORM VIEW ====================
    return (
        <PageWrapper title="Bill of Lading" description={isViewMode ? 'View BOL' : 'Edit BOL'}>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />Back to List
                    </Button>
                    {currentBol && <span className="font-mono text-sm text-slate-500">{formatBOLNumber(currentBol)}</span>}
                    <Badge className={STATUS_BADGES[formData.status || 'draft']?.className}>{STATUS_BADGES[formData.status || 'draft']?.label}</Badge>
                </div>

                {/* Project Info */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-white rounded-lg border">
                    <div><Label className="text-slate-500">Project</Label><p className="font-semibold">{formData.projectName}</p></div>
                    <div><Label className="text-slate-500">EP #</Label><p className="font-mono">{formData.epNumber}</p></div>
                    <div><Label className="text-slate-500">From Date</Label><p>{formData.fromDate && formatDate(formData.fromDate)}</p></div>
                    <div><Label className="text-slate-500">To Date</Label><p>{formData.toDate && formatDate(formData.toDate)}</p></div>
                </div>

                {/* Materials Summary */}
                <div className="mb-6 p-4 bg-white rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Materials Summary</h3>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Material (Size)</TableHead>
                                <TableHead className="text-right">Total Rolls</TableHead>
                                <TableHead className="text-right">Total Net SY</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(formData.materialsSummary || []).map((m, i) => (
                                <TableRow key={i}>
                                    <TableCell>{m.materialCode} - {m.materialDescription}</TableCell>
                                    <TableCell className="text-right">{m.totalRolls.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{m.totalNetSy.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="font-bold bg-green-50">
                                <TableCell>TOTAL</TableCell>
                                <TableCell className="text-right">{(formData.materialsSummary || []).reduce((s, m) => s + m.totalRolls, 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right text-green-700">{formData.totalNetSy?.toLocaleString()}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* Standby Summary */}
                {(formData.standbySummary || []).length > 0 && (
                    <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h3 className="text-lg font-semibold text-amber-800 mb-3">Standby Summary</h3>
                        <ul className="space-y-1 text-sm">
                            {(formData.standbySummary || []).map((s, i) => (
                                <li key={i}><strong>{formatDate(s.date)}:</strong> Standby - {s.reasons.join(', ')} {s.duration && `(${s.duration})`}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Oil Summary & Description */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Label className="text-blue-700">Total Gallons Used</Label>
                        <p className="text-2xl font-bold text-blue-800">{formData.totalGallonsUsed?.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                        <Label>Description</Label>
                        <Input
                            value={formData.description || ''}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            disabled={isViewMode}
                        />
                    </div>
                </div>

                {/* Notes */}
                <div className="mb-6 p-4 bg-white rounded-lg border">
                    <Label>Notes</Label>
                    <Textarea
                        value={formData.notes || ''}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes..."
                        rows={3}
                        disabled={isViewMode}
                    />
                </div>

                {/* Signatures */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Signatures</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="mb-2 block">IFI Supervisor Name</Label>
                            <Input
                                value={formData.supervisorName || ''}
                                onChange={e => setFormData(prev => ({ ...prev, supervisorName: e.target.value }))}
                                placeholder="Enter name"
                                disabled={isViewMode}
                                className="mb-3"
                            />
                            <SignatureCanvas
                                value={formData.supervisorSignature || ''}
                                onChange={sig => setFormData(prev => ({ ...prev, supervisorSignature: sig }))}
                                label="IFI Supervisor"
                                signerName={formData.supervisorName || ''}
                                disabled={isViewMode}
                            />
                        </div>
                        <div>
                            <Label className="mb-2 block">Customer Name</Label>
                            <Input
                                value={formData.customerName || ''}
                                onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                placeholder="Enter name"
                                disabled={isViewMode}
                                className="mb-3"
                            />
                            <SignatureCanvas
                                value={formData.customerSignature || ''}
                                onChange={sig => setFormData(prev => ({ ...prev, customerSignature: sig }))}
                                label="Customer"
                                signerName={formData.customerName || ''}
                                disabled={isViewMode}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        {formData.sourceReportIds?.length || 0} source report{(formData.sourceReportIds?.length || 0) !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button variant="outline" onClick={handleDownloadPDF}><Download className="h-4 w-4 mr-2" />Download PDF</Button>
                        {!isViewMode && (
                            <>
                                <Button variant="outline" onClick={() => handleSave(false)}><Save className="h-4 w-4 mr-2" />Save Draft</Button>
                                <Button onClick={() => handleSave(true)}><Send className="h-4 w-4 mr-2" />Submit</Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
