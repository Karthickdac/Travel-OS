import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import type { Notification } from "@workspace/api-client-react";
import { Bell, Contact, Calendar, FileText, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeTime, routeForType } from "@/components/layout/notification-bell";

function iconForType(type: string) {
  if (type.startsWith("lead.")) return Contact;
  if (type.startsWith("booking.")) return Calendar;
  if (type.startsWith("quotation.")) return FileText;
  return Bell;
}

type Filter = "all" | "unread";

export default function AdminNotifications() {
  const [filter, setFilter] = useState<Filter>("all");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey(), refetchInterval: 30000 },
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications: Notification[] = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const visible =
    filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });

  const handleClick = (n: Notification) => {
    if (!n.isRead) {
      markRead.mutate({ id: n.id }, { onSuccess: invalidate });
    }
    navigate(routeForType(n.type));
  };

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, { onSuccess: invalidate });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Activity from leads, bookings and quotations.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button className="gap-2" variant="outline" onClick={handleMarkAll} disabled={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => {
            const Icon = iconForType(n.type);
            return (
              <Card
                key={n.id}
                className={cn(
                  "shadow-sm cursor-pointer hover:bg-muted/40 transition-colors",
                  !n.isRead && "border-primary/40 bg-primary/5",
                )}
                onClick={() => handleClick(n)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          !n.isRead ? "font-semibold" : "font-medium",
                        )}
                      >
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
