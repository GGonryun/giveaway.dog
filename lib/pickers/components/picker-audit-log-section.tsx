'use client';

import React, { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, FileText } from 'lucide-react';
import {
  AuditLog,
  AUDIT_LOG_LABEL,
  AUDIT_LOG_CATEGORY,
  AUDIT_LOG_CATEGORY_ICON,
  AUDIT_LOG_CATEGORY_BADGE_VARIANT,
  AUDIT_LOG_CATEGORY_LABEL
} from '@/lib/pickers/schemas/audit-log';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PickerAuditLogSectionProps {
  logs: AuditLog[];
}

export const PickerAuditLogSection: React.FC<PickerAuditLogSectionProps> = ({
  logs
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 hover:bg-transparent"
            >
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Audit Log
                <Badge variant="secondary" className="ml-2">
                  {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                </Badge>
              </CardTitle>
              <ChevronDown
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3 mt-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No audit log entries yet
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => {
                  const label = AUDIT_LOG_LABEL[log.type];
                  const category = AUDIT_LOG_CATEGORY[log.type];

                  const CategoryIcon = AUDIT_LOG_CATEGORY_ICON[category];
                  const badgeVariant =
                    AUDIT_LOG_CATEGORY_BADGE_VARIANT[category];

                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <CategoryIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">
                                {label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                              {format(
                                new Date(log.createdAt),
                                'MMM d, yyyy HH:mm:ss'
                              )}
                            </p>
                          </div>
                          <Badge variant={badgeVariant} className="text-xs">
                            {AUDIT_LOG_CATEGORY_LABEL[category]}
                          </Badge>
                        </div>
                        {log.data && (
                          <div className="mt-2">
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View details
                              </summary>
                              <pre className="mt-2 p-2 rounded bg-muted overflow-x-auto">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
