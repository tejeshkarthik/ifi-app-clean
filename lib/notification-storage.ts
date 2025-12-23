import { getEmployees } from './employee-storage';

export interface Notification {
    id: string;
    userId: string;
    type: 'approval' | 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
    metadata?: Record<string, any>;
}

const STORAGE_KEY = 'ifi_notifications_v1';

// Get all notifications
export function getNotifications(userId?: string): Notification[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const notifications: Notification[] = JSON.parse(stored);

    if (userId) {
        return notifications.filter(n => n.userId === userId).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return notifications.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

// Add a notification
export function addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const notifications = getNotifications();

    const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        isRead: false,
        createdAt: new Date().toISOString(),
    };

    notifications.push(newNotification);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));

    // Dispatch event for real-time UI updates
    window.dispatchEvent(new Event('ifi-notifications-updated'));

    return newNotification;
}

// Mark as read
export function markAsRead(id: string): void {
    const notifications = getNotifications();
    const index = notifications.findIndex(n => n.id === id);

    if (index !== -1) {
        notifications[index].isRead = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        window.dispatchEvent(new Event('ifi-notifications-updated'));
    }
}

// Mark all as read for user
export function markAllAsRead(userId: string): void {
    const notifications = getNotifications();
    let changed = false;

    notifications.forEach(n => {
        if (n.userId === userId && !n.isRead) {
            n.isRead = true;
            changed = true;
        }
    });

    if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        window.dispatchEvent(new Event('ifi-notifications-updated'));
    }
}

// Get unread count
export function getUnreadCount(userId: string): number {
    return getNotifications(userId).filter(n => !n.isRead).length;
}

// Delete notification
export function deleteNotification(id: string): void {
    const notifications = getNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('ifi-notifications-updated'));
}

// Helper to notify approvers based on workflow level
export function notifyApprovers(
    approverIds: string[],
    title: string,
    message: string,
    link: string
) {
    if (!approverIds || approverIds.length === 0) return;

    // If we have direct user IDs
    approverIds.forEach(userId => {
        // Check if it's a role or specific user logic if needed, 
        // but typically the workflow logic should resolve to user IDs or roles.
        // For simplicity, we'll try to match exact user IDs first.

        // If the ID matches a role, find all users with that role
        // For now, let's assume the caller resolves roles to user IDs properly, 
        // OR we can do a quick check here.
        if (['admin', 'super-admin', 'pm', 'supervisor', 'lead', 'worker'].includes(userId)) {
            const employees = getEmployees();
            const usersWithRole = employees.filter(e => e.appRole === userId || e.role.toLowerCase() === userId.toLowerCase());
            usersWithRole.forEach(user => {
                addNotification({
                    userId: user.id || user.email, // Prefer ID but email/login might be used as key
                    type: 'approval',
                    title,
                    message,
                    link
                });
            });
        } else {
            // Direct user ID
            addNotification({
                userId,
                type: 'approval',
                title,
                message,
                link
            });
        }
    });
}
