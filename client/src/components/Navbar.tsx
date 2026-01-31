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
          <Link href="/usp-standards">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('nav.usp_standards')}
            </a>
          </Link>
          <Link href="/applications">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('nav.applications')}
            </a>
          </Link>
          <Link href="/resources">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('nav.resources')}
            </a>
          </Link>
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
