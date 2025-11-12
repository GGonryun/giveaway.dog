'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Sparkles, Users, ArrowRight } from 'lucide-react';
import { TemplateListItemSchema } from '../schemas/template';

interface TemplateCardProps {
  template: TemplateListItemSchema;
  onUse: (template: TemplateListItemSchema) => void;
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  const handleUse = () => {
    onUse(template);
  };

  return (
    <Card
      className="group hover:shadow-xl transition-all duration-200 overflow-hidden p-0 cursor-pointer hover:scale-[1.02]"
      onClick={handleUse}
    >
      <div className="aspect-video relative">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        <img
          src={template.image}
          alt={template.name}
          className="absolute inset-0  w-full h-full object-cover"
        />
      </div>

      <CardHeader>
        <CardTitle className="mt-1 line-clamp-1">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <Badge>
          Use Template <ArrowRight />
        </Badge>
      </CardContent>
    </Card>
  );
}
