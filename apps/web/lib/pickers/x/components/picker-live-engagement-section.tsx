import { Card, CardContent } from '@giveaway/ui-primitives/card';
import getTotalEngagements from '@/procedures/pickers/get-total-engagements';
import { Heart, Repeat2, MessageCircle, Quote } from 'lucide-react';

export async function PickerLiveEngagementSection() {
  const result = await getTotalEngagements();

  if (!result.ok) return null;

  const { total, likes, retweets, replies, quotes } = result.data;

  const breakdown = [
    { label: 'Likes', value: likes, icon: Heart },
    { label: 'Retweets', value: retweets, icon: Repeat2 },
    { label: 'Replies', value: replies, icon: MessageCircle },
    { label: 'Quotes', value: quotes, icon: Quote }
  ];

  return (
    <>
      <style>{`
        @keyframes border-travel {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .engagement-border-spin {
          animation: border-travel 5s linear infinite;
        }
      `}</style>

      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl p-0.5">
          <div
            className="engagement-border-spin pointer-events-none absolute inset-[-150%]"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0%, var(--success) 6%, transparent 12%)'
            }}
          />
          <Card className="relative">
            <CardContent className="py-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Live Total Engagement
                </span>
              </div>
              <p className="text-6xl font-bold tabular-nums tracking-tight">
                {total.toLocaleString('en-US')}
              </p>
              <p className="text-xs text-muted-foreground">
                total interactions tracked
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {breakdown.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="py-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium uppercase tracking-widest">
                    {label}
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {value.toLocaleString('en-US')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
