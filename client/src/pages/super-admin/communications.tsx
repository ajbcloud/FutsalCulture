import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import FilterBar from '@/components/shared/FilterBar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  MessageSquare,
  Send,
  Clock,
  Users,
  FileText,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Copy,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Eye,
  Download,
  RefreshCw,
  Filter,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Globe,
  Building,
  UserCheck,
  Shield,
  Zap,
  TrendingUp,
  Settings,
  Search,
  ChevronDown,
  Info,
  ExternalLink,
  Smartphone,
  MousePointer,
  Target,
  Repeat,
  FileDown,
} from "lucide-react";

// Types
interface CommunicationTemplate {
  id: string;
  name: string;
  type: "email" | "sms" | "both";
  method: string;
  subject?: string;
  template: string;
  active: boolean;
  createdAt: string;
}

interface CommunicationCampaign {
  id: string;
  name: string;
  type: "email" | "sms" | "both";
  subject?: string;
  content: string;
  recipientType: string;
  recipientFilters: any;
  schedule: "immediate" | "scheduled" | "recurring";
  scheduledFor?: string;
  recurringPattern?: string;
  recurringDays?: string[];
  recurringTime?: string;
  recurringEndDate?: string;
  status: string;
  sentCount: number;
  failedCount: number;
  lastSentAt?: string;
  nextRunAt?: string;
  createdAt: string;
  metrics?: {
    sent: number;
    delivered: number;
    deliveryRate: number;
    opened: number;
    openRate: number;
    clicked: number;
    clickRate: number;
    failed: number;
    failureRate: number;
  };
}

interface Recipient {
  id: string;
  email: string;
  name: string;
  tenantId?: string;
  tenantName?: string;
  plan?: string;
  phone?: string;
}

// Deliverability types
interface DeliverabilityEmailStats {
  delivered: number;
  failed: number;
  opens: number;
  clicks: number;
}

interface DeliverablilitySmsStats {
  delivered: number;
  failed: number;
}

interface CommsTemplate {
  template_key: string;
  delivered: number;
  failed: number;
  opens: number;
  clicks: number;
}

interface CommsOverview {
  email: DeliverabilityEmailStats;
  sms: DeliverablilitySmsStats;
  templates: CommsTemplate[];
}

interface SeriesData {
  email: { d: string; delivered: number; failed: number; }[];
  sms: { d: string; delivered: number; failed: number; }[];
}

interface EventsResponse {
  rows: any[];
  page: number;
  pageSize: number;
  totalRows: number;
}

// Schemas
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.enum(["email", "sms", "both"]),
  method: z.string().min(1, "Category is required"),
  subject: z.string().optional(),
  template: z.string().min(1, "Template content is required"),
  active: z.boolean().default(true),
});

const sendMessageSchema = z.object({
  recipientType: z.string().min(1, "Recipient type is required"),
  recipientFilter: z.any().optional(),
  type: z.enum(["email", "sms", "both"]),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  templateId: z.string().optional(),
  schedule: z.enum(["immediate", "scheduled", "recurring"]),
  scheduledFor: z.date().optional(),
  recurringPattern: z.string().optional(),
  recurringDays: z.array(z.string()).optional(),
  recurringTime: z.string().optional(),
  recurringEndDate: z.date().optional(),
  testMode: z.boolean().default(false),
});

