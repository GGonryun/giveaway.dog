'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Shield,
  Clock,
  Users,
  Globe,
  Plus,
  Trash2,
  Save,
  RotateCcw
} from 'lucide-react';
import { useState } from 'react';

interface Rule {
  id: string;
  type: 'rate_limit' | 'geo_block' | 'email_domain' | 'ip_block';
  name: string;
  value: string;
  enabled: boolean;
}

export const SweepstakesRulesEditor = () => {
  const [rules, setRules] = useState<Rule[]>([
    {
      id: '1',
      type: 'rate_limit',
      name: 'Entries per IP per hour',
      value: '5',
      enabled: true
    },
    {
      id: '2',
      type: 'email_domain',
      name: 'Block disposable emails',
      value: 'tempmail.com,10minutemail.com',
      enabled: true
    },
    {
      id: '3',
      type: 'geo_block',
      name: 'Geographic restrictions',
      value: 'CN,RU,KP',
      enabled: false
    }
  ]);

  const [globalSettings, setGlobalSettings] = useState({
    enableBotDetection: true,
    requireEmailVerification: true,
    enableGeoTracking: true,
    maxEntriesPerUser: 10,
    entryTimeWindow: 24, // hours
    suspiciousActivityThreshold: 80
  });

  const [customBlocklist, setCustomBlocklist] = useState(
    'spam@example.com\nbadactor@fake.com'
  );

  const addRule = () => {
    const newRule: Rule = {
      id: Date.now().toString(),
      type: 'rate_limit',
      name: 'New Rule',
      value: '',
      enabled: true
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<Rule>) => {
    setRules(
      rules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule))
    );
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const getRuleTypeLabel = (type: Rule['type']) => {
    const labels = {
      rate_limit: 'Rate Limiting',
      geo_block: 'Geographic',
      email_domain: 'Email Domain',
      ip_block: 'IP Blocking'
    };
    return labels[type];
  };

  const getRuleIcon = (type: Rule['type']) => {
    const icons = {
      rate_limit: <Clock className="h-4 w-4" />,
      geo_block: <Globe className="h-4 w-4" />,
      email_domain: <Users className="h-4 w-4" />,
      ip_block: <Shield className="h-4 w-4" />
    };
    return icons[type];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Rules & Settings</span>
        </CardTitle>
        <CardDescription>
          Configure fraud detection and entry validation rules
        </CardDescription>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <div className="space-y-6">
          {/* Global Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Global Protection Settings</span>
            </h3>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Bot Detection</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically flag suspicious behavior patterns
                  </p>
                </div>
                <Switch
                  checked={globalSettings.enableBotDetection}
                  onCheckedChange={(checked) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      enableBotDetection: checked
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Email Verification Required
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Users must verify email to qualify
                  </p>
                </div>
                <Switch
                  checked={globalSettings.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      requireEmailVerification: checked
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Geographic Tracking
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Track user locations for analytics
                  </p>
                </div>
                <Switch
                  checked={globalSettings.enableGeoTracking}
                  onCheckedChange={(checked) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      enableGeoTracking: checked
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Entry Limits */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Entry Limits</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Max Entries per User</Label>
                <Input
                  type="number"
                  value={globalSettings.maxEntriesPerUser}
                  onChange={(e) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      maxEntriesPerUser: parseInt(e.target.value) || 0
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Time Window (hours)</Label>
                <Input
                  type="number"
                  value={globalSettings.entryTimeWindow}
                  onChange={(e) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      entryTimeWindow: parseInt(e.target.value) || 0
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Custom Rules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Custom Rules</h3>
              <Button variant="outline" size="sm" onClick={addRule}>
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getRuleIcon(rule.type)}
                      <Badge variant="outline" className="text-xs">
                        {getRuleTypeLabel(rule.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) =>
                          updateRule(rule.id, { enabled })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Rule Type</Label>
                      <Select
                        value={rule.type}
                        onValueChange={(type: Rule['type']) =>
                          updateRule(rule.id, { type })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rate_limit">
                            Rate Limiting
                          </SelectItem>
                          <SelectItem value="geo_block">
                            Geographic Block
                          </SelectItem>
                          <SelectItem value="email_domain">
                            Email Domain
                          </SelectItem>
                          <SelectItem value="ip_block">IP Blocking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Rule Name</Label>
                      <Input
                        value={rule.name}
                        onChange={(e) =>
                          updateRule(rule.id, { name: e.target.value })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Value</Label>
                    <Input
                      value={rule.value}
                      onChange={(e) =>
                        updateRule(rule.id, { value: e.target.value })
                      }
                      placeholder={
                        rule.type === 'rate_limit'
                          ? 'e.g., 5'
                          : rule.type === 'geo_block'
                            ? 'e.g., CN,RU,KP'
                            : rule.type === 'email_domain'
                              ? 'e.g., tempmail.com,fake.com'
                              : 'e.g., 192.168.1.1'
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Blocklist */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Custom Blocklist</span>
            </h3>

            <div className="space-y-2">
              <Label className="text-sm">Email Addresses (one per line)</Label>
              <Textarea
                value={customBlocklist}
                onChange={(e) => setCustomBlocklist(e.target.value)}
                placeholder="spam@example.com&#10;badactor@fake.com"
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Add email addresses or domains to automatically block
              </p>
            </div>
          </div>

          {/* Risk Threshold */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Risk Assessment</h3>
            <div className="space-y-2">
              <Label className="text-sm">Suspicious Activity Threshold</Label>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={globalSettings.suspiciousActivityThreshold}
                  onChange={(e) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      suspiciousActivityThreshold: parseInt(e.target.value) || 0
                    }))
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  Entries with risk scores above this threshold will be flagged
                  for review
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4 border-t">
            <Button className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>

          {/* Active Rules Summary */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm">
              <div className="font-medium text-blue-800 mb-1">
                Active Protection
              </div>
              <div className="text-blue-600 space-y-1">
                <div>
                  • {rules.filter((r) => r.enabled).length} custom rules enabled
                </div>
                <div>
                  • Bot detection:{' '}
                  {globalSettings.enableBotDetection ? 'On' : 'Off'}
                </div>
                <div>
                  • Email verification:{' '}
                  {globalSettings.requireEmailVerification
                    ? 'Required'
                    : 'Optional'}
                </div>
                <div>
                  • Max entries per user: {globalSettings.maxEntriesPerUser}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
