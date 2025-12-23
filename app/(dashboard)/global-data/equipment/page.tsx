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
    getEquipment,
    addEquipmentItem,
    updateEquipmentItem,
    deleteEquipmentItem,
    OWNERSHIP_OPTIONS,
    type Equipment,
    type OwnershipType,
} from '@/lib/equipment-storage';
import { getActiveLookupValues } from '@/lib/lookup-storage';
import { ConfigurePanel } from '@/components/configure-panel';
import { ExcelImport } from '@/components/excel-import';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Truck, Settings } from 'lucide-react';

type SortField = 'code' | 'name' | 'categoryName' | 'ownership';
type SortDirection = 'asc' | 'desc';

export default function EquipmentPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('code');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);

    // Lookup values
    const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string }[]>([]);

    // Configure panel state
    const [isConfigureOpen, setIsConfigureOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        categoryId: '',
        ownership: 'Owned' as OwnershipType,
        vendor: '',
        poNumber: '',
        isActive: true,
    });

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setEquipment(getEquipment());
        setCategoryOptions(getActiveLookupValues('equipment_categories').map(v => ({ id: v.id, name: v.name })));
    };

    // Filter and sort
    const filteredEquipment = equipment
        .filter(e =>
            e.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const aVal = a[sortField]?.toString().toLowerCase() || '';
            const bVal = b[sortField]?.toString().toLowerCase() || '';
            return sortDirection === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
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
        setEditingEquipment(null);
        setFormData({
            code: '',
            name: '',
            categoryId: '',
            ownership: 'Owned',
            vendor: '',
            poNumber: '',
            isActive: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: Equipment) => {
        setEditingEquipment(item);
        setFormData({
            code: item.code,
            name: item.name,
            categoryId: item.categoryId,
            ownership: item.ownership,
            vendor: item.vendor,
            poNumber: item.poNumber,
            isActive: item.isActive,
        });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.code.trim() || !formData.name.trim()) return;

        // Validate rented fields
        if (formData.ownership === 'Rented' && (!formData.vendor.trim() || !formData.poNumber.trim())) {
            return;
        }

        const categoryName = categoryOptions.find(c => c.id === formData.categoryId)?.name || '';

        const equipmentData = {
            code: formData.code.trim(),
            name: formData.name.trim(),
            categoryId: formData.categoryId,
            categoryName,
            ownership: formData.ownership,
            vendor: formData.ownership === 'Rented' ? formData.vendor.trim() : '',
            poNumber: formData.ownership === 'Rented' ? formData.poNumber.trim() : '',
            isActive: formData.isActive,
        };

        if (editingEquipment) {
            updateEquipmentItem(editingEquipment.id, equipmentData);
        } else {
            addEquipmentItem(equipmentData);
        }

        refreshData();
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (!deletingEquipment) return;
        deleteEquipmentItem(deletingEquipment.id);
        refreshData();
        setIsDeleteDialogOpen(false);
        setDeletingEquipment(null);
    };

    const isFormValid = () => {
        if (!formData.code.trim() || !formData.name.trim()) return false;
        if (formData.ownership === 'Rented' && (!formData.vendor.trim() || !formData.poNumber.trim())) return false;
        return true;
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
        <PageWrapper title="Equipment" description="Manage company-owned and rented equipment">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search equipment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsConfigureOpen(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                        </Button>
                        <ExcelImport
                            columns={[
                                { key: 'code', header: 'Equipment Code', required: true },
                                { key: 'name', header: 'Equipment Name', required: true },
                                { key: 'category', header: 'Category' },
                                { key: 'ownership', header: 'Ownership' },
                                { key: 'vendor', header: 'Vendor' },
                                { key: 'poNumber', header: 'PO Number' },
                            ]}
                            templateFilename="equipment_template"
                            onImport={(data) => {
                                data.forEach(row => {
                                    const matchedCategory = categoryOptions.find(c => c.name.toLowerCase() === row['category']?.toLowerCase());
                                    const ownership = (row['ownership']?.toLowerCase() === 'rented' ? 'Rented' : 'Owned') as OwnershipType;
                                    addEquipmentItem({
                                        code: row['code'] || '',
                                        name: row['name'] || '',
                                        categoryId: matchedCategory?.id || '',
                                        categoryName: matchedCategory?.name || '',
                                        ownership,
                                        vendor: ownership === 'Rented' ? (row['vendor'] || '') : '',
                                        poNumber: ownership === 'Rented' ? (row['poNumber'] || '') : '',
                                        isActive: true,
                                    });
                                });
                                refreshData();
                                return { success: data.length, errors: 0 };
                            }}
                        />
                        <Button onClick={openAddModal}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Equipment
                        </Button>
                    </div>
                </div>

                {/* Table */}
                {filteredEquipment.length === 0 ? (
                    <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-lg">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Truck className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700 mb-1">
                                {searchQuery ? 'No equipment found' : 'No equipment yet'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {searchQuery ? 'Try a different search' : 'Add your first equipment'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={openAddModal}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Equipment
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <SortableHeader field="code">Equipment Code</SortableHeader>
                                    <SortableHeader field="name">Equipment Name</SortableHeader>
                                    <SortableHeader field="categoryName">Category</SortableHeader>
                                    <SortableHeader field="ownership">Ownership</SortableHeader>
                                    <TableHead>Vendor/PO</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEquipment.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono font-medium">{item.code}</TableCell>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>
                                            {item.categoryName && (
                                                <Badge variant="outline">{item.categoryName}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={item.ownership === 'Owned'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                }
                                            >
                                                {item.ownership}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm">
                                            {item.ownership === 'Rented' ? (
                                                <div>
                                                    <div>{item.vendor}</div>
                                                    <div className="text-slate-400">PO: {item.poNumber}</div>
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.isActive ? (
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
                                                    onClick={() => openEditModal(item)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDeletingEquipment(item);
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
                    {filteredEquipment.length} equipment item{filteredEquipment.length !== 1 ? 's' : ''}
                    {searchQuery && ` matching "${searchQuery}"`}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
                        <DialogDescription>
                            {editingEquipment ? 'Update equipment information' : 'Add new equipment to the inventory'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Equipment Code *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                    placeholder="EQ001"
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Equipment Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Paving Machine"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categoryOptions.length === 0 ? (
                                            <div className="px-2 py-4 text-sm text-slate-500 text-center">
                                                No categories configured.<br />
                                                Add them in Lookup Tables.
                                            </div>
                                        ) : (
                                            categoryOptions.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ownership *</Label>
                                <Select
                                    value={formData.ownership}
                                    onValueChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        ownership: value as OwnershipType,
                                        vendor: value === 'Owned' ? '' : prev.vendor,
                                        poNumber: value === 'Owned' ? '' : prev.poNumber,
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {OWNERSHIP_OPTIONS.map((type) => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Rented equipment fields */}
                        {formData.ownership === 'Rented' && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="space-y-2">
                                    <Label htmlFor="vendor">Vendor *</Label>
                                    <Input
                                        id="vendor"
                                        value={formData.vendor}
                                        onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                                        placeholder="Rental company name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="poNumber">PO Number *</Label>
                                    <Input
                                        id="poNumber"
                                        value={formData.poNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                                        placeholder="PO-12345"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <Label htmlFor="status">Active</Label>
                                <p className="text-sm text-slate-500">Available for assignment to projects</p>
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
                        <Button onClick={handleSave} disabled={!isFormValid()}>
                            {editingEquipment ? 'Save Changes' : 'Add Equipment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingEquipment?.name}&quot;? This action cannot be undone.
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
                title="Equipment Configuration"
                description="Manage equipment categories and types"
                lookups={[
                    { category: 'equipment_categories', label: 'Equipment Categories' },
                    { category: 'van_truck_types', label: 'Van/Truck Types' },
                    { category: 'pipe_length_options', label: 'Pipe Length Options' },
                ]}
            />
        </PageWrapper>
    );
}
