'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalActionsProps {
    status: string;
    onApprove: (comment: string) => void;
    onReject: (reason: string) => void;
    canApprove: boolean;
    isSubmitting?: boolean;
}

export function ApprovalActions({
    status,
    onApprove,
    onReject,
    canApprove,
    isSubmitting = false
}: ApprovalActionsProps) {
    const [approveComment, setApproveComment] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);

    if (status !== 'pending' || !canApprove) {
        return null;
    }

    const handleApprove = () => {
        onApprove(approveComment);
        setIsApproveOpen(false);
        setApproveComment('');
    };

    const handleReject = () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        onReject(rejectReason);
        setIsRejectOpen(false);
        setRejectReason('');
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                    <h3 className="font-semibold text-amber-900">Approval Required</h3>
                    <p className="text-sm text-amber-700">This form is awaiting your approval.</p>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Reject Dialog */}
                <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            className="flex-1 sm:flex-none gap-2 bg-red-600 hover:bg-red-700"
                            disabled={isSubmitting}
                        >
                            <XCircle className="h-4 w-4" />
                            Reject
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Request</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for rejecting this form. The submitter will be notified.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Textarea
                                placeholder="Reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleReject}>Reject Report</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Approve Dialog */}
                <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="default"
                            className="flex-1 sm:flex-none gap-2 bg-green-600 hover:bg-green-700"
                            disabled={isSubmitting}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve Request</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to approve this form? You can optionally add a comment.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Textarea
                                placeholder="Optional approval comments..."
                                value={approveComment}
                                onChange={(e) => setApproveComment(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>Confirm Approval</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
