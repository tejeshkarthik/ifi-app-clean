interface PageWrapperProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageWrapper({ title, description, children }: PageWrapperProps) {
    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    {/* Spacer for mobile menu button */}
                    <div className="lg:hidden w-10" />
                    <div>
                        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
                        {description && (
                            <p className="text-sm text-slate-500">{description}</p>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-full">
                    {children || (
                        <div className="flex items-center justify-center h-64 text-slate-400">
                            <div className="text-center">
                                <p className="text-lg font-medium">Coming Soon</p>
                                <p className="text-sm">This page is under development</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
