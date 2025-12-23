'use client';

import { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    getCompanies,
    addPOC,
    type Company,
    type POC,
    type CompanyType,
} from '@/lib/company-storage';
import { toast } from 'sonner';
import {
    Search,
    Phone,
    Mail,
    Building2,
    Download,
    Linkedin,
    User,
    Plus,
    FileText,
    X,
    AlertCircle,
} from 'lucide-react';

interface ContactWithCompany extends POC {
    companyId: string;
    companyName: string;
    companyType: CompanyType | 'unlinked';
    companyPhone?: string;
    companyEmail?: string;
    companyAddress?: string;
    companyCity?: string;
    companyState?: string;
}

interface StandaloneContact {
    id: string;
    name: string;
    title: string;
    companyName: string;
    type: 'Owner' | 'Contractor' | 'Inspector' | 'Other';
    phone: string;
    secondaryPhone: string;
    email: string;
    linkedInUrl: string;
    notes: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

type FilterType = 'all' | 'owners' | 'contractors' | 'inspectors' | 'unlinked';

const TYPE_LABELS: Record<CompanyType | 'unlinked', string> = {
    owners: 'Owner',
    contractors: 'Contractor',
    inspectors: 'Inspector',
    unlinked: 'Unlinked',
};

const TYPE_COLORS: Record<CompanyType | 'unlinked', string> = {
    owners: 'bg-blue-100 text-blue-700',
    contractors: 'bg-orange-100 text-orange-700',
    inspectors: 'bg-purple-100 text-purple-700',
    unlinked: 'bg-slate-100 text-slate-700',
};

const STANDALONE_STORAGE_KEY = 'ifi_standalone_contacts';

function getStandaloneContacts(): StandaloneContact[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STANDALONE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveStandaloneContacts(contacts: StandaloneContact[]) {
    localStorage.setItem(STANDALONE_STORAGE_KEY, JSON.stringify(contacts));
}

export default function ContactDirectoryPage() {
    const [contacts, setContacts] = useState<ContactWithCompany[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [selectedContact, setSelectedContact] = useState<ContactWithCompany | null>(null);
    const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Available companies for dropdown
    const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);

    // Add Contact form state
    const [newContact, setNewContact] = useState({
        contactType: '' as 'Owner' | 'Contractor' | 'Inspector' | 'Other' | '',
        companyId: '',
        companyName: '', // For "Other" type
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
        loadContacts();
    }, []);

    const loadContacts = () => {
        const types: CompanyType[] = ['owners', 'contractors', 'inspectors'];
        const allContacts: ContactWithCompany[] = [];

        // Load POCs from companies
        types.forEach(type => {
            const companies = getCompanies(type);
            companies.forEach(company => {
                company.pocs.forEach(poc => {
                    allContacts.push({
                        ...poc,
                        companyId: company.id,
                        companyName: company.name,
                        companyType: type,
                        companyPhone: company.phone,
                        companyEmail: company.email,
                        companyAddress: company.address,
                        companyCity: company.city,
                        companyState: company.state,
                    });
                });
            });
        });

        // Load standalone contacts
        const standaloneContacts = getStandaloneContacts();
        standaloneContacts.forEach(contact => {
            allContacts.push({
                id: contact.id,
                name: contact.name,
                title: contact.title,
                email: contact.email,
                phone: contact.phone,
                secondaryPhone: contact.secondaryPhone,
                linkedInUrl: contact.linkedInUrl,
                notes: contact.notes,
                isActive: contact.isActive,
                companyId: '',
                companyName: contact.companyName,
                companyType: 'unlinked',
            });
        });

        setContacts(allContacts);
    };

    const filteredContacts = contacts.filter(contact => {
        // Filter by type
        if (filterType !== 'all' && contact.companyType !== filterType) {
            return false;
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                contact.name.toLowerCase().includes(query) ||
                contact.email?.toLowerCase().includes(query) ||
                contact.phone?.toLowerCase().includes(query) ||
                contact.companyName.toLowerCase().includes(query) ||
                contact.title?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const openContactDetails = (contact: ContactWithCompany) => {
        setSelectedContact(contact);
        setIsDetailsPanelOpen(true);
    };

    // Handler for contact type change
    const handleContactTypeChange = (type: 'Owner' | 'Contractor' | 'Inspector' | 'Other') => {
        setNewContact(prev => ({ ...prev, contactType: type, companyId: '', companyName: '' }));

        if (type === 'Other') {
            setAvailableCompanies([]);
        } else {
            const companyTypeMap: Record<string, CompanyType> = {
                'Owner': 'owners',
                'Contractor': 'contractors',
                'Inspector': 'inspectors',
            };
            const companies = getCompanies(companyTypeMap[type]);
            setAvailableCompanies(companies);
        }
    };

    const handleAddContact = () => {
        if (!newContact.name.trim()) return;
        if (!newContact.contactType) return;

        if (newContact.contactType === 'Other') {
            // Save as standalone contact
            const contact: StandaloneContact = {
                id: crypto.randomUUID(),
                name: newContact.name,
                title: newContact.title,
                companyName: newContact.companyName,
                type: 'Other',
                phone: newContact.phone,
                secondaryPhone: newContact.secondaryPhone,
                email: newContact.email,
                linkedInUrl: newContact.linkedInUrl,
                notes: newContact.notes,
                isActive: newContact.isActive,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const existing = getStandaloneContacts();
            saveStandaloneContacts([...existing, contact]);
            toast.success('Contact added successfully');
        } else {
            // Save as POC to selected company
            if (!newContact.companyId) {
                toast.error('Please select a company');
                return;
            }

            const companyTypeMap: Record<string, CompanyType> = {
                'Owner': 'owners',
                'Contractor': 'contractors',
                'Inspector': 'inspectors',
            };

            const result = addPOC(companyTypeMap[newContact.contactType], newContact.companyId, {
                name: newContact.name,
                title: newContact.title,
                phone: newContact.phone,
                secondaryPhone: newContact.secondaryPhone,
                email: newContact.email,
                linkedInUrl: newContact.linkedInUrl,
                notes: newContact.notes,
                isActive: newContact.isActive,
            });

            if (result) {
                toast.success('Contact added to company');
            } else {
                toast.error('Failed to add contact');
                return;
            }
        }

        loadContacts();
        setIsAddModalOpen(false);
        resetAddForm();
    };

    const resetAddForm = () => {
        setNewContact({
            contactType: '',
            companyId: '',
            companyName: '',
            name: '',
            title: '',
            phone: '',
            secondaryPhone: '',
            email: '',
            linkedInUrl: '',
            notes: '',
            isActive: true,
        });
        setAvailableCompanies([]);
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Title', 'Company', 'Type', 'Phone', 'Secondary Phone', 'Email', 'LinkedIn'];
        const rows = filteredContacts.map(c => [
            c.name,
            c.title || '',
            c.companyName,
            TYPE_LABELS[c.companyType],
            c.phone || '',
            c.secondaryPhone || '',
            c.email || '',
            c.linkedInUrl || '',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getContactCounts = () => {
        return {
            all: contacts.length,
            owners: contacts.filter(c => c.companyType === 'owners').length,
            contractors: contacts.filter(c => c.companyType === 'contractors').length,
            inspectors: contacts.filter(c => c.companyType === 'inspectors').length,
            unlinked: contacts.filter(c => c.companyType === 'unlinked').length,
        };
    };

    const counts = getContactCounts();

    return (
        <PageWrapper title="Contact Directory" description="Centralized directory of all contacts">
            <div className="p-6">
                {/* Header with Add Button */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {/* Filter Pills */}
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                            {(['all', 'owners', 'contractors', 'inspectors', 'unlinked'] as FilterType[]).map((type) => (
                                <Button
                                    key={type}
                                    variant={filterType === type ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterType(type)}
                                    className={filterType === type ? '' : 'hover:bg-slate-200'}
                                >
                                    {type === 'all' ? 'All' : TYPE_LABELS[type]}
                                    <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                                        {counts[type]}
                                    </Badge>
                                </Button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={exportToCSV} disabled={filteredContacts.length === 0}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button onClick={() => setIsAddModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Contact
                        </Button>
                    </div>
                </div>

                {/* Table */}
                {filteredContacts.length === 0 ? (
                    <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-lg">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <User className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700 mb-1">
                                {searchQuery || filterType !== 'all' ? 'No contacts found' : 'No contacts yet'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {searchQuery || filterType !== 'all'
                                    ? 'Try adjusting your search or filter'
                                    : 'Add contacts to get started'}
                            </p>
                            {!searchQuery && filterType === 'all' && (
                                <Button onClick={() => setIsAddModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Contact
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-[200px]">Name</TableHead>
                                    <TableHead className="w-[160px]">Title</TableHead>
                                    <TableHead className="w-[200px]">Company</TableHead>
                                    <TableHead className="w-[100px]">Type</TableHead>
                                    <TableHead className="w-[140px]">Phone</TableHead>
                                    <TableHead className="w-[200px]">Email</TableHead>
                                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredContacts.map((contact) => (
                                    <TableRow
                                        key={`${contact.companyId || 'standalone'}-${contact.id}`}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => openContactDetails(contact)}
                                    >
                                        <TableCell className="font-medium">{contact.name}</TableCell>
                                        <TableCell className="text-slate-600">{contact.title || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-slate-400" />
                                                {contact.companyName || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={TYPE_COLORS[contact.companyType]}>
                                                {TYPE_LABELS[contact.companyType]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {contact.phone && (
                                                <a
                                                    href={`tel:${contact.phone}`}
                                                    className="text-blue-600 hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {contact.phone}
                                                </a>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {contact.email && (
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="text-blue-600 hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {contact.email}
                                                </a>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openContactDetails(contact);
                                                }}
                                            >
                                                <FileText className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <div className="mt-4 text-sm text-slate-500">
                    {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Add Contact Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={(open) => {
                setIsAddModalOpen(open);
                if (!open) resetAddForm();
            }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Contact</DialogTitle>
                        <DialogDescription>Add a new contact to the directory</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Step 1: Select Contact Type */}
                        <div className="space-y-2">
                            <Label>Contact Type *</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['Owner', 'Contractor', 'Inspector', 'Other'] as const).map((type) => (
                                    <Button
                                        key={type}
                                        type="button"
                                        variant={newContact.contactType === type ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleContactTypeChange(type)}
                                        className="w-full"
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Select Company (for Owner/Contractor/Inspector) */}
                        {newContact.contactType && newContact.contactType !== 'Other' && (
                            <div className="space-y-2">
                                <Label>Select {newContact.contactType} *</Label>
                                {availableCompanies.length === 0 ? (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-800">
                                        <AlertCircle className="h-4 w-4" />
                                        No {newContact.contactType.toLowerCase()}s found. Add one in Global Data first.
                                    </div>
                                ) : (
                                    <Select
                                        value={newContact.companyId}
                                        onValueChange={(v) => setNewContact({ ...newContact, companyId: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Select ${newContact.contactType.toLowerCase()}...`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableCompanies.map((company) => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}

                        {/* Company Name (for Other type) */}
                        {newContact.contactType === 'Other' && (
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name (Optional)</Label>
                                <Input
                                    id="companyName"
                                    value={newContact.companyName}
                                    onChange={(e) => setNewContact({ ...newContact, companyName: e.target.value })}
                                    placeholder="ABC Company"
                                />
                            </div>
                        )}

                        {/* Contact Details (show after type selection) */}
                        {newContact.contactType && (
                            <>
                                <div className="border-t border-slate-200 pt-4">
                                    <h4 className="text-sm font-medium text-slate-700 mb-3">Contact Details</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={newContact.name}
                                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                            placeholder="John Smith"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            value={newContact.title}
                                            onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                                            placeholder="Project Manager"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={newContact.phone}
                                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                                        <Input
                                            id="secondaryPhone"
                                            value={newContact.secondaryPhone}
                                            onChange={(e) => setNewContact({ ...newContact, secondaryPhone: e.target.value })}
                                            placeholder="(555) 987-6543"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="linkedIn">LinkedIn URL</Label>
                                    <Input
                                        id="linkedIn"
                                        value={newContact.linkedInUrl}
                                        onChange={(e) => setNewContact({ ...newContact, linkedInUrl: e.target.value })}
                                        placeholder="https://linkedin.com/in/johnsmith"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={newContact.notes}
                                        onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                                        placeholder="Any additional notes..."
                                        rows={2}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={newContact.isActive}
                                        onCheckedChange={(checked) => setNewContact({ ...newContact, isActive: checked })}
                                    />
                                    <Label>Active</Label>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddContact}
                            disabled={
                                !newContact.contactType ||
                                !newContact.name.trim() ||
                                (newContact.contactType !== 'Other' && !newContact.companyId)
                            }
                        >
                            Add Contact
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Contact Details Panel */}
            <Sheet open={isDetailsPanelOpen} onOpenChange={setIsDetailsPanelOpen}>
                <SheetContent className="w-[400px] sm:w-[480px]">
                    <SheetHeader>
                        <SheetTitle>Contact Details</SheetTitle>
                        <SheetDescription>Full contact information</SheetDescription>
                    </SheetHeader>

                    {selectedContact && (
                        <div className="mt-6 space-y-6">
                            {/* Contact Header */}
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                                    {selectedContact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-slate-800">{selectedContact.name}</h3>
                                    {selectedContact.title && (
                                        <p className="text-slate-600">{selectedContact.title}</p>
                                    )}
                                    <Badge className={`mt-2 ${TYPE_COLORS[selectedContact.companyType]}`}>
                                        {TYPE_LABELS[selectedContact.companyType]}
                                    </Badge>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4">
                                {selectedContact.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                            <Phone className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Phone</p>
                                            <a href={`tel:${selectedContact.phone}`} className="text-blue-600 hover:underline font-medium">
                                                {selectedContact.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {selectedContact.secondaryPhone && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                            <Phone className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Secondary Phone</p>
                                            <a href={`tel:${selectedContact.secondaryPhone}`} className="text-blue-600 hover:underline">
                                                {selectedContact.secondaryPhone}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {selectedContact.email && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Mail className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Email</p>
                                            <a href={`mailto:${selectedContact.email}`} className="text-blue-600 hover:underline font-medium">
                                                {selectedContact.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {selectedContact.linkedInUrl && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                                            <Linkedin className="h-5 w-5 text-sky-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">LinkedIn</p>
                                            <a
                                                href={selectedContact.linkedInUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                View Profile
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Company Info */}
                            {selectedContact.companyName && (
                                <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                                        <Building2 className="h-4 w-4" />
                                        {selectedContact.companyName}
                                    </div>
                                    {selectedContact.companyAddress && (
                                        <p className="text-sm text-slate-600">
                                            {selectedContact.companyAddress}
                                            {selectedContact.companyCity && `, ${selectedContact.companyCity}`}
                                            {selectedContact.companyState && `, ${selectedContact.companyState}`}
                                        </p>
                                    )}
                                    {selectedContact.companyPhone && (
                                        <p className="text-sm text-slate-600">
                                            Office: {selectedContact.companyPhone}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            {selectedContact.notes && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-slate-700">Notes</h4>
                                    <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                        {selectedContact.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </PageWrapper>
    );
}
