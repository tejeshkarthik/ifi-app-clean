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
    getCompanies,
    addCompany,
    updateCompany,
    deleteCompany,
    addPOC,
    updatePOC,
    deletePOC,
    type Company,
    type POC,
    type CompanyType,
} from '@/lib/company-storage';
import {
    Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight,
    User, Phone, Mail, ArrowUpDown, Globe, Linkedin
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CompanyListProps {
    type: CompanyType;
    title: string;
    description: string;
    entityName: string; // "Owner", "Contractor", "Inspector"
}

type SortField = 'name' | 'city' | 'state';
type SortDirection = 'asc' | 'desc';

export function CompanyList({ type, title, description, entityName }: CompanyListProps) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);

    // Company modals
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isDeleteCompanyDialogOpen, setIsDeleteCompanyDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

    // POC modals
    const [isPOCModalOpen, setIsPOCModalOpen] = useState(false);
    const [isDeletePOCDialogOpen, setIsDeletePOCDialogOpen] = useState(false);
    const [editingPOC, setEditingPOC] = useState<POC | null>(null);
    const [deletingPOC, setDeletingPOC] = useState<POC | null>(null);
    const [pocParentCompanyId, setPocParentCompanyId] = useState<string | null>(null);

    // Company form state
    const [companyForm, setCompanyForm] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        website: '',
        isActive: true,
    });

    // POC form state
    const [pocForm, setPocForm] = useState({
        name: '',
        title: '',
        phone: '',
        secondaryPhone: '',
        email: '',
        linkedInUrl: '',
        notes: '',
        isActive: true,
    });

    useEffect(() => {
        refreshData();
    }, [type]);

    const refreshData = () => {
        setCompanies(getCompanies(type));
    };

    // Filter and sort
    const filteredCompanies = companies
        .filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.state.toLowerCase().includes(searchQuery.toLowerCase())
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

    // Company handlers
    const openAddCompanyModal = () => {
        setEditingCompany(null);
        setCompanyForm({ name: '', address: '', city: '', state: '', zip: '', phone: '', email: '', website: '', isActive: true });
        setIsCompanyModalOpen(true);
    };

    const openEditCompanyModal = (company: Company) => {
        setEditingCompany(company);
        setCompanyForm({
            name: company.name,
            address: company.address,
            city: company.city,
            state: company.state,
            zip: company.zip,
            phone: company.phone || '',
            email: company.email || '',
            website: company.website || '',
            isActive: company.isActive,
        });
        setIsCompanyModalOpen(true);
    };

    const handleSaveCompany = () => {
        if (!companyForm.name.trim()) return;

        if (editingCompany) {
            updateCompany(type, editingCompany.id, companyForm);
        } else {
            addCompany(type, companyForm);
        }

        refreshData();
        setIsCompanyModalOpen(false);
    };

    const handleDeleteCompany = () => {
        if (!deletingCompany) return;
        deleteCompany(type, deletingCompany.id);
        refreshData();
        setIsDeleteCompanyDialogOpen(false);
        setDeletingCompany(null);
        if (expandedCompanyId === deletingCompany.id) {
            setExpandedCompanyId(null);
        }
    };

    // POC handlers
    const openAddPOCModal = (companyId: string) => {
        setPocParentCompanyId(companyId);
        setEditingPOC(null);
        setPocForm({ name: '', title: '', phone: '', secondaryPhone: '', email: '', linkedInUrl: '', notes: '', isActive: true });
        setIsPOCModalOpen(true);
    };

    const openEditPOCModal = (companyId: string, poc: POC) => {
        setPocParentCompanyId(companyId);
        setEditingPOC(poc);
        setPocForm({
            name: poc.name,
            title: poc.title,
            phone: poc.phone,
            secondaryPhone: poc.secondaryPhone || '',
            email: poc.email,
            linkedInUrl: poc.linkedInUrl || '',
            notes: poc.notes || '',
            isActive: poc.isActive,
        });
        setIsPOCModalOpen(true);
    };

    const handleSavePOC = () => {
        if (!pocForm.name.trim() || !pocParentCompanyId) return;

        if (editingPOC) {
            updatePOC(type, pocParentCompanyId, editingPOC.id, pocForm);
        } else {
            addPOC(type, pocParentCompanyId, pocForm);
        }

        refreshData();
        setIsPOCModalOpen(false);
    };

    const handleDeletePOC = () => {
        if (!deletingPOC || !pocParentCompanyId) return;
        deletePOC(type, pocParentCompanyId, deletingPOC.id);
        refreshData();
        setIsDeletePOCDialogOpen(false);
        setDeletingPOC(null);
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
        <PageWrapper title={title} description={description}>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={`Search ${title.toLowerCase()}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={openAddCompanyModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add {entityName}
                    </Button>
                </div>

                {/* Table */}
                {filteredCompanies.length === 0 ? (
                    <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-lg">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Plus className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700 mb-1">
                                {searchQuery ? `No ${title.toLowerCase()} found` : `No ${title.toLowerCase()} yet`}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {searchQuery ? 'Try a different search' : `Add your first ${entityName.toLowerCase()}`}
                            </p>
                            {!searchQuery && (
                                <Button onClick={openAddCompanyModal}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add {entityName}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-10"></TableHead>
                                    <SortableHeader field="name">{entityName} Name</SortableHeader>
                                    <SortableHeader field="city">Location</SortableHeader>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>POCs</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCompanies.map((company) => (
                                    <>
                                        <TableRow key={company.id} className="group">
                                            <TableCell>
                                                <button
                                                    onClick={() => setExpandedCompanyId(
                                                        expandedCompanyId === company.id ? null : company.id
                                                    )}
                                                    className="p-1 hover:bg-slate-100 rounded"
                                                >
                                                    {expandedCompanyId === company.id ? (
                                                        <ChevronDown className="h-4 w-4 text-slate-500" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-slate-500" />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="font-medium">{company.name}</TableCell>
                                            <TableCell className="text-slate-600 text-sm">{company.city}{company.city && company.state ? ', ' : ''}{company.state}</TableCell>
                                            <TableCell>
                                                {company.phone && (
                                                    <span className="flex items-center gap-1 text-slate-600 text-sm">
                                                        <Phone className="h-3 w-3" />
                                                        {company.phone}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {company.email && (
                                                    <span className="flex items-center gap-1 text-slate-600 text-sm">
                                                        <Mail className="h-3 w-3" />
                                                        {company.email}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal">
                                                    {company.pocs.length} POC{company.pocs.length !== 1 ? 's' : ''}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {company.isActive ? (
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
                                                        onClick={() => openEditCompanyModal(company)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Pencil className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setDeletingCompany(company);
                                                            setIsDeleteCompanyDialogOpen(true);
                                                        }}
                                                        className="h-8 w-8 p-0 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded POC Section */}
                                        {expandedCompanyId === company.id && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="bg-slate-50 p-0">
                                                    <div className="p-4 border-t border-slate-200">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="font-medium text-slate-700 flex items-center gap-2">
                                                                <User className="h-4 w-4" />
                                                                Points of Contact
                                                            </h4>
                                                            <Button size="sm" variant="outline" onClick={() => openAddPOCModal(company.id)}>
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Add POC
                                                            </Button>
                                                        </div>

                                                        {company.pocs.length === 0 ? (
                                                            <p className="text-sm text-slate-500 text-center py-4">
                                                                No POCs configured. Click &quot;Add POC&quot; to add one.
                                                            </p>
                                                        ) : (
                                                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Name</TableHead>
                                                                            <TableHead>Title</TableHead>
                                                                            <TableHead>Phone</TableHead>
                                                                            <TableHead>Email</TableHead>
                                                                            <TableHead>Status</TableHead>
                                                                            <TableHead className="text-right">Actions</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {company.pocs.map((poc) => (
                                                                            <TableRow key={poc.id}>
                                                                                <TableCell className="font-medium">{poc.name}</TableCell>
                                                                                <TableCell className="text-slate-600">{poc.title || '-'}</TableCell>
                                                                                <TableCell>
                                                                                    {poc.phone && (
                                                                                        <span className="flex items-center gap-1 text-slate-600">
                                                                                            <Phone className="h-3 w-3" />
                                                                                            {poc.phone}
                                                                                        </span>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {poc.email && (
                                                                                        <span className="flex items-center gap-1 text-slate-600">
                                                                                            <Mail className="h-3 w-3" />
                                                                                            {poc.email}
                                                                                        </span>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {poc.isActive ? (
                                                                                        <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                                                                                    ) : (
                                                                                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            onClick={() => openEditPOCModal(company.id, poc)}
                                                                                            className="h-7 w-7 p-0"
                                                                                        >
                                                                                            <Pencil className="h-3 w-3 text-slate-500" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            onClick={() => {
                                                                                                setPocParentCompanyId(company.id);
                                                                                                setDeletingPOC(poc);
                                                                                                setIsDeletePOCDialogOpen(true);
                                                                                            }}
                                                                                            className="h-7 w-7 p-0 hover:bg-red-50"
                                                                                        >
                                                                                            <Trash2 className="h-3 w-3 text-red-500" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <div className="mt-4 text-sm text-slate-500">
                    {filteredCompanies.length} {entityName.toLowerCase()}{filteredCompanies.length !== 1 ? 's' : ''}
                    {searchQuery && ` matching "${searchQuery}"`}
                </div>
            </div>

            {/* Add/Edit Company Modal */}
            <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCompany ? `Edit ${entityName}` : `Add ${entityName}`}</DialogTitle>
                        <DialogDescription>
                            {editingCompany ? `Update ${entityName.toLowerCase()} information` : `Add a new ${entityName.toLowerCase()}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{entityName} Name *</Label>
                            <Input
                                id="name"
                                value={companyForm.name}
                                onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={`Enter ${entityName.toLowerCase()} name`}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={companyForm.address}
                                onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Street address"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={companyForm.city}
                                    onChange={(e) => setCompanyForm(prev => ({ ...prev, city: e.target.value }))}
                                    placeholder="City"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={companyForm.state}
                                    onChange={(e) => setCompanyForm(prev => ({ ...prev, state: e.target.value }))}
                                    placeholder="State"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zip">ZIP</Label>
                                <Input
                                    id="zip"
                                    value={companyForm.zip}
                                    onChange={(e) => setCompanyForm(prev => ({ ...prev, zip: e.target.value }))}
                                    placeholder="ZIP"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={companyForm.phone}
                                    onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={companyForm.email}
                                    onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="contact@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                value={companyForm.website}
                                onChange={(e) => setCompanyForm(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="https://www.company.com"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <Label htmlFor="status">Active</Label>
                                <p className="text-sm text-slate-500">Available for selection in projects</p>
                            </div>
                            <Switch
                                id="status"
                                checked={companyForm.isActive}
                                onCheckedChange={(checked) => setCompanyForm(prev => ({ ...prev, isActive: checked }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCompanyModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveCompany} disabled={!companyForm.name.trim()}>
                            {editingCompany ? 'Save Changes' : `Add ${entityName}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit POC Modal */}
            <Dialog open={isPOCModalOpen} onOpenChange={setIsPOCModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPOC ? 'Edit POC' : 'Add POC'}</DialogTitle>
                        <DialogDescription>
                            {editingPOC ? 'Update point of contact information' : 'Add a new point of contact'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="poc-name">Name *</Label>
                                <Input
                                    id="poc-name"
                                    value={pocForm.name}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poc-title">Title</Label>
                                <Input
                                    id="poc-title"
                                    value={pocForm.title}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Job title"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="poc-phone">Phone</Label>
                                <Input
                                    id="poc-phone"
                                    value={pocForm.phone}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poc-secondary-phone">Secondary Phone</Label>
                                <Input
                                    id="poc-secondary-phone"
                                    value={pocForm.secondaryPhone}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, secondaryPhone: e.target.value }))}
                                    placeholder="(555) 987-6543"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="poc-email">Email</Label>
                                <Input
                                    id="poc-email"
                                    type="email"
                                    value={pocForm.email}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@company.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poc-linkedin">LinkedIn URL</Label>
                                <Input
                                    id="poc-linkedin"
                                    value={pocForm.linkedInUrl}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, linkedInUrl: e.target.value }))}
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="poc-notes">Notes</Label>
                            <Textarea
                                id="poc-notes"
                                value={pocForm.notes}
                                onChange={(e) => setPocForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Additional notes about this contact..."
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <Label htmlFor="poc-status">Active</Label>
                                <p className="text-sm text-slate-500">Available for selection</p>
                            </div>
                            <Switch
                                id="poc-status"
                                checked={pocForm.isActive}
                                onCheckedChange={(checked) => setPocForm(prev => ({ ...prev, isActive: checked }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPOCModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSavePOC} disabled={!pocForm.name.trim()}>
                            {editingPOC ? 'Save Changes' : 'Add POC'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Company Confirmation */}
            <AlertDialog open={isDeleteCompanyDialogOpen} onOpenChange={setIsDeleteCompanyDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {entityName}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingCompany?.name}&quot;?
                            This will also delete all associated POCs. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCompany} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete POC Confirmation */}
            <AlertDialog open={isDeletePOCDialogOpen} onOpenChange={setIsDeletePOCDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete POC</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingPOC?.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePOC} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageWrapper>
    );
}
