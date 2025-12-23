'use client';

import { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
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
    type Company,
    type POC,
    type CompanyType,
} from '@/lib/company-storage';
import {
    Search,
    Phone,
    Mail,
    Building2,
    Download,
    ExternalLink,
    Linkedin,
    User,
    FileText,
} from 'lucide-react';

interface ContactWithCompany extends POC {
    companyId: string;
    companyName: string;
    companyType: CompanyType;
    companyPhone?: string;
    companyEmail?: string;
    companyAddress?: string;
    companyCity?: string;
    companyState?: string;
}

type FilterType = 'all' | 'owners' | 'contractors' | 'inspectors';

const TYPE_LABELS: Record<CompanyType, string> = {
    owners: 'Owner',
    contractors: 'Contractor',
    inspectors: 'Inspector',
};

const TYPE_COLORS: Record<CompanyType, string> = {
    owners: 'bg-blue-100 text-blue-700',
    contractors: 'bg-orange-100 text-orange-700',
    inspectors: 'bg-purple-100 text-purple-700',
};

export default function ContactsPage() {
    const [contacts, setContacts] = useState<ContactWithCompany[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [selectedContact, setSelectedContact] = useState<ContactWithCompany | null>(null);
    const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = () => {
        const types: CompanyType[] = ['owners', 'contractors', 'inspectors'];
        const allContacts: ContactWithCompany[] = [];

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

    return (
        <PageWrapper title="Contacts" description="Centralized directory of all contacts">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, email, phone, company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Contacts</SelectItem>
                                <SelectItem value="owners">Owner POCs</SelectItem>
                                <SelectItem value="contractors">Contractor POCs</SelectItem>
                                <SelectItem value="inspectors">Inspector POCs</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" onClick={exportToCSV} disabled={filteredContacts.length === 0}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
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
                            <p className="text-sm text-slate-500">
                                {searchQuery || filterType !== 'all'
                                    ? 'Try adjusting your search or filter'
                                    : 'Add POCs to Owners, Contractors, or Inspectors to see them here'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredContacts.map((contact) => (
                                    <TableRow
                                        key={`${contact.companyId}-${contact.id}`}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => openContactDetails(contact)}
                                    >
                                        <TableCell className="font-medium">{contact.name}</TableCell>
                                        <TableCell className="text-slate-600">{contact.title || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-slate-400" />
                                                {contact.companyName}
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
                                                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Phone className="h-3 w-3" />
                                                    {contact.phone}
                                                </a>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {contact.email && (
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Mail className="h-3 w-3" />
                                                    {contact.email}
                                                </a>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {contact.phone && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `tel:${contact.phone}`;
                                                        }}
                                                    >
                                                        <Phone className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                {contact.email && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `mailto:${contact.email}`;
                                                        }}
                                                    >
                                                        <Mail className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <div className="mt-4 text-sm text-slate-500">
                    {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
                    {(searchQuery || filterType !== 'all') && ' found'}
                </div>
            </div>

            {/* Contact Details Panel */}
            <Sheet open={isDetailsPanelOpen} onOpenChange={setIsDetailsPanelOpen}>
                <SheetContent className="w-[400px] sm:w-[450px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {selectedContact?.name}
                        </SheetTitle>
                        <SheetDescription>
                            {selectedContact?.title && <span>{selectedContact.title} at </span>}
                            {selectedContact?.companyName}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedContact && (
                        <div className="mt-6 space-y-6">
                            {/* Type Badge */}
                            <div>
                                <Badge className={TYPE_COLORS[selectedContact.companyType]}>
                                    {TYPE_LABELS[selectedContact.companyType]} POC
                                </Badge>
                                {!selectedContact.isActive && (
                                    <Badge variant="secondary" className="ml-2">Inactive</Badge>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-slate-800">Contact Information</h4>

                                {selectedContact.phone && (
                                    <a
                                        href={`tel:${selectedContact.phone}`}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                    >
                                        <Phone className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="text-sm text-slate-500">Phone</p>
                                            <p className="font-medium">{selectedContact.phone}</p>
                                        </div>
                                    </a>
                                )}

                                {selectedContact.secondaryPhone && (
                                    <a
                                        href={`tel:${selectedContact.secondaryPhone}`}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                    >
                                        <Phone className="h-5 w-5 text-slate-500" />
                                        <div>
                                            <p className="text-sm text-slate-500">Secondary Phone</p>
                                            <p className="font-medium">{selectedContact.secondaryPhone}</p>
                                        </div>
                                    </a>
                                )}

                                {selectedContact.email && (
                                    <a
                                        href={`mailto:${selectedContact.email}`}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                    >
                                        <Mail className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm text-slate-500">Email</p>
                                            <p className="font-medium">{selectedContact.email}</p>
                                        </div>
                                    </a>
                                )}

                                {selectedContact.linkedInUrl && (
                                    <a
                                        href={selectedContact.linkedInUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                    >
                                        <Linkedin className="h-5 w-5 text-[#0077B5]" />
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-500">LinkedIn</p>
                                            <p className="font-medium truncate">{selectedContact.linkedInUrl}</p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-slate-400" />
                                    </a>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedContact.notes && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-slate-800 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Notes
                                    </h4>
                                    <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                                        {selectedContact.notes}
                                    </p>
                                </div>
                            )}

                            {/* Company Info */}
                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                <h4 className="font-medium text-slate-800 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Company
                                </h4>

                                <div className="p-4 rounded-lg bg-slate-50">
                                    <p className="font-medium text-slate-800">{selectedContact.companyName}</p>
                                    {(selectedContact.companyCity || selectedContact.companyState) && (
                                        <p className="text-sm text-slate-600">
                                            {selectedContact.companyAddress && `${selectedContact.companyAddress}, `}
                                            {selectedContact.companyCity}
                                            {selectedContact.companyCity && selectedContact.companyState && ', '}
                                            {selectedContact.companyState}
                                        </p>
                                    )}
                                    {selectedContact.companyPhone && (
                                        <p className="text-sm text-slate-600 mt-2">
                                            <Phone className="h-3 w-3 inline mr-1" />
                                            {selectedContact.companyPhone}
                                        </p>
                                    )}
                                    {selectedContact.companyEmail && (
                                        <p className="text-sm text-slate-600">
                                            <Mail className="h-3 w-3 inline mr-1" />
                                            {selectedContact.companyEmail}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </PageWrapper>
    );
}
