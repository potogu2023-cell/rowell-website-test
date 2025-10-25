import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Eye, FileDown } from "lucide-react";

export default function AdminInquiries() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<number | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  const { data: inquiries, isLoading, refetch } = trpc.admin.inquiries.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
    urgency: urgencyFilter === "all" ? undefined : urgencyFilter as any,
    limit: 50,
    offset: 0,
  }, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: inquiryDetails } = trpc.admin.inquiries.getById.useQuery(
    { inquiryId: selectedInquiry! },
    { enabled: selectedInquiry !== null }
  );

  const updateStatusMutation = trpc.admin.inquiries.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Inquiry status updated successfully");
      refetch();
      setShowDetailsDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const addNotesMutation = trpc.admin.inquiries.addNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes added successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add notes");
    },
  });

  const addQuoteMutation = trpc.admin.inquiries.addQuote.useMutation({
    onSuccess: () => {
      toast.success("Quote added successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add quote");
    },
  });

  const generatePDFMutation = trpc.admin.inquiries.generatePDF.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate PDF");
    },
  });

  const handleViewDetails = (inquiryId: number) => {
    setSelectedInquiry(inquiryId);
    setShowDetailsDialog(true);
  };

  const handleUpdateStatus = (inquiryId: number, status: string) => {
    updateStatusMutation.mutate({ inquiryId, status: status as any });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "default",
      quoted: "secondary",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      normal: "bg-blue-100 text-blue-800",
      urgent: "bg-orange-100 text-orange-800",
      very_urgent: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[urgency] || colors.normal}`}>
        {urgency.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  if (loading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setLocation("/admin")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Inquiry Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage customer inquiries
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Urgencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgencies</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="very_urgent">Very Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inquiries List */}
        <Card>
          <CardHeader>
            <CardTitle>Inquiries ({inquiries?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading inquiries...</p>
              </div>
            ) : inquiries && inquiries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Inquiry #</th>
                      <th className="text-left p-4 font-medium">Customer</th>
                      <th className="text-left p-4 font-medium">Company</th>
                      <th className="text-left p-4 font-medium">Items</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Urgency</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono text-sm">{inquiry.inquiryNumber}</td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{inquiry.userName}</div>
                            <div className="text-sm text-muted-foreground">{inquiry.userEmail}</div>
                          </div>
                        </td>
                        <td className="p-4">{inquiry.userCompany || "-"}</td>
                        <td className="p-4">{inquiry.totalItems}</td>
                        <td className="p-4">{getStatusBadge(inquiry.status)}</td>
                        <td className="p-4">{getUrgencyBadge(inquiry.urgency)}</td>
                        <td className="p-4 text-sm">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(inquiry.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No inquiries found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inquiry Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Inquiry Details</DialogTitle>
              <DialogDescription>
                {inquiryDetails?.inquiry.inquiryNumber}
              </DialogDescription>
            </DialogHeader>

            {inquiryDetails && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      <span className="font-medium">{inquiryDetails.user?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="font-medium">{inquiryDetails.user?.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Company:</span>{" "}
                      <span className="font-medium">{inquiryDetails.user?.company || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <span className="font-medium">{inquiryDetails.user?.phone || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h3 className="font-semibold mb-3">Products</h3>
                  <div className="space-y-3">
                    {inquiryDetails.items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{item.product?.productId}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.product?.brand} - {item.product?.name}
                            </div>
                            <div className="text-sm mt-1">Quantity: {item.quantity}</div>
                            {item.notes && (
                              <div className="text-sm mt-1 text-muted-foreground">
                                Notes: {item.notes}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            {item.quotedPrice ? (
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Quoted Price</div>
                                <div className="font-semibold text-green-600">{item.quotedPrice}</div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const price = prompt("Enter quoted price:");
                                  if (price) {
                                    addQuoteMutation.mutate({
                                      inquiryItemId: item.id,
                                      quotedPrice: price,
                                    });
                                  }
                                }}
                              >
                                Add Quote
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <h3 className="font-semibold mb-3">Update Status</h3>
                  <Select
                    value={inquiryDetails.inquiry.status}
                    onValueChange={(value) => handleUpdateStatus(inquiryDetails.inquiry.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Download PDF */}
                <div>
                  <Button
                    onClick={() => {
                      if (selectedInquiry) {
                        generatePDFMutation.mutate({ inquiryId: selectedInquiry });
                      }
                    }}
                    disabled={generatePDFMutation.isPending}
                    className="w-full"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {generatePDFMutation.isPending ? "Generating..." : "Download PDF Quotation"}
                  </Button>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="font-semibold mb-3">Admin Notes</h3>
                  <Textarea
                    defaultValue={inquiryDetails.inquiry.adminNotes || ""}
                    placeholder="Add internal notes..."
                    rows={4}
                    onBlur={(e) => {
                      if (e.target.value !== inquiryDetails.inquiry.adminNotes) {
                        addNotesMutation.mutate({
                          inquiryId: inquiryDetails.inquiry.id,
                          notes: e.target.value,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

