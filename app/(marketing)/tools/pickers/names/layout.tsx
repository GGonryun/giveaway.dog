import { environment } from '@/lib/environment';
import { Metadata } from 'next';

const appUrl = environment.appUrl();

export const metadata: Metadata = {
  title: 'Free Random Name Picker - Spin the Wheel to Pick a Winner',
  description:
    'Free random name picker with spinning wheel animation. Pick random winners fairly for giveaways, raffles, classroom activities, and team selection. No registration required.',
  keywords: [
    'random name picker',
    'name picker wheel',
    'spin the wheel',
    'random picker',
    'name generator wheel',
    'random name selector',
    'free name picker',
    'random winner picker',
    'name wheel picker',
    'fair name picker'
  ],
  openGraph: {
    title: 'Free Random Name Picker - Spin the Wheel',
    description:
      'Pick random winners with our interactive spinning wheel. Free, fair, and fun. Perfect for giveaways, classrooms, and team activities.',
    url: `${appUrl}/tools/pickers/names`,
    siteName: 'GiveawayDog',
    type: 'website',
    locale: 'en',
    images: [
      {
        url: `${appUrl}/api/og?title=Name%20Picker`,
        width: 1200,
        height: 630,
        alt: 'Random Name Picker Wheel'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Random Name Picker - Spin the Wheel',
    description:
      'Pick random winners with our interactive spinning wheel. Free and fair.',
    images: [`${appUrl}/api/og?title=Name%20Picker`]
  },
  alternates: {
    canonical: `${appUrl}/tools/pickers/names`
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
