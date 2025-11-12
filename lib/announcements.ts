export interface AnnouncementConfig {
  id: string;
  message: string;
  link?: {
    text: string;
    href: string;
  };
  variant?: 'default' | 'info' | 'success' | 'warning';
  dismissible?: boolean;
}
