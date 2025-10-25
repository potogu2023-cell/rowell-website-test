import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-primary mb-4">ROWELL</h3>
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
        <div className="mt-8 pt-8 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Important Legal Disclaimer:</strong> This website is provided for educational and reference purposes only. All brand names, product names, and trademarks mentioned are the property of their respective owners. We are not affiliated with, endorsed by, or sponsored by any of the original manufacturers. We are an independent distributor and reseller.
          </p>
        </div>
      </div>
    </footer>
  );
}

