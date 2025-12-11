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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/80 backdrop-blur-xl shadow-sm'
        : 'bg-white/80 backdrop-blur-xl'
        }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between py-4 md:py-5">
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <img
              src={logo}
              alt="Luhive Logo"
              className="h-7 md:h-8 w-auto"
            />
            <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
              Luhive
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <a
              href="#about"
              className="text-sm lg:text-base font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('nav.about')}
            </a>
            <a
              href="#features"
              className="text-sm lg:text-base font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('nav.features')}
            </a>
            <Link
              to="/hub"
              className="text-sm lg:text-base font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('nav.communities')}
            </Link>
            <Link
              to="/create-community"
              className="text-sm lg:text-base font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('nav.forOrganizers')}
            </Link>
            <a
              href="#contact"
              className="text-sm lg:text-base font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('nav.contact')}
            </a>
            {user ? (
              <Link
                to="/profile"
                className="flex gap-2 items-center cursor-pointer rounded-lg transition-colors"
                onClick={() => handleCTAClick('User Hub - Header')}
              >
                <Avatar className="h-8 w-8 border-2 cursor-pointer">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
                  <AvatarFallback className="bg-gradient-avatar flex items-center justify-center">
                    {getAvatarContent()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-muted-foreground hover:text-primary text-sm hidden lg:inline">{user.full_name || 'User'}</p>
              </Link>
            ) : (
                <Button
                  size="sm"
                  className="h-11 min-w-24 px-8"
                  asChild
                >
                  <Link
                    to="/signup"
                    onClick={() => handleCTAClick('Sign Up - Header')}
                  >
                    {t('nav.signUp')}
                </Link>
              </Button>
            )}
            <LanguageSwitcher />
          </div>

          {/* Mobile Right Section */}
          <div className="md:hidden flex items-center">
            {user ? (
              <Link
                to="/profile"
                className="flex items-center"
                onClick={() => handleCTAClick('User Hub - Mobile Header')}
              >
                <Avatar className="h-8 w-8 border-2">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
                  <AvatarFallback className="bg-gradient-avatar flex items-center justify-center text-xs">
                    {getAvatarContent()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Button
                  size="sm"
                  className="h-11 bg-primary/90 px-7"
                  asChild
                >
                  <Link
                    to="/signup"
                    onClick={() => handleCTAClick('Sign Up - Mobile Header')}
                  >
                    {t('nav.signUp')}
                  </Link>
                </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
