'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
    getProjects,
    deleteProject,
    type Project,
} from '@/lib/project-storage';
import { getEmployees } from '@/lib/employee-storage';
import { getActiveCompanies } from '@/lib/company-storage';
import { getActiveLookupValues } from '@/lib/lookup-storage';
import { ConfigurePanel } from '@/components/configure-panel';
import { PROJECT_EXPORT_COLUMNS } from '@/lib/export-columns';
import { transformRecordsForExport, generateExportFilename } from '@/lib/export-helpers';
import { exportToExcel } from '@/lib/export-utils';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, FolderKanban, Eye, Settings, FileSpreadsheet, Columns, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

type SortDirection = 'asc' | 'desc';

interface ColumnDef {
    id: string;
    label: string;
    accessor: (p: Project) => string | React.ReactNode;
    sortable?: boolean;
    visible: boolean;
    order: number;
}

const ALL_COLUMNS: Omit<ColumnDef, 'visible' | 'order'>[] = [
    { id: 'salespersonName', label: 'Sales Person', accessor: p => p.salespersonName || '-', sortable: true },
    { id: 'epNumber', label: 'EP No.', accessor: p => p.epNumber || '-', sortable: true },
    { id: 'estimatedStartDate', label: 'Approx Start Date', accessor: p => p.estimatedStartDate ? new Date(p.estimatedStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-', sortable: true },
    { id: 'scheduleNotes', label: 'Start Date Notes', accessor: p => p.scheduleNotes || '-' },
    { id: 'contractorName', label: 'Contractor', accessor: p => p.contractorName || '-', sortable: true },
    { id: 'name', label: 'Project Name', accessor: p => p.name, sortable: true },
    { id: 'contact', label: 'Contact', accessor: () => '-' },
    { id: 'phone', label: 'Phone', accessor: () => '-' },
    { id: 'email', label: 'Email', accessor: () => '-' },
    { id: 'city', label: 'Jobsite Location', accessor: p => p.city || '-', sortable: true },
    { id: 'state', label: 'Jobsite State', accessor: p => p.state || '-', sortable: true },
    { id: 'ownerName', label: 'Owner', accessor: p => p.ownerName || '-', sortable: true },
    { id: 'signedContract', label: 'Signed Contract', accessor: p => p.signedContract ? <Badge className="bg-green-100 text-green-700">Yes</Badge> : <Badge variant="secondary">No</Badge> },
    { id: 'product', label: 'Product', accessor: p => p.materials?.map(m => m.materialCode).join(', ') || '-' },
    { id: 'tackCoatTypeName', label: 'Oil', accessor: p => p.tackCoatTypeName || '-' },
    { id: 'totalQty', label: 'Total Qty (SY)', accessor: p => p.materials?.reduce((s, m) => s + (m.totalEstimatedQty || 0), 0).toLocaleString() || '-' },
];

const DEFAULT_VISIBLE = ['salespersonName', 'epNumber', 'estimatedStartDate', 'contractorName', 'name', 'city', 'state', 'ownerName', 'signedContract', 'product', 'tackCoatTypeName', 'totalQty'];

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [salespersonFilter, setSalespersonFilter] = useState<string>('all');
    const [ownerFilter, setOwnerFilter] = useState<string>('all');
    const [productFilter, setProductFilter] = useState<string>('all');
    const [oilFilter, setOilFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<string>('epNumber');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [isConfigureOpen, setIsConfigureOpen] = useState(false);
    const [isColumnsOpen, setIsColumnsOpen] = useState(false);

    // Column management
    const [columns, setColumns] = useState<ColumnDef[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ifi_projects_columns');
            if (saved) {
                const parsed = JSON.parse(saved) as { id: string; visible: boolean; order: number }[];
                return ALL_COLUMNS.map((col, i) => {
                    const saved = parsed.find(p => p.id === col.id);
                    return { ...col, visible: saved?.visible ?? DEFAULT_VISIBLE.includes(col.id), order: saved?.order ?? i };
                }).sort((a, b) => a.order - b.order);
            }
        }
        return ALL_COLUMNS.map((col, i) => ({ ...col, visible: DEFAULT_VISIBLE.includes(col.id), order: i }));
    });

    // Filter options
    const [statusOptions, setStatusOptions] = useState<{ id: string; name: string }[]>([]);
    const [salespersonOptions, setSalespersonOptions] = useState<{ id: string; name: string }[]>([]);
    const [ownerOptions, setOwnerOptions] = useState<{ id: string; name: string }[]>([]);
    const [productOptions, setProductOptions] = useState<{ id: string; name: string }[]>([]);
    const [oilOptions, setOilOptions] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => { refreshData(); }, []);

    const refreshData = () => {
        const projectData = getProjects();
        setProjects(projectData);
        setStatusOptions(getActiveLookupValues('project_status_types').map(v => ({ id: v.id, name: v.name })));
        setSalespersonOptions(getEmployees().filter(e => e.isActive && ['PM', 'Supervisor', 'Salesperson'].includes(e.role)).map(e => ({ id: e.id, name: e.name })));
        setOwnerOptions(getActiveCompanies('owners').map(o => ({ id: o.id, name: o.name })));
        const products = new Map<string, string>();
        projectData.forEach(p => p.materials?.forEach(m => products.set(m.materialCode, m.materialCode)));
        setProductOptions(Array.from(products.entries()).map(([id, name]) => ({ id, name })));
        setOilOptions(getActiveLookupValues('oil_types').map(v => ({ id: v.id, name: v.name })));
    };

    const filteredProjects = projects
        .filter(p => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery || p.name.toLowerCase().includes(q) || p.epNumber.toLowerCase().includes(q) || p.ownerName?.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.state.toLowerCase().includes(q);
            return matchesSearch && (statusFilter === 'all' || p.statusId === statusFilter) && (salespersonFilter === 'all' || p.salespersonId === salespersonFilter) && (ownerFilter === 'all' || p.ownerId === ownerFilter) && (productFilter === 'all' || p.materials?.some(m => m.materialCode === productFilter)) && (oilFilter === 'all' || p.tackCoatTypeId === oilFilter);
        })
        .sort((a, b) => {
            const aVal = (a as any)[sortField]?.toString().toLowerCase() || '';
            const bVal = (b as any)[sortField]?.toString().toLowerCase() || '';
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });

    const handleSort = (field: string) => {
        if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDirection('asc'); }
    };

    const handleDelete = () => {
        if (deletingProject) { deleteProject(deletingProject.id); refreshData(); }
        setIsDeleteDialogOpen(false); setDeletingProject(null);
    };

    const handleExportExcel = () => {
        // Full data export with all columns (~65 fields)
        const exportData = transformRecordsForExport(
            filteredProjects as unknown as Record<string, unknown>[],
            PROJECT_EXPORT_COLUMNS
        );

        const headers = PROJECT_EXPORT_COLUMNS.map(c => c.header);
        exportToExcel(
            exportData,
            headers.map((h, i) => ({ key: h, header: h })),
            generateExportFilename('Projects', 'xlsx').replace('.xlsx', '')
        );
    };

    const toggleColumn = (id: string) => {
        setColumns(cols => cols.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    };

    const moveColumn = (id: string, direction: 'up' | 'down') => {
        setColumns(cols => {
            const idx = cols.findIndex(c => c.id === id);
            if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === cols.length - 1)) return cols;
            const newCols = [...cols];
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            [newCols[idx], newCols[swapIdx]] = [newCols[swapIdx], newCols[idx]];
            return newCols.map((c, i) => ({ ...c, order: i }));
        });
    };

    const saveColumns = () => {
        localStorage.setItem('ifi_projects_columns', JSON.stringify(columns.map(c => ({ id: c.id, visible: c.visible, order: c.order }))));
        setIsColumnsOpen(false);
    };

    const visibleColumns = columns.filter(c => c.visible);

    return (
        <PageWrapper title="Projects" description="Manage all projects">
            <div className="p-6">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search by name, owner, location..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{statusOptions.filter(o => o.id).map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
                    <Select value={salespersonFilter} onValueChange={setSalespersonFilter}><SelectTrigger className="w-40"><SelectValue placeholder="Salesperson" /></SelectTrigger><SelectContent><SelectItem value="all">All Salespersons</SelectItem>{salespersonOptions.filter(o => o.id).map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
                    <Select value={ownerFilter} onValueChange={setOwnerFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Owner" /></SelectTrigger><SelectContent><SelectItem value="all">All Owners</SelectItem>{ownerOptions.filter(o => o.id).map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
                    <Select value={productFilter} onValueChange={setProductFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Product" /></SelectTrigger><SelectContent><SelectItem value="all">All Products</SelectItem>{productOptions.filter(o => o.id).map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
                    <Select value={oilFilter} onValueChange={setOilFilter}><SelectTrigger className="w-32"><SelectValue placeholder="Oil" /></SelectTrigger><SelectContent><SelectItem value="all">All Oils</SelectItem>{oilOptions.filter(o => o.id).map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsColumnsOpen(true)}><Columns className="h-4 w-4 mr-2" />Manage Columns</Button>
                        <Button variant="outline" onClick={handleExportExcel}><FileSpreadsheet className="h-4 w-4 mr-2" />Export Excel</Button>
                        <Button variant="outline" onClick={() => setIsConfigureOpen(true)}><Settings className="h-4 w-4 mr-2" />Configure</Button>
                        <Button onClick={() => router.push('/projects/new')}><Plus className="h-4 w-4 mr-2" />Add Project</Button>
                    </div>
                </div>

                {/* Table */}
                {filteredProjects.length === 0 ? (
                    <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
                        <div className="text-center"><FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-3" /><h3 className="text-lg font-medium">No projects found</h3></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full w-full text-sm text-left">
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    {visibleColumns.map(col => (
                                        <TableHead key={col.id} className={`whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''}`} onClick={() => col.sortable && handleSort(col.id)}>
                                            <div className="flex items-center gap-1">
                                                {col.label}
                                                {col.sortable && <ArrowUpDown className={`h-3 w-3 ${sortField === col.id ? 'text-blue-600' : 'text-slate-400'}`} />}
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProjects.map(project => (
                                    <TableRow key={project.id}>
                                        {visibleColumns.map(col => (
                                            <TableCell key={col.id} className="whitespace-nowrap">{col.accessor(project)}</TableCell>
                                        ))}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${project.id}`)} className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${project.id}/edit`)} className="h-8 w-8 p-0"><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" onClick={() => { setDeletingProject(project); setIsDeleteDialogOpen(true); }} className="h-8 w-8 p-0 hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </table>
                    </div>
                )}
                <div className="mt-4 text-sm text-slate-500">{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Manage Columns Dialog */}
            <Dialog open={isColumnsOpen} onOpenChange={setIsColumnsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manage Columns</DialogTitle>
                        <DialogDescription>Select and reorder columns for your view</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                        {columns.map((col, idx) => (
                            <div key={col.id} className={`flex items-center gap-3 p-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b last:border-b-0`}>
                                <Checkbox checked={col.visible} onCheckedChange={() => toggleColumn(col.id)} />
                                <span className="flex-1 text-sm font-medium">{col.label}</span>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => moveColumn(col.id, 'up')} disabled={idx === 0} className="h-7 w-7 p-0"><ChevronUp className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => moveColumn(col.id, 'down')} disabled={idx === columns.length - 1} className="h-7 w-7 p-0"><ChevronDown className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsColumnsOpen(false)}>Cancel</Button>
                        <Button onClick={saveColumns}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Project</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete &quot;{deletingProject?.name}&quot;?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            <ConfigurePanel isOpen={isConfigureOpen} onClose={() => { setIsConfigureOpen(false); refreshData(); }} title="Project Configuration" description="Manage project-related lookup values" lookups={[{ category: 'project_status_types', label: 'Project Status Types' }, { category: 'contract_status_types', label: 'Contract Status Types' }, { category: 'shift_types', label: 'Shift Types' }, { category: 'warehouse_locations', label: 'Warehouse Locations' }]} />
        </PageWrapper>
    );
}
