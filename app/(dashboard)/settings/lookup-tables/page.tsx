'use client';

import { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
    LOOKUP_CATEGORIES,
    getLookupValues,
    addLookupValue,
    updateLookupValue,
    deleteLookupValue,
    toggleLookupValueStatus,
    type LookupValue,
    type LookupCategoryId,
} from '@/lib/lookup-storage';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export default function LookupTablesPage() {
    const [selectedCategory, setSelectedCategory] = useState<LookupCategoryId>(LOOKUP_CATEGORIES[0].id);
    const [values, setValues] = useState<LookupValue[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingValue, setEditingValue] = useState<LookupValue | null>(null);
    const [deletingValue, setDeletingValue] = useState<LookupValue | null>(null);
    const [newValueName, setNewValueName] = useState('');
    const [newValueActive, setNewValueActive] = useState(true);

    // Load values when category changes
    useEffect(() => {
        setValues(getLookupValues(selectedCategory));
    }, [selectedCategory]);

    const refreshValues = () => {
        setValues(getLookupValues(selectedCategory));
    };

    const handleAdd = () => {
        if (!newValueName.trim()) return;

        addLookupValue(selectedCategory, newValueName.trim(), newValueActive);
        refreshValues();
        setIsAddModalOpen(false);
        setNewValueName('');
        setNewValueActive(true);
    };

    const handleEdit = () => {
        if (!editingValue || !newValueName.trim()) return;

        updateLookupValue(selectedCategory, editingValue.id, {
            name: newValueName.trim(),
            isActive: newValueActive,
        });
        refreshValues();
        setIsEditModalOpen(false);
        setEditingValue(null);
        setNewValueName('');
        setNewValueActive(true);
    };

    const handleDelete = () => {
        if (!deletingValue) return;

        deleteLookupValue(selectedCategory, deletingValue.id);
        refreshValues();
        setIsDeleteDialogOpen(false);
        setDeletingValue(null);
    };

    const handleToggleStatus = (value: LookupValue) => {
        toggleLookupValueStatus(selectedCategory, value.id);
        refreshValues();
    };

    const openEditModal = (value: LookupValue) => {
        setEditingValue(value);
        setNewValueName(value.name);
        setNewValueActive(value.isActive);
        setIsEditModalOpen(true);
    };

    const openDeleteDialog = (value: LookupValue) => {
        setDeletingValue(value);
        setIsDeleteDialogOpen(true);
    };

    const selectedCategoryInfo = LOOKUP_CATEGORIES.find(c => c.id === selectedCategory);

    return (
        <PageWrapper title="Lookup Tables" description="Configure dropdown options and system values">
            <div className="flex h-[calc(100vh-12rem)]">
                {/* Left side - Category list */}
                <div className="w-72 border-r border-slate-200 bg-slate-50/50 overflow-y-auto flex-shrink-0">
                    <div className="p-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Categories
                        </h3>
                        <div className="space-y-1">
                            {LOOKUP_CATEGORIES.map((category) => {
                                const categoryValues = getLookupValues(category.id);
                                const isSelected = selectedCategory === category.id;

                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between group ${isSelected
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="text-sm truncate">{category.name}</span>
                                        <Badge
                                            variant={isSelected ? "default" : "secondary"}
                                            className={`ml-2 text-xs ${isSelected ? 'bg-blue-100 text-blue-700' : ''}`}
                                        >
                                            {categoryValues.length}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right side - Values table */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">
                                {selectedCategoryInfo?.name}
                            </h2>
                            <p className="text-sm text-slate-500">{selectedCategoryInfo?.description}</p>
                        </div>
                        <Button onClick={() => {
                            setNewValueName('');
                            setNewValueActive(true);
                            setIsAddModalOpen(true);
                        }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Value
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto p-4">
                        {values.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <Plus className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-700 mb-1">No values configured</h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Add your first value to this lookup table
                                    </p>
                                    <Button onClick={() => {
                                        setNewValueName('');
                                        setNewValueActive(true);
                                        setIsAddModalOpen(true);
                                    }}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Value
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50%]">Name</TableHead>
                                        <TableHead className="w-[25%]">Status</TableHead>
                                        <TableHead className="w-[25%] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {values.map((value) => (
                                        <TableRow key={value.id}>
                                            <TableCell className="font-medium">{value.name}</TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => handleToggleStatus(value)}
                                                    className="inline-flex items-center"
                                                >
                                                    {value.isActive ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="hover:bg-slate-200 cursor-pointer">
                                                            <X className="h-3 w-3 mr-1" />
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditModal(value)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Pencil className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openDeleteDialog(value)}
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
                        )}
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Value</DialogTitle>
                        <DialogDescription>
                            Add a new value to {selectedCategoryInfo?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={newValueName}
                                onChange={(e) => setNewValueName(e.target.value)}
                                placeholder="Enter value name"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="active">Active</Label>
                                <p className="text-sm text-slate-500">This value will appear in dropdowns</p>
                            </div>
                            <Switch
                                id="active"
                                checked={newValueActive}
                                onCheckedChange={setNewValueActive}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAdd} disabled={!newValueName.trim()}>
                            Add Value
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Value</DialogTitle>
                        <DialogDescription>
                            Update this value in {selectedCategoryInfo?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={newValueName}
                                onChange={(e) => setNewValueName(e.target.value)}
                                placeholder="Enter value name"
                                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="edit-active">Active</Label>
                                <p className="text-sm text-slate-500">This value will appear in dropdowns</p>
                            </div>
                            <Switch
                                id="edit-active"
                                checked={newValueActive}
                                onCheckedChange={setNewValueActive}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={!newValueName.trim()}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Value</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingValue?.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageWrapper>
    );
}
