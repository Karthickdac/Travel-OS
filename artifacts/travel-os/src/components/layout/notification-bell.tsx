import { useLocation } from "wouter";
import { Bell, Contact, Calendar, FileText, Check, CheckCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import type { Notification } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function iconForType(type: string) {
  if (type.startsWith("lead.")) return Contact;
  if (type.startsWith("booking.")) return Calendar;
  if (type.startsWith("quotation.")) return FileText;
  return Bell;
}

export function routeForType(type: string): string {
  if (type.startsWith("lead.")) return "/admin/crm/leads";
  if (type.startsWith("booking.")) return "/admin/bookings";
  if (type.startsWith("quotation.")) return "/admin/crm/quotations";
  return "/admin/notifications";
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell({ collapsed }: { collapsed?: boolean }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data } = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey(), refetchInterval: 30000 },
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications: Notification[] = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const latest = notifications.slice(0, 10);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });

  const handleItemClick = (n: Notification) => {
    if (!n.isRead) {
      markRead.mutate({ id: n.id }, { onSuccess: invalidate });
    }
    navigate(routeForType(n.type));
  };

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, { onSuccess: invalidate });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          title="Notifications"
          className={cn(
            "relative text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={handleMarkAll}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {latest.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {latest.map((n) => {
                const Icon = iconForType(n.type);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                      !n.isRead && "bg-primary/5",
                    )}
                  >
                    <div className="mt-0.5 h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-sm truncate",
                            !n.isRead ? "font-semibold" : "font-medium",
                          )}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-1 text-xs"
            onClick={() => navigate("/admin/notifications")}
          >
            <Check className="h-3.5 w-3.5" />
            View all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
