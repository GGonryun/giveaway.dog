'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FeatureInDevelopmentDialog } from '@/components/users/feature-in-development-dialog';
import { UserCheck, UserX, Tag, Download, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export const ActionsBar: React.FC = () => {
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [featureName, setFeatureName] = useState('');

  const handleFeatureClick = (name: string) => {
    setFeatureName(name);
    setShowFeatureDialog(true);
  };
  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <UserCheck className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Mark as Trusted</span>
                <span className="sm:hidden">Trusted</span>
              </Button>
              <Button variant="destructive" size="sm">
                <UserX className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Block User</span>
                <span className="sm:hidden">Block</span>
              </Button>
              <Button variant="secondary" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Tags</span>
                <span className="sm:hidden">Tags</span>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleFeatureClick('Export Data')}
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export Data</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleFeatureClick('View in CRM')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">View in CRM</span>
                <span className="sm:hidden">CRM</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <FeatureInDevelopmentDialog
        open={showFeatureDialog}
        onClose={() => setShowFeatureDialog(false)}
        featureName={featureName}
      />
    </>
  );
};
