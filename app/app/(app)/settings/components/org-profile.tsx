'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Building2,
  Upload,
  ExternalLink,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

// Mock data
const mockOrgData = {
  name: 'Giveaway.dog',
  slug: 'giveaway-dog',
  description: 'The ultimate platform for running engaging giveaways and contests',
  logo: null,
  brandColor: '#3b82f6',
  timezone: 'America/New_York',
  locale: 'en-US',
  publicUrl: 'https://giveaway.dog'
};

const timezones = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const locales = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' }
];

export function OrgProfile() {
  const [formData, setFormData] = useState(mockOrgData);
  const [isLoading, setIsLoading] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'available' | 'taken' | 'checking' | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    console.log('Saved org profile:', formData);
  };

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
    setFormData(prev => ({ ...prev, slug }));
    
    // Mock slug validation
    if (slug && slug !== mockOrgData.slug) {
      setSlugStatus('checking');
      setTimeout(() => {
        setSlugStatus(Math.random() > 0.5 ? 'available' : 'taken');
      }, 500);
    } else {
      setSlugStatus(null);
    }
  };

  const getSlugValidation = () => {
    switch (slugStatus) {
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      case 'available':
        return (
          <Badge variant="default" className="bg-green-500">
            <Check className="h-3 w-3 mr-1" />
            Available
          </Badge>
        );
      case 'taken':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Taken
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organization Profile</h1>
          <p className="text-muted-foreground">
            Manage your organization details and public branding
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
            <CardDescription>
              Core details about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Organization Logo</Label>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={formData.logo || undefined} />
                  <AvatarFallback className="text-lg">
                    {formData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 2MB. Recommended: 200x200px
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your organization name"
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="space-y-2">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="your-organization"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formData.publicUrl}/{formData.slug}
                    </p>
                    {getSlugValidation()}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your organization..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This will be shown on your public giveaway pages
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Branding & Localization */}
        <Card>
          <CardHeader>
            <CardTitle>Branding & Localization</CardTitle>
            <CardDescription>
              Customize appearance and regional settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Brand Color */}
              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand Color</Label>
                <div className="flex space-x-2">
                  <div 
                    className="w-10 h-10 rounded border border-border"
                    style={{ backgroundColor: formData.brandColor }}
                  />
                  <Input
                    id="brandColor"
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, brandColor: e.target.value }))}
                    className="w-20"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label>Default Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Locale */}
              <div className="space-y-2">
                <Label>Default Locale</Label>
                <Select
                  value={formData.locale}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, locale: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map(locale => (
                      <SelectItem key={locale.value} value={locale.value}>
                        {locale.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}