'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ArrowRight, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { TemplateListItemSchema } from '../schemas/template';
import { useRouter } from 'next/navigation';

interface TemplateCardProps {
  item: TemplateListItemSchema;
  slug: string;
  onUse: (template: TemplateListItemSchema) => void;
  onDelete?: (template: TemplateListItemSchema) => void;
}

export function TemplateCard({
  item,
  slug,
  onUse,
  onDelete
}: TemplateCardProps) {
  const router = useRouter();

  const handleUse = () => {
    onUse(item);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/app/${slug}/templates/${item.template.id}/edit`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(item);
    }
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const plainDescription = item.template.template.description
    ? item.template.template.description
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

  return (
    <Card
      className="group hover:shadow-xl transition-all duration-200 overflow-hidden p-0 cursor-pointer hover:scale-[1.02] flex flex-col h-full"
      onClick={handleUse}
    >
      <div className="aspect-video relative">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        <img
          src={item.template.template.image}
          alt={item.template.template.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <Badge
          className="absolute top-2 right-2"
          variant={item.isCustom ? 'secondary' : 'default'}
        >
          {item.isCustom ? 'Custom' : 'Official'}
        </Badge>
      </div>

      <CardHeader className="flex-1">
        <div className="flex justify-between items-start gap-1">
          <div className="flex-1 min-w-0">
            <CardTitle className="mt-2 line-clamp-1">
              {item.template.template.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-2 wrap-break-word">
              {plainDescription}
            </CardDescription>
          </div>
          {item.isCustom && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleDropdownClick}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4 mt-auto">
        <Badge>
          Use Template <ArrowRight />
        </Badge>
      </CardContent>
    </Card>
  );
}
