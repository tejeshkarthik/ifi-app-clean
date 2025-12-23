'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@/components/page-wrapper';
import { ExportModal, ExportDropdown, type ExportOptions } from '@/components/export-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    getTimesheets,
    deleteTimesheet,
    type Timesheet,
    type TimesheetStatus,
} from '@/lib/timesheet-storage';
import { getProjects, type Project } from '@/lib/project-storage';
import { exportToExcel, exportToPDF, TIMESHEET_COLUMNS } from '@/lib/export-utils';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Clock, Eye } from 'lucide-react';

const STATUS_COLORS: Record<TimesheetStatus, string> = {
    'Draft': 'bg-slate-100 text-slate-700',
    'Pending Approval': 'bg-amber-100 text-amber-700',
    'Approved': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
};

export default function TimesheetListPage() {
    const router = useRouter();
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [projectFilter, setProjectFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingTimesheet, setDeletingTimesheet] = useState<Timesheet | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setTimesheets(getTimesheets());
        setProjects(getProjects());
    };

    const filteredTimesheets = timesheets
        .filter(t => {
            const matchesSearch =
                t.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.epNumber.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProject = projectFilter === 'all' || t.projectId === projectFilter;
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
            return matchesSearch && matchesProject && matchesStatus;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDelete = () => {
        if (!deletingTimesheet) return;
        deleteTimesheet(deletingTimesheet.id);
        refreshData();
        setIsDeleteDialogOpen(false);
        setDeletingTimesheet(null);
    };

    const handleExport = (options: ExportOptions) => {
        let dataToExport = filteredTimesheets.map(t => ({
            ...t,
            employeeCount: t.entries.length,
            totalHours: t.entries.reduce((sum, e) => sum + (e.totalHours || 0), 0),
        }));
        if (options.projectId !== 'all') {
            dataToExport = dataToExport.filter(t => t.projectId === options.projectId);
        }
        if (options.fromDate) {
            dataToExport = dataToExport.filter(t => t.date >= options.fromDate);
        }
        if (options.toDate) {
            dataToExport = dataToExport.filter(t => t.date <= options.toDate);
        }
        if (options.format === 'excel') {
            exportToExcel(dataToExport as unknown as Record<string, unknown>[], TIMESHEET_COLUMNS, 'timesheets');
        } else {
            exportToPDF(dataToExport as unknown as Record<string, unknown>[], TIMESHEET_COLUMNS, 'Timesheets', 'timesheets');
        }
        toast.success('Export initiated');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <PageWrapper title="Timesheets" description="Manage daily timesheet entries">
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search timesheets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by project" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="ml-auto flex items-center gap-2">
                        <ExportDropdown onExportAll={() => setIsExportModalOpen(true)} />
                        <Button onClick={() => router.push('/forms/timesheet/new')}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Timesheet
                        </Button>
                    </div>
                </div>

                {/* Table */}
                {filteredTimesheets.length === 0 ? (
                    <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-lg">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Clock className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700 mb-1">
                                {searchQuery || projectFilter !== 'all' || statusFilter !== 'all'
                                    ? 'No timesheets found'
                                    : 'No timesheets yet'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {searchQuery || projectFilter !== 'all' || statusFilter !== 'all'
                                    ? 'Try different filters'
                                    : 'Create your first timesheet'}
                            </p>
                            {!searchQuery && projectFilter === 'all' && statusFilter === 'all' && (
                                <Button onClick={() => router.push('/forms/timesheet/new')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Timesheet
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>EP #</TableHead>
                                    <TableHead>Shift</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTimesheets.map((timesheet) => (
                                    <TableRow key={timesheet.id}>
                                        <TableCell className="font-medium">{formatDate(timesheet.date)}</TableCell>
                                        <TableCell>{timesheet.projectName}</TableCell>
                                        <TableCell className="font-mono text-slate-600">{timesheet.epNumber}</TableCell>
                                        <TableCell>{timesheet.shiftName || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{timesheet.entries.length} employee{timesheet.entries.length !== 1 ? 's' : ''}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_COLORS[timesheet.status]}>{timesheet.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/forms/timesheet/${timesheet.id}`)}
                                                    className="h-8 w-8 p-0"
                                                    title="View/Edit"
                                                >
                                                    <Eye className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDeletingTimesheet(timesheet);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                                    title="Delete"
                                                    disabled={timesheet.status === 'Approved'}
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
                    {filteredTimesheets.length} timesheet{filteredTimesheets.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Timesheet</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this timesheet for {deletingTimesheet?.projectName}? This action cannot be undone.
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

            {/* Export Modal */}
            <ExportModal
                open={isExportModalOpen}
                onOpenChange={setIsExportModalOpen}
                title="Timesheets"
                projects={projects}
                onExport={handleExport}
            />
        </PageWrapper>
    );
}
