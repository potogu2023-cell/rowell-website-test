import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Trash2, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function InquiryCart() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [formData, setFormData] = useState({
    urgency: "normal" as "normal" | "urgent" | "very_urgent",
    budgetRange: "",
    applicationNotes: "",
    deliveryAddress: "",
    customerNotes: "",
  });

  const { data: cartItems, isLoading, refetch } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const removeFromCartMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      toast.success("Item removed from cart");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove item");
    },
  });

  const updateCartMutation = trpc.cart.update.useMutation({
    onSuccess: () => {
      toast.success("Cart updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update cart");
    },
  });

  const createInquiryMutation = trpc.inquiry.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Inquiry ${data.inquiryNumber} created successfully!`);
      setLocation("/inquiry-history");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create inquiry");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, setLocation]);

  const handleQuantityChange = (cartId: number, quantity: number) => {
    if (quantity < 1) return;
    updateCartMutation.mutate({ cartId, quantity });
  };

  const handleRemove = (cartId: number) => {
    removeFromCartMutation.mutate({ cartId });
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    createInquiryMutation.mutate(formData);
  };

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

  const isEmpty = !cartItems || cartItems.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Inquiry Cart</h1>
          <p className="text-muted-foreground">
            Review your selected products and submit an inquiry
          </p>
        </div>

        {isEmpty ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Your inquiry cart is empty</h3>
              <p className="text-muted-foreground mb-6">
                Browse our products and add items to your inquiry cart
              </p>
              <Button onClick={() => setLocation("/products")}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Products ({cartItems.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.product?.productId}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.product?.brand} - {item.product?.partNumber}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Qty:</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item.id, parseInt(e.target.value))
                          }
                          className="w-20"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(item.id)}
                        disabled={removeFromCartMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Submit Inquiry Form */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Submit Inquiry</CardTitle>
                  <CardDescription>
                    Provide additional information for your inquiry
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitInquiry} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="urgency">Urgency</Label>
                      <select
                        id="urgency"
                        value={formData.urgency}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            urgency: e.target.value as any,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="normal">Normal</option>
                        <option value="urgent">Urgent</option>
                        <option value="very_urgent">Very Urgent</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budgetRange">Budget Range (Optional)</Label>
                      <Input
                        id="budgetRange"
                        placeholder="e.g., $1,000 - $5,000"
                        value={formData.budgetRange}
                        onChange={(e) =>
                          setFormData({ ...formData, budgetRange: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applicationNotes">
                        Application Notes (Optional)
                      </Label>
                      <Textarea
                        id="applicationNotes"
                        placeholder="Describe your application..."
                        value={formData.applicationNotes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            applicationNotes: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deliveryAddress">
                        Delivery Address (Optional)
                      </Label>
                      <Textarea
                        id="deliveryAddress"
                        placeholder="Enter delivery address..."
                        value={formData.deliveryAddress}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryAddress: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerNotes">
                        Additional Notes (Optional)
                      </Label>
                      <Textarea
                        id="customerNotes"
                        placeholder="Any other information..."
                        value={formData.customerNotes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerNotes: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createInquiryMutation.isPending}
                    >
                      {createInquiryMutation.isPending
                        ? "Submitting..."
                        : "Submit Inquiry"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

