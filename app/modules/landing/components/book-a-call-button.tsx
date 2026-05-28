import { Avatar, AvatarFallback, AvatarImage } from '~/shared/components/ui/avatar';
import { AnalyticsEvents } from '~/shared/lib/analytics';
import { LUHIVE_CREATE_COMMUNITY_BOOKING_URL } from '~/shared/lib/utils/url';

import styles from './book-a-call-button.module.css';

interface BookACallButtonProps {
  size?: 'sm' | 'md';
  analyticsSource?: string;
}

export function BookACallButton({
  size = 'md',
  analyticsSource = 'About V2',
}: BookACallButtonProps) {
  const isSmall = size === 'sm';

  return (
    <a
      href={LUHIVE_CREATE_COMMUNITY_BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.btn}
      style={isSmall ? { padding: '4px 20px 4px 4px', fontSize: '0.875rem', gap: '8px' } : undefined}
      onClick={() => AnalyticsEvents.bookDemoClick(analyticsSource)}
    >
      <span className={styles.teaser}>Let's go!</span>
      <Avatar className={`ring-2 ring-white/80 ${styles.avatar} ${isSmall ? 'size-8' : 'size-10'}`}>
        <AvatarImage src="/landing/ali-founder.png" alt="" />
        <AvatarFallback delayMs={600} />
      </Avatar>
      <span className={styles.label}>Book a Call</span>
    </a>
  );
}
