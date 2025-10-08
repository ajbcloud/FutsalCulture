import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import TemplateManager from "@/components/admin/template-manager";
import SendNotification from "@/components/admin/send-notification";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MessageSquare, Mail, MessageCircle, Clock } from "lucide-react";

interface NotificationHistory {
  id: string;
  type: "email" | "sms";
  recipient: string;
  subject?: string;
  message: string;
  status: "pending" | "sent" | "failed";
  sentAt?: string;
  createdAt: string;
  errorMessage?: string;
}

export default function Communications() {
  const [activeTab, setActiveTab] = useState("templates");

  const { data: notificationHistory = [], isLoading: historyLoading } = useQuery<NotificationHistory[]>({
    queryKey: ["/api/notifications/history"],
    enabled: activeTab === "history",
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Communications</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="templates" data-testid="tab-templates">
              <Mail className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="send" data-testid="tab-send">
              <MessageCircle className="w-4 h-4 mr-2" />
              Send Message
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <TemplateManager />
          </TabsContent>

          <TabsContent value="send" className="space-y-4">
            <SendNotification />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Notification History</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject/Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificationHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                            No notification history found. Send your first message to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        notificationHistory.map((notification) => (
                          <TableRow key={notification.id} data-testid={`row-notification-${notification.id}`}>
                            <TableCell>
                              <Badge
                                variant={notification.type === "email" ? "default" : "secondary"}
                                data-testid={`badge-type-${notification.id}`}
                              >
                                {notification.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium" data-testid={`text-recipient-${notification.id}`}>
                              {notification.recipient}
                            </TableCell>
                            <TableCell className="max-w-md truncate" data-testid={`text-message-${notification.id}`}>
                              {notification.subject ? (
                                <div>
                                  <div className="font-medium">{notification.subject}</div>
                                  <div className="text-sm text-muted-foreground truncate">
                                    {notification.message}
                                  </div>
                                </div>
                              ) : (
                                <div className="truncate">{notification.message}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  notification.status === "sent"
                                    ? "default"
                                    : notification.status === "failed"
                                    ? "destructive"
                                    : "outline"
                                }
                                data-testid={`badge-status-${notification.id}`}
                              >
                                {notification.status}
                              </Badge>
                              {notification.status === "failed" && notification.errorMessage && (
                                <div className="text-xs text-destructive mt-1" data-testid={`text-error-${notification.id}`}>
                                  {notification.errorMessage}
                                </div>
                              )}
                            </TableCell>
                            <TableCell data-testid={`text-sent-at-${notification.id}`}>
                              {notification.sentAt ? (
                                <div className="text-sm">
                                  {format(new Date(notification.sentAt), "MMM d, yyyy")}
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(notification.sentAt), "h:mm a")}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