export default function SuperAdminCommunications() {
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CommunicationCampaign | null>(null);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [recipientPreviewOpen, setRecipientPreviewOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<"email" | "sms" | "both">("email");
  const [scheduleType, setScheduleType] = useState<"immediate" | "scheduled" | "recurring">("immediate");
  const [recipientType, setRecipientType] = useState("all_admins");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [templateFilter, setTemplateFilter] = useState("");
  const [historyFilter, setHistoryFilter] = useState("");
  const [exportFilters, setExportFilters] = useState({
    dateFrom: "",
    dateTo: "",
    campaignType: "all",
    status: "all",
  });
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false);
  
  // Deliverability state
  const [deliverabilityDateRange, setDeliverabilityDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  });
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'sms'>('email');
  const [eventsPage, setEventsPage] = useState(1);
  
  const { toast} = useToast();

  // Template form
  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      type: "email",
      method: "System",
      subject: "",
      template: "",
      active: true,
    },
  });

  // Send message form
  const sendForm = useForm<z.infer<typeof sendMessageSchema>>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      recipientType: "all_admins",
      type: "email",
      subject: "",
      message: "",
      schedule: "immediate",
      testMode: false,
    },
  });

  // Queries
  const { data: templatesData, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery<{
    templates: CommunicationTemplate[];
    count: number;
  }>({
    queryKey: ["/api/super-admin/communications/templates"],
  });

  const templates = templatesData?.templates || [];

  const { data: campaignsData, isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery<{
    campaigns: CommunicationCampaign[];
    total: number;
  }>({
    queryKey: ["/api/super-admin/communications/history"],
    enabled: activeTab === "history",
  });

  const campaigns = campaignsData || { campaigns: [], total: 0 };

  const { data: recipientsData, isLoading: recipientsLoading } = useQuery<{
    recipients: Recipient[];
    count: number;
  }>({
    queryKey: ["/api/super-admin/communications/recipients", recipientType],
    enabled: activeTab === "send",
  });

  const recipients = recipientsData || { recipients: [], count: 0 };

  interface CampaignAnalytics {
    metrics: {
      sent: number;
      delivered: number;
      deliveryRate: number;
      opened: number;
      openRate: number;
      clicked: number;
      clickRate: number;
      failed: number;
      failureRate: number;
    };
    rates: {
      daily: { date: string; sent: number; opened: number; clicked: number }[];
    };
    timeline: { hour: string; sent: number; opened: number }[];
  }

  const { data: campaignAnalytics, isLoading: analyticsLoading } = useQuery<CampaignAnalytics>({
    queryKey: ["/api/super-admin/communications/campaigns", selectedCampaign?.id, "analytics"],
    enabled: !!selectedCampaign && analyticsDialogOpen,
  });

  // Deliverability queries
  const { data: commsOverview, isLoading: commsOverviewLoading } = useQuery<CommsOverview>({
    queryKey: ['super-admin', 'comms', 'overview', deliverabilityDateRange],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/super-admin/comms/overview?from=${encodeURIComponent(deliverabilityDateRange.from)}&to=${encodeURIComponent(deliverabilityDateRange.to)}`);
      return await response.json();
    },
    enabled: activeTab === "deliverability",
  });

  const { data: commsSeriesData } = useQuery<SeriesData>({
    queryKey: ['super-admin', 'comms', 'series', deliverabilityDateRange],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/super-admin/comms/series?from=${encodeURIComponent(deliverabilityDateRange.from)}&to=${encodeURIComponent(deliverabilityDateRange.to)}`);
      return await response.json();
    },
    enabled: activeTab === "deliverability",
  });

  const { data: commsEventsData, isLoading: commsEventsLoading } = useQuery<EventsResponse>({
    queryKey: ['super-admin', 'comms', 'events', selectedChannel, deliverabilityDateRange, eventsPage],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/super-admin/comms/events?channel=${selectedChannel}&from=${encodeURIComponent(deliverabilityDateRange.from)}&to=${encodeURIComponent(deliverabilityDateRange.to)}&page=${eventsPage}&pageSize=25`);
      return await response.json();
    },
    enabled: activeTab === "deliverability",
  });

  // Deliverability calculated values
  const deliverabilityEmailStats = commsOverview?.email || { delivered: 0, failed: 0, opens: 0, clicks: 0 };
  const deliverabilitySmsStats = commsOverview?.sms || { delivered: 0, failed: 0 };
  const commsTemplates = commsOverview?.templates || [];

  const emailDeliveryRate = deliverabilityEmailStats.delivered + deliverabilityEmailStats.failed > 0 
    ? (deliverabilityEmailStats.delivered / (deliverabilityEmailStats.delivered + deliverabilityEmailStats.failed)) * 100 
    : 0;
  const smsDeliveryRate = deliverabilitySmsStats.delivered + deliverabilitySmsStats.failed > 0 
    ? (deliverabilitySmsStats.delivered / (deliverabilitySmsStats.delivered + deliverabilitySmsStats.failed)) * 100 
    : 0;

  const emailCTR = deliverabilityEmailStats.delivered > 0 
    ? (deliverabilityEmailStats.clicks / deliverabilityEmailStats.delivered) * 100 
    : 0;

  const emailOpenRate = deliverabilityEmailStats.delivered > 0 
    ? (deliverabilityEmailStats.opens / deliverabilityEmailStats.delivered) * 100 
    : 0;

  const chartData = selectedChannel === 'email' 
    ? (commsSeriesData?.email || []).map(item => ({
        date: new Date(item.d).toLocaleDateString(),
        delivered: item.delivered,
        failed: item.failed,
        rate: item.delivered + item.failed > 0 ? (item.delivered / (item.delivered + item.failed)) * 100 : 0,
      }))
    : (commsSeriesData?.sms || []).map(item => ({
        date: new Date(item.d).toLocaleDateString(),
        delivered: item.delivered,
        failed: item.failed,
        rate: item.delivered + item.failed > 0 ? (item.delivered / (item.delivered + item.failed)) * 100 : 0,
      }));

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof templateSchema>) => {
      const response = await apiRequest("POST", "/api/super-admin/communications/templates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      setTemplateDialogOpen(false);
      templateForm.reset();
      refetchTemplates();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof templateSchema> }) => {
      const response = await apiRequest("PATCH", `/api/super-admin/communications/templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      setTemplateDialogOpen(false);
      setSelectedTemplate(null);
      templateForm.reset();
      refetchTemplates();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/super-admin/communications/templates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      refetchTemplates();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  interface SendMessageResponse {
    testMode: boolean;
    sent: number;
  }

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/super-admin/communications/send", data);
      return response.json() as Promise<SendMessageResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.testMode
          ? `Test message sent to ${data.sent} recipients`
          : `Message sent to ${data.sent} recipients`,
      });
      sendForm.reset();
      refetchCampaigns();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const scheduleMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/super-admin/communications/schedule", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message scheduled successfully",
      });
      sendForm.reset();
      refetchCampaigns();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule message",
        variant: "destructive",
      });
    },
  });

  const cancelCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/super-admin/communications/campaigns/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign cancelled successfully",
      });
      refetchCampaigns();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel campaign",
        variant: "destructive",
      });
    },
  });

  const handleTemplateSubmit = (data: z.infer<typeof templateSchema>) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleSendMessage = (data: z.infer<typeof sendMessageSchema>) => {
    const payload = {
      ...data,
      recipientFilter: {
        plans: recipientType === "by_plan" ? selectedRecipients : undefined,
        tenantIds: recipientType === "specific_tenants" ? selectedRecipients : undefined,
      },
      scheduledFor: data.scheduledFor?.toISOString(),
      recurringEndDate: data.recurringEndDate?.toISOString(),
    };

    if (data.schedule === "immediate") {
      sendMessageMutation.mutate(payload);
    } else {
      scheduleMessageMutation.mutate(payload);
    }
  };

  const openTemplateDialog = (template?: CommunicationTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      templateForm.reset({
        name: template.name,
        type: template.type as any,
        method: template.method,
        subject: template.subject || "",
        template: template.template,
        active: template.active,
      });
    } else {
      setSelectedTemplate(null);
      templateForm.reset();
    }
    setTemplateDialogOpen(true);
  };

  const exportAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        format: "csv",
        ...(exportFilters.dateFrom && { dateFrom: exportFilters.dateFrom }),
        ...(exportFilters.dateTo && { dateTo: exportFilters.dateTo }),
        ...(exportFilters.campaignType !== "all" && { type: exportFilters.campaignType }),
        ...(exportFilters.status !== "all" && { status: exportFilters.status }),
      });
      
      const response = await fetch(`/api/super-admin/communications/export?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `communications-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setExportPopoverOpen(false);
      toast({
        title: "Success",
        description: "Report exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export analytics",
        variant: "destructive",
      });
    }
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(templateFilter.toLowerCase()) ||
      template.method.toLowerCase().includes(templateFilter.toLowerCase())
  );

  const filteredCampaigns = campaigns.campaigns?.filter(
    (campaign: CommunicationCampaign) =>
      campaign.name.toLowerCase().includes(historyFilter.toLowerCase()) ||
      campaign.type.toLowerCase().includes(historyFilter.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Platform Communications</h1>
              <p className="text-muted-foreground">
                Manage platform-wide messaging and communication templates <span className="text-green-500 font-mono text-xs ml-2">●</span>
              </p>
            </div>
          </div>
          <Popover open={exportPopoverOpen} onOpenChange={setExportPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Export Filters</h4>
                  <p className="text-sm text-muted-foreground">
                    Filter the data before exporting
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="dateFrom" className="text-sm">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={exportFilters.dateFrom}
                      onChange={(e) => setExportFilters({ ...exportFilters, dateFrom: e.target.value })}
                      className="mt-1"
                      data-testid="input-date-from"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dateTo" className="text-sm">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={exportFilters.dateTo}
                      onChange={(e) => setExportFilters({ ...exportFilters, dateTo: e.target.value })}
                      className="mt-1"
                      data-testid="input-date-to"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="campaignType" className="text-sm">Campaign Type</Label>
                    <Select
                      value={exportFilters.campaignType}
                      onValueChange={(value) => setExportFilters({ ...exportFilters, campaignType: value })}
                    >
                      <SelectTrigger id="campaignType" className="mt-1" data-testid="select-campaign-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="sms">SMS Only</SelectItem>
                        <SelectItem value="both">Email & SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status" className="text-sm">Status</Label>
                    <Select
                      value={exportFilters.status}
                      onValueChange={(value) => setExportFilters({ ...exportFilters, status: value })}
                    >
                      <SelectTrigger id="status" className="mt-1" data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button onClick={exportAnalytics} className="flex-1" data-testid="button-confirm-export">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setExportFilters({ dateFrom: "", dateTo: "", campaignType: "all", status: "all" });
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-5">
            <TabsTrigger value="templates" data-testid="tab-templates">
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="send" data-testid="tab-send">
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="deliverability" data-testid="tab-deliverability">
              <TrendingUp className="w-4 h-4 mr-2" />
              Deliverability
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                  <FileText className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{templates.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All communication templates
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {templates.filter(t => t.active).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active templates
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Email</CardTitle>
                  <Mail className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {templates.filter(t => t.type === "email" || t.type === "both").length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email templates
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SMS</CardTitle>
                  <Smartphone className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {templates.filter(t => t.type === "sms" || t.type === "both").length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    SMS templates
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Platform Templates</CardTitle>
                    <CardDescription>
                      Create and manage communication templates available across the platform
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search templates..."
                        value={templateFilter}
                        onChange={(e) => setTemplateFilter(e.target.value)}
                        className="pl-8 w-64"
                        data-testid="input-search-templates"
                      />
                    </div>
                    <Button onClick={() => openTemplateDialog()} data-testid="button-new-template">
                      <Plus className="w-4 h-4 mr-2" />
                      New Template
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="border hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => openTemplateDialog(template)}
                        data-testid={`card-template-${template.id}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge className={template.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                              {template.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={
                              template.type === "email" 
                                ? "bg-blue-100 text-blue-700"
                                : template.type === "sms"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-purple-100 text-purple-700"
                            }>
                              {template.type === "email" ? (
                                <Mail className="w-3 h-3 mr-1" />
                              ) : template.type === "sms" ? (
                                <Smartphone className="w-3 h-3 mr-1" />
                              ) : (
                                <MessageSquare className="w-3 h-3 mr-1" />
                              )}
                              {template.type}
                            </Badge>
                            <Badge variant="outline">{template.method}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {template.subject || template.template}
                          </p>
                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTemplateDialog(template);
                              }}
                              data-testid={`button-edit-template-${template.id}`}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to delete this template?")) {
                                  deleteTemplateMutation.mutate(template.id);
                                }
                              }}
                              data-testid={`button-delete-template-${template.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Send Message Tab */}
          <TabsContent value="send" className="space-y-4">
            <Form {...sendForm}>
              <form onSubmit={sendForm.handleSubmit(handleSendMessage)} className="space-y-4" data-form-version="v2">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Compose Message</CardTitle>
                      <CardDescription>
                        Create and send messages to platform users
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={sendForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setMessageType(value as any);
                                }}
                                defaultValue={field.value}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="email" id="email" />
                                  <Label htmlFor="email" className="flex items-center cursor-pointer">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="sms" id="sms" />
                                  <Label htmlFor="sms" className="flex items-center cursor-pointer">
                                    <Smartphone className="w-4 h-4 mr-2" />
                                    SMS
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="both" id="both" />
                                  <Label htmlFor="both" className="flex items-center cursor-pointer">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Both
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {(messageType === "email" || messageType === "both") && (
                        <FormField
                          control={sendForm.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter email subject" data-testid="input-subject" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={sendForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter your message..."
                                rows={8}
                                data-testid="textarea-message"
                              />
                            </FormControl>
                            <FormDescription>
                              Available variables: {"{{userName}}"}, {"{{tenantName}}"}, {"{{platformName}}"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sendForm.control}
                        name="schedule"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Schedule</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setScheduleType(value as any);
                                }}
                                defaultValue={field.value}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="immediate" id="immediate" />
                                  <Label htmlFor="immediate">Send immediately</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="scheduled" id="scheduled" />
                                  <Label htmlFor="scheduled">Schedule for later</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="recurring" id="recurring" />
                                  <Label htmlFor="recurring">Recurring</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {scheduleType === "scheduled" && (
                        <FormField
                          control={sendForm.control}
                          name="scheduledFor"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Schedule Date & Time</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date()
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {scheduleType === "recurring" && (
                        <>
                          <FormField
                            control={sendForm.control}
                            name="recurringPattern"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Recurring Pattern</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select pattern" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sendForm.control}
                            name="recurringTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Send Time</FormLabel>
                                <FormControl>
                                  <Input {...field} type="time" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      <FormField
                        control={sendForm.control}
                        name="testMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Test Mode
                              </FormLabel>
                              <FormDescription>
                                Send to first 3 recipients only for testing
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recipients</CardTitle>
                      <CardDescription>
                        Select who will receive this message
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={sendForm.control}
                        name="recipientType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Type</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setRecipientType(value);
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-recipient-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all_admins">
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2" />
                                    All Tenant Admins
                                  </div>
                                </SelectItem>
                                <SelectItem value="by_plan">
                                  <div className="flex items-center">
                                    <Target className="w-4 h-4 mr-2" />
                                    By Plan
                                  </div>
                                </SelectItem>
                                <SelectItem value="trial_tenants">
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Trial Tenants
                                  </div>
                                </SelectItem>
                                <SelectItem value="specific_tenants">
                                  <div className="flex items-center">
                                    <Building className="w-4 h-4 mr-2" />
                                    Specific Tenants
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      {recipientType === "by_plan" && (
                        <div className="space-y-2">
                          <Label>Select Plans</Label>
                          <div className="space-y-2">
                            {["Core", "Growth", "Elite"].map((plan) => (
                              <div key={plan} className="flex items-center space-x-2">
                                <Checkbox
                                  id={plan}
                                  checked={selectedRecipients.includes(plan.toLowerCase())}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRecipients([...selectedRecipients, plan.toLowerCase()]);
                                    } else {
                                      setSelectedRecipients(selectedRecipients.filter(p => p !== plan.toLowerCase()));
                                    }
                                  }}
                                />
                                <Label htmlFor={plan}>{plan} Plan</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          {recipientsLoading ? (
                            "Loading recipients..."
                          ) : (
                            <>
                              {recipients.count} recipients selected based on current filters.
                              {" "}
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto"
                                onClick={() => setRecipientPreviewOpen(true)}
                                data-testid="button-preview-recipients"
                              >
                                Preview Recipients
                              </Button>
                            </>
                          )}
                        </AlertDescription>
                      </Alert>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-2">Template Variables</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>{"{{userName}}"} - Recipient's full name</div>
                          <div>{"{{tenantName}}"} - Organization name</div>
                          <div>{"{{tenantUrl}}"} - Organization URL</div>
                          <div>{"{{platformName}}"} - Platform name</div>
                          <div>{"{{supportEmail}}"} - Support email</div>
                          <div>{"{{billingUrl}}"} - Billing portal URL</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={sendMessageMutation.isPending || scheduleMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {sendMessageMutation.isPending || scheduleMessageMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {scheduleType === "immediate" ? "Send Now" : "Schedule"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => sendForm.reset()}
                    data-testid="button-reset-form"
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Form>
      </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Message History</CardTitle>
                    <CardDescription>
                      View all sent and scheduled communications
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search campaigns..."
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                        className="pl-8 w-64"
                        data-testid="input-search-history"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => refetchCampaigns()}
                      data-testid="button-refresh-history"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Metrics</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                            No campaigns found. Send your first message to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCampaigns.map((campaign) => (
                          <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{campaign.name}</div>
                                {campaign.subject && (
                                  <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                campaign.type === "email" 
                                  ? "bg-blue-100 text-blue-700"
                                  : campaign.type === "sms"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-purple-100 text-purple-700"
                              }>
                                {campaign.type === "email" ? (
                                  <Mail className="w-3 h-3 mr-1" />
                                ) : campaign.type === "sms" ? (
                                  <Smartphone className="w-3 h-3 mr-1" />
                                ) : (
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                )}
                                {campaign.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{campaign.recipientType}</div>
                                <div className="text-muted-foreground">
                                  {campaign.sentCount + campaign.failedCount} total
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  campaign.status === "sent"
                                    ? "bg-green-100 text-green-700"
                                    : campaign.status === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : campaign.status === "scheduled"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }
                                data-testid={`badge-status-${campaign.id}`}
                              >
                                {campaign.status}
                              </Badge>
                              {campaign.schedule === "recurring" && (
                                <Badge className="ml-2 bg-purple-100 text-purple-700">
                                  <Repeat className="w-3 h-3 mr-1" />
                                  Recurring
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {campaign.metrics && (
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    {campaign.metrics.delivered}/{campaign.metrics.sent} delivered
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Eye className="w-3 h-3 text-blue-500" />
                                    {campaign.metrics.openRate}% opened
                                  </div>
                                  {campaign.metrics.clicked > 0 && (
                                    <div className="flex items-center gap-2">
                                      <MousePointer className="w-3 h-3 text-purple-500" />
                                      {campaign.metrics.clickRate}% clicked
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {campaign.lastSentAt ? (
                                <div className="text-sm">
                                  {format(new Date(campaign.lastSentAt), "MMM d, yyyy")}
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(campaign.lastSentAt), "h:mm a")}
                                  </div>
                                </div>
                              ) : campaign.scheduledFor ? (
                                <div className="text-sm">
                                  <Badge className="bg-blue-100 text-blue-700">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {format(new Date(campaign.scheduledFor), "MMM d, h:mm a")}
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedCampaign(campaign);
                                    setAnalyticsDialogOpen(true);
                                  }}
                                  data-testid={`button-analytics-${campaign.id}`}
                                >
                                  <BarChart3 className="w-3 h-3" />
                                </Button>
                                {campaign.status === "scheduled" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to cancel this campaign?")) {
                                        cancelCampaignMutation.mutate(campaign.id);
                                      }
                                    }}
                                    data-testid={`button-cancel-${campaign.id}`}
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                  <Send className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaigns.campaigns?.reduce((acc: number, c: CommunicationCampaign) => acc + c.sentCount, 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total messages sent this month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.5%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully delivered
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                  <Eye className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45.2%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average open rate
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                  <MousePointer className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12.8%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average click-through rate
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>
                  Top performing campaigns by engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.campaigns?.slice(0, 5).map((campaign: CommunicationCampaign) => (
                    <div key={campaign.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Sent {campaign.sentCount} messages
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{campaign.metrics?.openRate || 0}%</div>
                        <div className="text-sm text-muted-foreground">Open rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deliverability Tab */}
          <TabsContent value="deliverability" className="space-y-8" data-testid="content-deliverability">
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button variant="outline" size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button size="sm">
                <TestTube className="w-4 h-4 mr-2" />
                Test Delivery
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <FilterBar
                dateFrom={deliverabilityDateRange.from}
                dateTo={deliverabilityDateRange.to}
                onDateRangeChange={(from, to) => setDeliverabilityDateRange({ from, to })}
              />
            </div>

            <Tabs value={selectedChannel} onValueChange={(value) => setSelectedChannel(value as 'email' | 'sms')}>
              <div className="flex justify-center">
                <TabsList className="grid grid-cols-2 max-w-lg h-12 bg-muted">
                  <TabsTrigger value="email" data-testid="deliverability-tab-email" className="text-base font-medium">
                    <Mail className="h-5 w-5 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="sms" data-testid="deliverability-tab-sms" className="text-base font-medium">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    SMS
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="email" className="space-y-8">
                {/* Email KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  <Card data-testid="email-delivered" className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold">Delivered</CardTitle>
                      <Mail className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {deliverabilityEmailStats.delivered.toLocaleString()}
                      </div>
                      <p className="text-sm text-green-600 font-medium">
                        {emailDeliveryRate.toFixed(1)}% delivery rate
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="email-failed" className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold">Failed</CardTitle>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {deliverabilityEmailStats.failed.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Bounces, drops, spam reports
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="email-opens" className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold">Opens</CardTitle>
                      <Eye className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {deliverabilityEmailStats.opens.toLocaleString()}
                      </div>
                      <p className="text-sm text-blue-600 font-medium">
                        {emailOpenRate.toFixed(1)}% open rate
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="email-clicks">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                      <MousePointer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {deliverabilityEmailStats.clicks.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {emailCTR.toFixed(2)}% CTR
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="sms" className="space-y-6">
                {/* SMS KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card data-testid="sms-delivered">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {deliverabilitySmsStats.delivered.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {smsDeliveryRate.toFixed(1)}% delivery rate
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="sms-failed">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Failed</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {deliverabilitySmsStats.failed.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Undelivered, failed
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Time Series Chart */}
            <Card data-testid="delivery-chart">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  {selectedChannel.toUpperCase()} Delivery Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="delivered" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Delivered"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="failed" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Failed"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Success Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Template Performance (Email only) */}
            {selectedChannel === 'email' && (
              <Card data-testid="template-performance">
                <CardHeader>
                  <CardTitle>Email Template Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {commsTemplates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No template data available for selected timeframe
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead data-testid="header-template">Template Key</TableHead>
                          <TableHead data-testid="header-delivered">Delivered</TableHead>
                          <TableHead data-testid="header-failed">Failed</TableHead>
                          <TableHead data-testid="header-open-rate">Open Rate</TableHead>
                          <TableHead data-testid="header-click-rate">Click Rate</TableHead>
                          <TableHead data-testid="header-performance">Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commsTemplates.slice(0, 10).map((template) => {
                          const openRate = template.delivered > 0 ? (template.opens / template.delivered) * 100 : 0;
                          const clickRate = template.delivered > 0 ? (template.clicks / template.delivered) * 100 : 0;
                          const deliveryRate = template.delivered + template.failed > 0 
                            ? (template.delivered / (template.delivered + template.failed)) * 100 
                            : 0;
                          
                          return (
                            <TableRow key={template.template_key} data-testid={`template-${template.template_key}`}>
                              <TableCell className="font-medium">{template.template_key}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  {template.delivered.toLocaleString()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {template.failed > 0 ? (
                                  <Badge variant="destructive">
                                    {template.failed.toLocaleString()}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">0</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{openRate.toFixed(1)}%</span>
                                <div className="text-xs text-gray-500">{template.opens.toLocaleString()} opens</div>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{clickRate.toFixed(1)}%</span>
                                <div className="text-xs text-gray-500">{template.clicks.toLocaleString()} clicks</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500 transition-all duration-300"
                                      style={{ width: `${Math.min(deliveryRate, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600">{deliveryRate.toFixed(1)}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Event Explorer */}
            <Card data-testid="event-explorer">
              <CardHeader>
                <CardTitle>
                  {selectedChannel.toUpperCase()} Event Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {commsEventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : !commsEventsData || commsEventsData.rows.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No {selectedChannel} events found for selected timeframe
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Reason/Code</TableHead>
                          <TableHead>Tenant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commsEventsData.rows.map((event, index) => (
                          <TableRow key={`${event.id || index}`} data-testid={`event-row-${index}`}>
                            <TableCell className="text-sm">
                              {new Date(event.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{event.provider}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {selectedChannel === 'email' ? event.to_addr : event.to_number}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  event.event === 'delivered' ? 'default' :
                                  ['bounce', 'dropped', 'spamreport', 'undelivered', 'failed'].includes(event.event) ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {event.event}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {selectedChannel === 'email' ? event.reason : event.error_code || '—'}
                            </TableCell>
                            <TableCell>
                              {event.tenant_id || 'System'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination */}
                    {commsEventsData.totalRows > commsEventsData.pageSize && (
                      <div className="flex items-center justify-between px-2 py-4">
                        <div className="text-sm text-gray-500">
                          Showing {((commsEventsData.page - 1) * commsEventsData.pageSize) + 1} to {Math.min(commsEventsData.page * commsEventsData.pageSize, commsEventsData.totalRows)} of {commsEventsData.totalRows} events
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                            disabled={commsEventsData.page <= 1}
                            data-testid="prev-page"
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEventsPage(p => p + 1)}
                            disabled={commsEventsData.page * commsEventsData.pageSize >= commsEventsData.totalRows}
                            data-testid="next-page"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Template Dialog */}
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? "Edit Template" : "Create Template"}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate
                  ? "Update the template details below"
                  : "Create a new communication template"}
              </DialogDescription>
            </DialogHeader>
            <Form {...templateForm}>
              <form onSubmit={templateForm.handleSubmit(handleTemplateSubmit)} className="space-y-4">
                <FormField
                  control={templateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Welcome Email" data-testid="input-template-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={templateForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="System">System</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Operational">Operational</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {(templateForm.watch("type") === "email" || templateForm.watch("type") === "both") && (
                  <FormField
                    control={templateForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Email subject line" data-testid="input-template-subject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={templateForm.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Content</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter template content..."
                          rows={8}
                          data-testid="textarea-template-content"
                        />
                      </FormControl>
                      <FormDescription>
                        Available variables: {"{{userName}}"}, {"{{tenantName}}"}, {"{{platformName}}"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={templateForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable this template for use
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTemplateDialogOpen(false);
                      setSelectedTemplate(null);
                      templateForm.reset();
                    }}
                    data-testid="button-cancel-template"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    data-testid="button-save-template"
                  >
                    {createTemplateMutation.isPending || updateTemplateMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>Save Template</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Analytics Dialog */}
        <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Campaign Analytics</DialogTitle>
              <DialogDescription>
                Detailed metrics for {selectedCampaign?.name}
              </DialogDescription>
            </DialogHeader>
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : campaignAnalytics ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Delivery</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{campaignAnalytics.metrics?.delivered || 0}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {campaignAnalytics.metrics?.deliveryRate || 0}% delivery rate
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Opens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{campaignAnalytics.metrics?.opened || 0}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {campaignAnalytics.metrics?.openRate || 0}% open rate
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Clicks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{campaignAnalytics.metrics?.clicked || 0}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {campaignAnalytics.metrics?.clickRate || 0}% click rate
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Delivery Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(campaignAnalytics.timeline || {}).map(([date, metrics]: [string, any]) => (
                        <div key={date} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{date}</span>
                          <div className="flex items-center gap-4">
                            <span>{metrics.sent} sent</span>
                            <span className="text-green-600">{metrics.delivered} delivered</span>
                            <span className="text-blue-600">{metrics.opened} opened</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No analytics data available
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAnalyticsDialogOpen(false)} data-testid="button-close-analytics">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recipient Preview Dialog */}
        <Dialog open={recipientPreviewOpen} onOpenChange={setRecipientPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Recipient Preview</DialogTitle>
              <DialogDescription>
                Preview of recipients who will receive this message
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.recipients?.slice(0, 20).map((recipient: Recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell>{recipient.name}</TableCell>
                      <TableCell>{recipient.email}</TableCell>
                      <TableCell>{recipient.tenantName || "-"}</TableCell>
                      <TableCell>
                        <Badge className={
                          recipient.plan?.toLowerCase() === "core" 
                            ? "bg-blue-100 text-blue-700"
                            : recipient.plan?.toLowerCase() === "growth"
                            ? "bg-purple-100 text-purple-700"
                            : recipient.plan?.toLowerCase() === "elite"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                        }>
                          {recipient.plan || "Unknown"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {recipients.recipients?.length > 20 && (
                <div className="text-center text-sm text-muted-foreground mt-4">
                  And {recipients.recipients.length - 20} more recipients...
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRecipientPreviewOpen(false)} data-testid="button-close-recipients">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}