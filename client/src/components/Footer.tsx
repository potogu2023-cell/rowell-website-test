import { Link } from "wouter";
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  
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
              {t('footer.company_description')}
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {t('footer.copyright')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">{t('footer.quick_links')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('nav.about')}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/products">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('nav.products')}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/usp-standards">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('nav.usp_standards')}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/applications">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('nav.applications')}
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4">{t('footer.contact_us')}</h4>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">
                {t('footer.email')}: info@rowellhplc.com
              </li>
              <li className="text-sm text-muted-foreground">
                {t('footer.phone')}: +86 021 57852663
              </li>
              <li className="text-sm text-muted-foreground">
                {t('footer.location')}: Shanghai, China
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 pt-8 border-t space-y-4">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">⚠️ {t('footer.legal_disclaimer_title')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>中文：</strong>{t('footer.legal_disclaimer_cn')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>English:</strong> {t('footer.legal_disclaimer_en')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
