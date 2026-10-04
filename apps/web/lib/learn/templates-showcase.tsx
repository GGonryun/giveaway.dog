'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { ArrowRight } from 'lucide-react';
import { STATIC_TEMPLATES } from '@giveaway/templates-model/data/static-templates';
import { getTemplatePlatforms } from '@giveaway/templates-model/utils/get-template-platforms';
import { TemplatePlatformIcons } from '@/lib/templates/components/template-platform-icons';

export function TemplatesShowcase() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {STATIC_TEMPLATES.map((template) => (
            <Link key={template.id} href={`/learn/templates/${template.id}`}>
              <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden p-0 cursor-pointer border border-border hover:border-primary/60">
                <div className="aspect-[16/10] relative bg-muted overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20 group-hover:from-black/10 group-hover:to-black/30 transition-all duration-300" />
                  <img
                    src={template.template.image}
                    alt={template.template.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-3 left-3">
                    <TemplatePlatformIcons
                      platforms={getTemplatePlatforms(template)}
                    />
                  </div>
                </div>

                <CardHeader className="px-4 pt-2">
                  <div className="flex justify-between items-start gap-0">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors duration-200">
                        {template.template.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm mt-1">
                        {template.template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-5 pt-">
                  <div className="flex items-center gap-2 text-sm text-primary font-semibold group-hover:gap-3 transition-all duration-200">
                    <span>View Details</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* More templates coming soon placeholder */}
      <div className="text-center py-16 px-4 border-2 border-dashed rounded-xl border-border/60 bg-muted/20">
        <h3 className="text-lg font-semibold mb-3 text-foreground">
          More Templates Coming Soon
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          We're constantly adding new templates for different use cases and
          platforms.
        </p>
      </div>
    </div>
  );
}
