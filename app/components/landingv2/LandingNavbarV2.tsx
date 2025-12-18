import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { LanguageSwitcher } from '../landing/LanguageSwitcher';
import { createClient } from '~/lib/supabase.client';
import logo from '/landing/LogoLuhive.svg';
import xPlatform from '/landing/xplatfrom.png';
import linkedin from '/landing/Linkedin.png';
import telegram from '/landing/Telegram.png';
import instagram from '/landing/Instagram.png';

interface UserData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const SOCIAL_LINKS = [
  {
    id: 'x',
    icon: xPlatform,
    href: 'https://twitter.com/luhive_',
    label: 'X (Twitter)',
  },
  {
    id: 'linkedin',
    icon: linkedin,
    href: 'https://www.linkedin.com/company/luhive',
    label: 'LinkedIn',
  },
  {
    id: 'telegram',
    icon: telegram,
    href: 'https://t.me/luhive',
    label: 'Telegram',
  },
  {
    id: 'instagram',
    icon: instagram,
    href: 'https://instagram.com/luhive',
    label: 'Instagram',
  },
];

export function LandingNavbarV2() {
  const { t } = useTranslation('landing');
  const [user, setUser] = useState<UserData | null>(null);
  const [, setIsLoadingUser] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'about' | 'features' | 'pricing' | 'faqs' | 'contact'>('about');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    async function checkAuth() {
      if (typeof window === 'undefined') return;

      try {
        const storedUserData = localStorage.getItem('luhive_user_data');
        if (storedUserData) {
          try {
            const parsed = JSON.parse(storedUserData);
            setUser(parsed);
            setIsLoadingUser(false);
          } catch {
            localStorage.removeItem('luhive_user_data');
          }
        }

        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            const userData: UserData = {
              id: profile.id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
            };
            setUser(userData);
            localStorage.setItem('luhive_user_data', JSON.stringify(userData));
          } else {
            setUser(null);
            localStorage.removeItem('luhive_user_data');
          }
        } else {
          setUser(null);
          localStorage.removeItem('luhive_user_data');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
        localStorage.removeItem('luhive_user_data');
      } finally {
        setIsLoadingUser(false);
      }
    }

    checkAuth();
  }, []);

  const handleCTAClick = (label: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click', {
        event_category: 'CTA',
        event_label: label,
      });
    }
  };

  const navItems: Array<{
    id: 'about' | 'features' | 'pricing' | 'faqs' | 'contact';
    href: string;
    labelKey: string;
  }> = [
    { id: 'about', href: '#about', labelKey: 'navV2.about' },
    { id: 'features', href: '#features', labelKey: 'navV2.features' },
    { id: 'pricing', href: '#pricing', labelKey: 'navV2.pricing' },
    { id: 'faqs', href: '#faqs', labelKey: 'navV2.faqs' },
    { id: 'contact', href: '#contact', labelKey: 'navV2.contact' },
  ];

  useEffect(() => {
    const sectionIds = navItems.map((item) => item.id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry && visibleEntry.target.id && sectionIds.includes(visibleEntry.target.id as any)) {
          setActiveSection(visibleEntry.target.id as typeof activeSection);
        }
      },
      {
        threshold: 0.3,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${
        scrolled ? 'bg-[#fff6e6]/95 backdrop-blur-md' : 'bg-[#fff6e6]'
      }`}
    >
      <div className="mx-auto flex h-16 w-[90vw] items-center justify-between sm:h-20">
        <Link to="/" className="flex items-center gap-4 w-[15.5vw]">
          <img src={logo} alt="Luhive Logo" className="h-8 w-auto sm:h-7" />
          <span
            className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
            style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
          >
            Luhive
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`relative flex items-center gap-2 transition-colors ${
                  isActive ? 'text-foreground' : 'hover:text-foreground'
                }`}
              >
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />}
                <span>{t(item.labelKey)}</span>
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-4 w-max">
          <div className="hidden items-center md:flex">
            <LanguageSwitcher />
          </div>
          <Button
            size="sm"
            className="hidden h-10 rounded-full bg-[#FF7A1A] px-5 text-sm font-semibold text-white shadow-sm hover:rounded-md hover:bg-[#FF7A1A] sm:inline-flex sm:h-11 sm:px-6"
            asChild
          >
            <Link
              to={user ? '/profile' : '/signup'}
              onClick={() => handleCTAClick('Try for free - Header V2')}
            >
              {t('navV2.tryForFree')}
            </Link>
          </Button>
          {/* Hamburger button for mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Sidebar */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-60 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed inset-y-0 right-0 z-70 w-full bg-[#FFFDF5] h-screen shadow-xl md:hidden">
            <div className="flex h-full flex-col bg-[#FF6D230F]">
              {/* Header with close button */}
              <div className="flex items-center justify-end p-4">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-lg font-medium transition-colors ${
                        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t(item.labelKey)}
                    </a>
                  );
                })}
              </nav>

              {/* Bottom Section: CTA, Language, Social */}
              <div className="border-t border-border p-6">
                {/* Try for free button */}
                <div className='mb-6 flex justify-around items-center'>
                <Button
                  className="flex items-center w-[65vw] rounded-full bg-[#FF7A1A] py-6 text-base font-semibold text-white shadow-sm hover:bg-[#ff8e3a]"
                  asChild
                >
                  <Link
                    to={user ? '/profile' : '/signup'}
                    onClick={() => {
                      handleCTAClick('Try for free - Mobile Menu V2');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {t('navV2.tryForFree')}
                  </Link>
                </Button>
                <LanguageSwitcher />
                </div>


                {/* Language Switcher and Social Icons */}
                <div className="flex w-full items-center justify-between">
                  <div className="flex w-full items-center justify-between gap-2">
                    {SOCIAL_LINKS.map((social) => (
                      <a
                        key={social.id}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-13 w-13 items-center justify-center rounded-xl bg-white transition-colors hover:bg-muted"
                        aria-label={social.label}
                      >
                        <img
                          src={social.icon}
                          alt={social.label}
                          className="h-13 w-13 object-contain"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}


