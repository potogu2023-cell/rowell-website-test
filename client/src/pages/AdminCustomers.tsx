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
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Crown, User } from "lucide-react";

export default function AdminCustomers() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [tierFilter, setTierFilter] = useState<string>("all");

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  const { data: customers, isLoading, refetch } = trpc.admin.customers.list.useQuery({
    tier: tierFilter === "all" ? undefined : tierFilter as any,
    limit: 50,
    offset: 0,
  }, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateTierMutation = trpc.admin.customers.updateTier.useMutation({
    onSuccess: () => {
      toast.success("Customer tier updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update tier");
    },
  });

  const handleUpdateTier = (userId: number, tier: string) => {
    updateTierMutation.mutate({ userId, tier: tier as any });
  };

  const getTierBadge = (tier: string) => {
    if (tier === "vip") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          <Crown className="h-3 w-3 mr-1" />
          VIP
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <User className="h-3 w-3 mr-1" />
        Regular
      </Badge>
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
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation("/admin")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer accounts and tiers
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Tier</label>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers List */}
        <Card>
          <CardHeader>
            <CardTitle>Customers ({customers?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading customers...</p>
              </div>
            ) : customers && customers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Company</th>
                      <th className="text-left p-4 font-medium">Country</th>
                      <th className="text-left p-4 font-medium">Industry</th>
                      <th className="text-left p-4 font-medium">Tier</th>
                      <th className="text-left p-4 font-medium">Registered</th>
                      <th className="text-left p-4 font-medium">Last Sign In</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{customer.name}</td>
                        <td className="p-4 text-sm">{customer.email}</td>
                        <td className="p-4">{customer.company || "-"}</td>
                        <td className="p-4">{customer.country || "-"}</td>
                        <td className="p-4">{customer.industry || "-"}</td>
                        <td className="p-4">{getTierBadge(customer.customerTier || "regular")}</td>
                        <td className="p-4 text-sm">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm">
                          {new Date(customer.lastSignedIn).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <Select
                            value={customer.customerTier || "regular"}
                            onValueChange={(value) => handleUpdateTier(customer.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No customers found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

