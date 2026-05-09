import { Link } from "wouter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center space-x-3">
            <img 
              src="/rowell-logo.png" 
              alt="ROWELL" 
              className="h-10 w-auto"
            />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              HPLC Solutions
            </span>
          </a>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <LanguageSwitcher />
          <Link href="/">
            <a className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t('nav.home')}
            </a>
          </Link>
          <Link href="/about">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('nav.about')}
            </a>
          </Link>
          <Link href="/products">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('nav.products')}
            </a>
          </Link>
          <Link href="/standards">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('standards.nav_label')}
            </a>
          </Link>
          <Link href="/usp-standards">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('nav.usp_standards')}
            </a>
          </Link>
          <Link href="/learning">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Learning Center
            </a>
          </Link>
          <a 
            href="https://catalog.rowellhplc.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            {t('nav.catalog', 'Product Catalog')}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          <Link href="/contact">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('nav.contact')}
            </a>
          </Link>
        </div>
      </nav>
    </header>
  );
}
