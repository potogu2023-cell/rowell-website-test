import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SCOPE = [
  "Waters 186002350",
  "Agilent 880975-902",
  "Agilent 959993-902",
  "Phenomenex 00G-4601-E0",
  "YMC TA12S03-1546WT",
] as const;

export default function AdminPdpMetadataDeployment() {
  const [completed, setCompleted] = useState(false);
  const deployment = trpc.admin.applyApprovedPdpMetadata20260914.useMutation({
    onSuccess: () => setCompleted(true),
  });

  const errorMessage = deployment.error?.message || "";
  const needsLogin = /forbidden|administrator|admin|authorized/i.test(errorMessage);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>受控PDP元数据部署</CardTitle>
          <CardDescription>
            已批准的2026-09-14 GSC精确匹配批次。此页面不会读取客户留言，也不会显示或修改任何产品事实、URL、图片、库存、价格或结构化数据。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border bg-white p-4 text-sm text-gray-700">
            <p className="font-medium">固定更新范围（共5页）</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {SCOPE.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              已排除活跃实验页 Waters 186003117 与 Tosoh 0008541。服务端将再次核对数字ID、slug、品牌、料号、名称、产品类型、状态、图片与当前元数据；任一不匹配即整体回滚。
            </p>
          </div>

          {completed ? (
            <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              已完成固定批次写入。请等待公开SSR回读验收完成；不要重复提交。
            </div>
          ) : (
            <Button
              type="button"
              disabled={deployment.isPending}
              onClick={() => deployment.mutate({ approvalId: "2026-09-14-gsc-exact-match-a2" })}
            >
              {deployment.isPending ? "正在执行受控更新…" : "执行固定五页元数据更新"}
            </Button>
          )}

          {deployment.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p>未执行更新。请核验管理员会话或联系技术人员处理前置条件。</p>
              {needsLogin && <Link href="/admin/login" className="mt-2 inline-block underline">安全管理员登录</Link>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
