'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

interface Project {
    id: string;
    name: string;
}

interface ExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    projects: Project[];
    onExport: (options: ExportOptions) => void;
}

export interface ExportOptions {
    projectId: string;
    fromDate: string;
    toDate: string;
    status: string;
    format: 'excel' | 'pdf';
}

export function ExportModal({
    open,
    onOpenChange,
    title,
    projects,
    onExport,
}: ExportModalProps) {
    const [projectId, setProjectId] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [status, setStatus] = useState('all');
    const [format, setFormat] = useState<'excel' | 'pdf'>('excel');

    const handleExport = () => {
        onExport({
            projectId,
            fromDate,
            toDate,
            status,
            format,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export {title}</DialogTitle>
                    <DialogDescription>
                        Configure export options and select a format.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Project Filter */}
                    <div className="grid gap-2">
                        <Label>Project</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>From Date</Label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>To Date</Label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Format Selection */}
                    <div className="grid gap-2">
                        <Label>Format</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={format === 'excel' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => setFormat('excel')}
                            >
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Excel
                            </Button>
                            <Button
                                type="button"
                                variant={format === 'pdf' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => setFormat('pdf')}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                PDF
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Export Dropdown Button Component
interface ExportDropdownProps {
    onExportAll: () => void;
    onExportSelected?: () => void;
    hasSelection?: boolean;
}

export function ExportDropdown({
    onExportAll,
    onExportSelected,
    hasSelection = false,
}: ExportDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportAll}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportAll}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to PDF
                </DropdownMenuItem>
                {onExportSelected && (
                    <DropdownMenuItem
                        onClick={onExportSelected}
                        disabled={!hasSelection}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
