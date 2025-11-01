import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/rowell-logo.png" 
                alt="ROWELL" 
                className="h-12 w-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              ROWELL is dedicated to providing high-quality HPLC columns and consumables to customers worldwide, with competitive pricing and professional technical support.
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Shanghai Luweimei E-commerce Co., Ltd. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    About Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/products">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Products
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/usp-standards">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    USP Standards
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/applications">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Applications
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">
                Email: info@rowellhplc.com
              </li>
              <li className="text-sm text-muted-foreground">
                Phone: +86 021 57852663
              </li>
              <li className="text-sm text-muted-foreground">
                Location: Shanghai, China
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 pt-8 border-t space-y-4">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">⚠️ 重要法律声明 / Important Legal Disclaimer</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>中文：</strong>本网站及上海洛维美电子商务有限公司（ROWELL）<strong>并非任何品牌的授权经销商或官方代理商</strong>。本网站所列产品均为独立采购的正品，仅供参考和教育用途。所有品牌名称、产品名称和商标均为其各自所有者的财产。我们与原始制造商之间不存在任何隶属、认可或赞助关系。产品的真实性、质量和售后服务由我们独立负责。购买前请确认您了解并接受此声明。
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>English:</strong> This website and Shanghai Luweimei E-commerce Co., Ltd. (ROWELL) <strong>are NOT authorized distributors or official agents of any brands</strong> mentioned herein. All products listed are independently sourced genuine items provided for reference and educational purposes only. All brand names, product names, and trademarks are the property of their respective owners. We are not affiliated with, endorsed by, or sponsored by any original manufacturers. We independently guarantee product authenticity, quality, and after-sales service. Please confirm that you understand and accept this disclaimer before making any purchase.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

