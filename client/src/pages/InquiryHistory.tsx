import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { FileText, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function InquiryHistory() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedInquiry, setSelectedInquiry] = useState<number | null>(null);

  const { data: inquiries, isLoading } = trpc.inquiry.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: inquiryDetails } = trpc.inquiry.getById.useQuery(
    { inquiryId: selectedInquiry! },
    { enabled: selectedInquiry !== null }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "quoted":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "very_urgent":
        return "bg-red-100 text-red-800";
      case "urgent":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Inquiry History</h1>
          <p className="text-muted-foreground">
            View and track your product inquiries
          </p>
        </div>

        {!inquiries || inquiries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No inquiries yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by adding products to your inquiry cart
              </p>
              <Button onClick={() => setLocation("/products")}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inquiry List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Inquiries</h2>
              {inquiries.map((inquiry) => (
                <Card
                  key={inquiry.id}
                  className={`cursor-pointer transition-all ${
                    selectedInquiry === inquiry.id
                      ? "ring-2 ring-primary"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedInquiry(inquiry.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {inquiry.inquiryNumber}
                        </CardTitle>
                        <CardDescription>
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(inquiry.status)}>
                          {inquiry.status}
                        </Badge>
                        <Badge className={getUrgencyColor(inquiry.urgency)}>
                          {inquiry.urgency.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{inquiry.totalItems} items</span>
                    </div>
                    {inquiry.budgetRange && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Budget: {inquiry.budgetRange}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Inquiry Details */}
            <div className="space-y-4">
              {selectedInquiry && inquiryDetails ? (
                <>
                  <h2 className="text-xl font-semibold">Inquiry Details</h2>
                  <Card>
                    <CardHeader>
                      <CardTitle>{inquiryDetails.inquiry.inquiryNumber}</CardTitle>
                      <CardDescription>
                        Created on{" "}
                        {new Date(inquiryDetails.inquiry.createdAt).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Status
                          </p>
                          <Badge className={getStatusColor(inquiryDetails.inquiry.status)}>
                            {inquiryDetails.inquiry.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Urgency
                          </p>
                          <Badge
                            className={getUrgencyColor(inquiryDetails.inquiry.urgency)}
                          >
                            {inquiryDetails.inquiry.urgency.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      {inquiryDetails.inquiry.budgetRange && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Budget Range
                          </p>
                          <p className="text-sm">{inquiryDetails.inquiry.budgetRange}</p>
                        </div>
                      )}

                      {inquiryDetails.inquiry.applicationNotes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Application Notes
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {inquiryDetails.inquiry.applicationNotes}
                          </p>
                        </div>
                      )}

                      {inquiryDetails.inquiry.deliveryAddress && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Delivery Address
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {inquiryDetails.inquiry.deliveryAddress}
                          </p>
                        </div>
                      )}

                      {inquiryDetails.inquiry.customerNotes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Additional Notes
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {inquiryDetails.inquiry.customerNotes}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-3">Products</h4>
                        <div className="space-y-3">
                          {inquiryDetails.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    {item.product?.productId}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.product?.brand} -{" "}
                                    {item.product?.partNumber}
                                  </p>
                                  {item.notes && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Note: {item.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    Qty: {item.quantity}
                                  </p>
                                  {item.quotedPrice && (
                                    <p className="text-sm text-green-600 font-medium">
                                      ${item.quotedPrice}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Select an inquiry to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

