import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Check, X } from 'lucide-react';

const competitors = [
  {
    name: 'Giveaway.dog',
    monthlyPrice: '$0',
    yearlyTotal: '$0-$50*',
    limitations: ['No limitations'],
    isUs: true
  },
  {
    name: 'Gleam',
    monthlyPrice: '$99',
    yearlyTotal: '$1188',
    limitations: ['Entry caps', 'Limited campaigns', 'Premium features locked'],
    isUs: false
  },
  {
    name: 'Woobox',
    monthlyPrice: '$29',
    yearlyTotal: '$348',
    limitations: ['Contest limits', 'Branding restrictions', 'Basic analytics'],
    isUs: false
  },
  {
    name: 'KingSumo',
    monthlyPrice: '$59',
    yearlyTotal: '$708',
    limitations: [
      'Campaign restrictions',
      'Limited integrations',
      'Basic support'
    ],
    isUs: false
  }
];

export function CompetitorComparison() {
  return (
    <section className="mb-16 md:mb-20">
      <div className="text-center mb-8 md:mb-12">
        <Typography.Header
          level={2}
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4"
        >
          Compare With Competitors
        </Typography.Header>
        <Typography.Paragraph className="text-base md:text-lg text-muted-foreground">
          See how much you could save by switching to our pay-per-use model
        </Typography.Paragraph>
      </div>

      {/* Mobile-first card layout for very small screens */}
      <div className="block md:hidden space-y-4">
        {competitors.map((competitor) => (
          <Card
            key={competitor.name}
            className={
              competitor.isUs ? 'border-primary bg-primary/5' : 'border-muted'
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Typography.Header
                    level={4}
                    className="font-semibold text-base"
                  >
                    {competitor.name}
                  </Typography.Header>
                  {competitor.isUs && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-medium ${competitor.isUs ? 'text-green-600' : 'text-foreground'}`}
                  >
                    {competitor.monthlyPrice}/mo
                  </div>
                  <div
                    className={`text-xs ${competitor.isUs ? 'text-green-600' : 'text-red-600'} font-semibold`}
                  >
                    {competitor.yearlyTotal}/yr
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {competitor.limitations.map((limitation) => (
                  <div key={limitation} className="flex items-center gap-2">
                    {competitor.isUs ? (
                      <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-3 h-3 text-red-600 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs ${competitor.isUs ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {limitation}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table layout for medium screens and up */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] mx-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 md:p-4 font-semibold text-sm md:text-base">
                  Service
                </th>
                <th className="text-center p-3 md:p-4 font-semibold text-sm md:text-base">
                  Monthly Price
                </th>
                <th className="text-center p-3 md:p-4 font-semibold text-sm md:text-base">
                  Yearly Total
                </th>
                <th className="text-left p-3 md:p-4 font-semibold text-sm md:text-base">
                  Limitations
                </th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((competitor) => (
                <tr
                  key={competitor.name}
                  className={`border-b ${competitor.isUs ? 'bg-primary/5' : ''}`}
                >
                  <td className="p-3 md:p-4">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm md:text-base">
                        {competitor.name}
                      </strong>
                      {competitor.isUs && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="text-center p-3 md:p-4">
                    <span
                      className={`font-semibold text-sm md:text-base ${competitor.isUs ? 'text-green-600' : 'text-foreground'}`}
                    >
                      {competitor.monthlyPrice}
                    </span>
                  </td>
                  <td className="text-center p-3 md:p-4">
                    <span
                      className={`font-semibold text-sm md:text-base ${competitor.isUs ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {competitor.yearlyTotal}
                    </span>
                  </td>
                  <td className="p-3 md:p-4">
                    <div className="space-y-1">
                      {competitor.limitations.map((limitation) => (
                        <div
                          key={limitation}
                          className={`flex items-center gap-2 ${competitor.isUs ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {competitor.isUs ? (
                            <Check className="w-3 h-3 flex-shrink-0" />
                          ) : (
                            <X className="w-3 h-3 flex-shrink-0" />
                          )}
                          <span className="text-xs">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 md:mt-8 text-center">
        <Typography.Paragraph className="text-xs md:text-sm text-muted-foreground">
          * Based on 10 free giveaways per year. Additional packages available.
          <br />
          Most users never exceed their free allocation.
        </Typography.Paragraph>
      </div>
    </section>
  );
}
