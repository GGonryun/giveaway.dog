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

export const currentAnnouncement: AnnouncementConfig | null = {
  id: 'beta-announcement',
  message:
    "🚧 We're now in beta! If you run into any problems, please reach out to us via support.",
  link: {
    text: 'Contact Support',
    href: '/support'
  },
  variant: 'info',
  dismissible: true
};
