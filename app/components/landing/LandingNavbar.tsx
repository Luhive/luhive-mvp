import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { createClient } from '~/lib/supabase.client';
import logo from '/landing/LogoLuhive.svg';

interface UserData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export function LandingNavbar() {
  const { t } = useTranslation('landing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    async function checkAuth() {
      if (typeof window === 'undefined') return;

      try {
        // First, check localStorage for quick display
        const storedUserData = localStorage.getItem('luhive_user_data');
        if (storedUserData) {
          try {
            const parsed = JSON.parse(storedUserData);
            setUser(parsed);
            setIsLoadingUser(false);
          } catch (e) {
            // Invalid data in localStorage, clear it
            localStorage.removeItem('luhive_user_data');
          }
        }

        // Then verify with Supabase
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          // Fetch user profile
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
            // Store in localStorage
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

  const getAvatarContent = () => {
    // If user has avatar, show it, otherwise show initials
    if (user?.avatar_url) {
      return null; // Avatar image will be shown
    }

    if (user?.full_name) {
      const initials = user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return initials;
    }

    return '';
  };


  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-1001 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-sm'
            : 'bg-white/80 backdrop-blur-xl'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-5">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={logo}
                alt="Luhive Logo"
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
                Luhive
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#about"
                className="text-[15px] font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.about')}
              </a>
              <a
                href="#features"
                className="text-[15px] font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.features')}
              </a>
              <Link
                to="/hub"
                className="text-[15px] font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.communities')}
              </Link>
              <Link
                to="/create-community"
                className="text-[15px] font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.forOrganizers')}
              </Link>
              <a
                href="#contact"
                className="text-[15px] font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.contact')}
              </a>
              <Button
                size="sm"
                className="h-11 min-w-[120px] px-6"
                asChild
              >
                <Link
                className='bg-transparent hover:bg-transparent'
                  to={user ? '/hub' : '/signup'}
                  onClick={() => handleCTAClick(user ? 'User Hub - Header' : 'Sign Up - Header')}
                >
                  {user ? (
                    <div className="flex gap-2 items-center cursor-pointer  p-2 rounded-lg">
                      <Avatar className="h-8 w-8 border-2 cursor-pointer">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
                        <AvatarFallback className="bg-gradient-avatar flex items-center justify-center">
                          {getAvatarContent()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-muted-foreground hover:text-primary text-sm hidden sm:inline">{user.full_name || 'User'}</p>
                    </div>
                  ) : (
                    t('nav.signUp')
                  )}
                </Link>
              </Button>
              <LanguageSwitcher />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex flex-col justify-around w-7 h-7 bg-transparent border-none cursor-pointer p-0 z-1002 relative"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span
                className={`w-full h-0.5 bg-foreground rounded transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`w-full h-0.5 bg-foreground rounded transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0 -translate-x-2.5' : ''
                }`}
              />
              <span
                className={`w-full h-0.5 bg-foreground rounded transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-lg z-999 transition-opacity duration-400 ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 w-full h-screen bg-white z-1000 p-[100px_32px_40px] flex flex-col justify-center items-center overflow-y-auto transition-opacity duration-400 ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="flex flex-col gap-3 w-full max-w-[400px] text-center">
          <a
            href="#about"
            className="text-foreground no-underline font-semibold text-2xl py-5 px-6 rounded-2xl transition-all hover:bg-secondary hover:text-primary hover:-translate-y-0.5 hover:scale-[1.02]"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.about')}
          </a>
          <a
            href="#features"
            className="text-foreground no-underline font-semibold text-2xl py-5 px-6 rounded-2xl transition-all hover:bg-secondary hover:text-primary hover:-translate-y-0.5 hover:scale-[1.02]"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.features')}
          </a>
          <Link
            to="/hub"
            className="text-foreground no-underline font-semibold text-2xl py-5 px-6 rounded-2xl transition-all hover:bg-secondary hover:text-primary hover:-translate-y-0.5 hover:scale-[1.02]"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.communities')}
          </Link>
          <Link
            to="/create-community"
            className="text-foreground no-underline font-semibold text-2xl py-5 px-6 rounded-2xl transition-all hover:bg-secondary hover:text-primary hover:-translate-y-0.5 hover:scale-[1.02]"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.forOrganizers')}
          </Link>
          <a
            href="#contact"
            className="text-foreground no-underline font-semibold text-2xl py-5 px-6 rounded-2xl transition-all hover:bg-secondary hover:text-primary hover:-translate-y-0.5 hover:scale-[1.02]"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.contact')}
          </a>
        </div>

        <div className="mt-10 w-full max-w-[400px] text-center">
          <Button
            className="w-full h-[52px] mb-4"
            asChild
          >
            <Link
              to={user ? '/hub' : '/signup'}
              onClick={() => {
                handleCTAClick(user ? 'User Hub - Mobile' : 'Sign Up - Mobile');
                setIsMenuOpen(false);
              }}
            >
              {user ? (
                <div className="flex gap-2 items-center cursor-pointer hover:bg-muted/50 p-2 rounded-lg justify-center">
                  <Avatar className="h-8 w-8 border-2 cursor-pointer">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
                    <AvatarFallback className="bg-gradient-avatar flex items-center justify-center">
                      {getAvatarContent()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-foreground/50 text-sm">{user.full_name || 'User'}</p>
                </div>
              ) : (
                t('nav.signUp')
              )}
            </Link>
          </Button>
        </div>

        <div className="mt-8 w-full max-w-[400px] text-center">
          <LanguageSwitcher />
        </div>
      </div>
    </>
  );
}
