'use client';

import { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
    getMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    type Material,
} from '@/lib/material-storage';
import { getActiveLookupValues } from '@/lib/lookup-storage';
import { ConfigurePanel, ConfigureButton } from '@/components/configure-panel';
import { ExcelImport, type ColumnConfig } from '@/components/excel-import';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Package, Settings } from 'lucide-react';

type SortField = 'code' | 'description' | 'uomName' | 'fullRollArea';
type SortDirection = 'asc' | 'desc';

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('code');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isConfigureOpen, setIsConfigureOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);

    // Lookup values
    const [uomOptions, setUomOptions] = useState<{ id: string; name: string }[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        uomId: '',
        fullRollArea: '',
        isActive: true,
    });

    // Configure panel lookups
    const materialLookups = [
        { category: 'asphalt_mix_types' as const, label: 'Asphalt Mix Types' },
        { category: 'oil_types' as const, label: 'Oil Types' },
        { category: 'oil_grades' as const, label: 'Oil Grades' },
        { category: 'tack_coat_types' as const, label: 'Tack Coat Types' },
        { category: 'high_grade_types' as const, label: 'High Grade Types' },
        { category: 'uom_types' as const, label: 'UoM Types' },
    ];

    // Excel import columns
    const importColumns: ColumnConfig[] = [
        { key: 'code', header: 'Material Code', required: true },
        { key: 'description', header: 'Description', required: true },
        { key: 'uom', header: 'UoM' },
        { key: 'fullRollArea', header: 'Full Roll Area' },
    ];

    const handleImport = (data: Record<string, string>[]) => {
        let success = 0;
        let errors = 0;

        data.forEach(row => {
            try {
                if (!row.code || !row.description) {
                    errors++;
                    return;
                }

                // Find UoM by name
                const uom = uomOptions.find(u =>
                    u.name.toLowerCase() === (row.uom || '').toLowerCase()
                );

                addMaterial({
                    code: row.code,
                    description: row.description,
                    uomId: uom?.id || '',
                    uomName: uom?.name || '',
                    fullRollArea: row.fullRollArea ? parseFloat(row.fullRollArea) : null,
                    isActive: true,
                });
                success++;
            } catch {
                errors++;
            }
        });

        refreshData();
        return { success, errors };
    };

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setMaterials(getMaterials());
        setUomOptions(getActiveLookupValues('uom_types').map(v => ({ id: v.id, name: v.name })));
    };

    // Filter and sort
    const filteredMaterials = materials
        .filter(m =>
            m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            let aVal: string | number = '';
            let bVal: string | number = '';

            if (sortField === 'fullRollArea') {
                aVal = a.fullRollArea || 0;
                bVal = b.fullRollArea || 0;
                return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
            }

            aVal = a[sortField]?.toString().toLowerCase() || '';
            bVal = b[sortField]?.toString().toLowerCase() || '';
            return sortDirection === 'asc'
                ? aVal.localeCompare(bVal as string)
                : (bVal as string).localeCompare(aVal);
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
        setEditingMaterial(null);
        setFormData({ code: '', description: '', uomId: '', fullRollArea: '', isActive: true });
        setIsModalOpen(true);
    };

    const openEditModal = (material: Material) => {
        setEditingMaterial(material);
        setFormData({
            code: material.code,
            description: material.description,
            uomId: material.uomId,
            fullRollArea: material.fullRollArea?.toString() || '',
            isActive: material.isActive,
        });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.code.trim() || !formData.description.trim()) return;

        const uomName = uomOptions.find(u => u.id === formData.uomId)?.name || '';

        const materialData = {
            code: formData.code.trim(),
            description: formData.description.trim(),
            uomId: formData.uomId,
            uomName,
            fullRollArea: formData.fullRollArea ? parseFloat(formData.fullRollArea) : null,
            isActive: formData.isActive,
        };

        if (editingMaterial) {
            updateMaterial(editingMaterial.id, materialData);
        } else {
            addMaterial(materialData);
        }

        refreshData();
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (!deletingMaterial) return;
        deleteMaterial(deletingMaterial.id);
        refreshData();
        setIsDeleteDialogOpen(false);
        setDeletingMaterial(null);
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
        <PageWrapper title="Materials" description="Manage material codes and specifications">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by code or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <ExcelImport
                            columns={importColumns}
                            onImport={handleImport}
                            templateFilename="materials_template"
                        />
                        <ConfigureButton onClick={() => setIsConfigureOpen(true)} />
                        <Button onClick={openAddModal}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Material
                        </Button>
                    </div>
                </div>

                {/* Table */}
                {filteredMaterials.length === 0 ? (
                    <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-lg">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Package className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700 mb-1">
                                {searchQuery ? 'No materials found' : 'No materials yet'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {searchQuery ? 'Try a different search' : 'Add your first material'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={openAddModal}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Material
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <SortableHeader field="code">Material Code</SortableHeader>
                                    <SortableHeader field="description">Description</SortableHeader>
                                    <SortableHeader field="uomName">UoM</SortableHeader>
                                    <SortableHeader field="fullRollArea">Full Roll (SY)</SortableHeader>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMaterials.map((material) => (
                                    <TableRow key={material.id}>
                                        <TableCell className="font-mono font-medium">{material.code}</TableCell>
                                        <TableCell>{material.description}</TableCell>
                                        <TableCell>
                                            {material.uomName && (
                                                <Badge variant="outline">{material.uomName}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {material.fullRollArea?.toLocaleString() || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {material.isActive ? (
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
                                                    onClick={() => openEditModal(material)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDeletingMaterial(material);
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
                    {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''}
                    {searchQuery && ` matching "${searchQuery}"`}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add Material'}</DialogTitle>
                        <DialogDescription>
                            {editingMaterial ? 'Update material specifications' : 'Add a new material to the catalog'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Material Code *</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                placeholder="RG50-12.5"
                                className="font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="ROADGLAS 50 12.5' X 1,080'"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Unit of Measure</Label>
                                <Select
                                    value={formData.uomId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, uomId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select UoM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uomOptions.length === 0 ? (
                                            <div className="px-2 py-4 text-sm text-slate-500 text-center">
                                                No UoM types configured.<br />
                                                Add them in Lookup Tables.
                                            </div>
                                        ) : (
                                            uomOptions.map((uom) => (
                                                <SelectItem key={uom.id} value={uom.id}>{uom.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fullRollArea">Full Roll Area (SY)</Label>
                                <Input
                                    id="fullRollArea"
                                    type="number"
                                    value={formData.fullRollArea}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fullRollArea: e.target.value }))}
                                    placeholder="1500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <Label htmlFor="status">Active</Label>
                                <p className="text-sm text-slate-500">Available for selection in forms</p>
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
                            disabled={!formData.code.trim() || !formData.description.trim()}
                        >
                            {editingMaterial ? 'Save Changes' : 'Add Material'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Material</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingMaterial?.code}&quot;? This action cannot be undone.
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

            {/* Configure Panel */}
            <ConfigurePanel
                isOpen={isConfigureOpen}
                onClose={() => {
                    setIsConfigureOpen(false);
                    refreshData();
                }}
                title="Material Settings"
                description="Configure material-related lookup values"
                lookups={materialLookups}
            />
        </PageWrapper>
    );
}
