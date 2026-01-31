import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, Building, Package, Calendar, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminMessages() {
  const [status, setStatus] = useState<'all' | 'pending' | 'replied' | 'closed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const pageSize = 20;

  // Fetch messages
  const { data, isLoading, refetch } = trpc.messages.list.useQuery({
    status,
    page: currentPage,
    pageSize,
    search: searchTerm || undefined,
  });

  // Fetch stats
  const { data: stats } = trpc.messages.getStats.useQuery();

  // Update status mutation
  const updateStatusMutation = trpc.messages.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("状态已更新");
      refetch();
      setSelectedMessage(null);
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
    },
  });

  const handleStatusChange = (messageId: number, newStatus: 'pending' | 'replied' | 'closed') => {
    updateStatusMutation.mutate({ id: messageId, status: newStatus });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'replied':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'replied':
        return '已回复';
      case 'closed':
        return '已关闭';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  const messages = data?.messages || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">客户留言管理</h1>
          <p className="text-muted-foreground">查看和管理客户留言</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  总留言数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  待处理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  已回复
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.replied}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  已关闭
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="搜索姓名、邮箱、产品ID..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={status}
                onValueChange={(value: any) => {
                  setStatus(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="replied">已回复</SelectItem>
                  <SelectItem value="closed">已关闭</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle>留言列表 ({total} 条)</CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                暂无留言
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{message.name}</h3>
                          <p className="text-sm text-muted-foreground">{message.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(message.status)}>
                          {getStatusText(message.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    
                    {message.productId && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Package className="w-4 h-4" />
                        <span>产品: {message.productId}</span>
                      </div>
                    )}
                    
                    <p className="text-sm line-clamp-2">{message.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-muted-foreground">
                  第 {currentPage} 页，共 {totalPages} 页
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>留言详情</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">姓名</label>
                  <p className="mt-1">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">邮箱</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">
                      {selectedMessage.email}
                    </a>
                  </div>
                </div>
                {selectedMessage.company && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">公司</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <p>{selectedMessage.company}</p>
                    </div>
                  </div>
                )}
                {selectedMessage.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">电话</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedMessage.phone}`} className="text-blue-600 hover:underline">
                        {selectedMessage.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              {selectedMessage.productId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">关联产品</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <p>{selectedMessage.productId}</p>
                    {selectedMessage.productName && (
                      <span className="text-sm text-muted-foreground">- {selectedMessage.productName}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">留言内容</label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">提交时间</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p>{new Date(selectedMessage.createdAt).toLocaleString('zh-CN')}</p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">更新状态</label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedMessage.status === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(selectedMessage.id, 'pending')}
                    disabled={updateStatusMutation.isPending}
                  >
                    待处理
                  </Button>
                  <Button
                    variant={selectedMessage.status === 'replied' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(selectedMessage.id, 'replied')}
                    disabled={updateStatusMutation.isPending}
                  >
                    已回复
                  </Button>
                  <Button
                    variant={selectedMessage.status === 'closed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(selectedMessage.id, 'closed')}
                    disabled={updateStatusMutation.isPending}
                  >
                    已关闭
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
