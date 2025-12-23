'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, ChevronDown, Search, Check } from 'lucide-react';

export interface MultiSelectOption {
    id: string;
    label: string;
    subtitle?: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    maxHeight?: number;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = 'Select...',
    disabled = false,
    maxHeight = 200,
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    // Handle mounting for portal
    useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate position - use getBoundingClientRect for viewport-relative positioning
    const updatePosition = useCallback(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = Math.min(maxHeight + 100, 300); // Approximate dropdown height

        // Check if there's enough space below
        const spaceBelow = viewportHeight - rect.bottom;
        const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

        setDropdownStyle({
            position: 'fixed',
            top: showAbove ? 'auto' : rect.bottom + 4,
            bottom: showAbove ? viewportHeight - rect.top + 4 : 'auto',
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
        });
    }, [maxHeight]);

    // Update position when opened
    useEffect(() => {
        if (isOpen) {
            updatePosition();
        }
    }, [isOpen, updatePosition]);

    // Handle scroll/resize to update position or close
    useEffect(() => {
        if (!isOpen) return;

        const handleScrollOrResize = () => {
            updatePosition();
        };

        // Listen to scroll on all parent elements
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen, updatePosition]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current &&
                !containerRef.current.contains(target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
                setSearch('');
            }
        };

        // Use a slight delay to prevent immediate close on open click
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.subtitle?.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOptions = options.filter(opt => selected.includes(opt.id));

    const toggleOption = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter(s => s !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    const removeOption = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter(s => s !== id));
    };

    const handleTriggerClick = () => {
        if (disabled) return;
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(!isOpen);
        if (isOpen) {
            setSearch('');
        }
    };

    const dropdown = (
        <div
            ref={dropdownRef}
            className="bg-white border border-slate-200 rounded-lg shadow-xl"
            style={dropdownStyle}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Search */}
            <div className="p-2 border-b border-slate-100">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="pl-8 h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                    />
                </div>
            </div>

            {/* Options */}
            <div className="overflow-y-auto" style={{ maxHeight }}>
                {filteredOptions.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">
                        {options.length === 0 ? 'No options available' : 'No options found'}
                    </div>
                ) : (
                    filteredOptions.map(opt => {
                        const isSelected = selected.includes(opt.id);
                        return (
                            <div
                                key={opt.id}
                                onClick={() => toggleOption(opt.id)}
                                className={`
                                    px-3 py-2 cursor-pointer flex items-center gap-2
                                    ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}
                                `}
                            >
                                <div className={`
                                    w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                    ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}
                                `}>
                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{opt.label}</div>
                                    {opt.subtitle && (
                                        <div className="text-xs text-slate-500 truncate">{opt.subtitle}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            {selected.length > 0 && (
                <div className="p-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{selected.length} selected</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange([])}
                        className="h-6 text-xs text-slate-500"
                    >
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <div
                onClick={handleTriggerClick}
                className={`
                    min-h-[40px] px-3 py-2 border rounded-lg bg-white cursor-pointer
                    flex items-center gap-2 flex-wrap
                    ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : 'hover:border-slate-400'}
                    ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-300'}
                `}
            >
                {selectedOptions.length === 0 ? (
                    <span className="text-slate-400 text-sm">{placeholder}</span>
                ) : (
                    selectedOptions.map(opt => (
                        <Badge
                            key={opt.id}
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 gap-1 pr-1"
                        >
                            {opt.label}
                            {!disabled && (
                                <button
                                    onClick={(e) => removeOption(opt.id, e)}
                                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))
                )}
                <ChevronDown className={`h-4 w-4 text-slate-400 ml-auto flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Portal Dropdown - uses fixed positioning relative to viewport */}
            {isOpen && mounted && createPortal(dropdown, document.body)}
        </div>
    );
}
