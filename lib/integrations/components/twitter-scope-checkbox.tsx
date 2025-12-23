import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield, Check } from 'lucide-react';

interface TwitterScopeCheckboxProps {
  id: string;
  checked: boolean;
  disabled: boolean;
  label: string;
  description: string;
  required?: boolean;
  alreadyGranted?: boolean;
  onCheckedChange?: () => void;
}

export function TwitterScopeCheckbox({
  id,
  checked,
  disabled,
  label,
  description,
  required = false,
  alreadyGranted = false,
  onCheckedChange
}: TwitterScopeCheckboxProps) {
  return (
    <div className="flex items-center space-x-3">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={id}
            className={
              disabled
                ? 'font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                : 'cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            }
          >
            {label}
          </Label>
          {required && (
            <div className="flex items-center justify-center w-5 h-5 rounded border border-blue-500 bg-blue-50">
              <Shield className="h-3 w-3 text-blue-600" />
            </div>
          )}
          {alreadyGranted && (
            <div className="flex items-center justify-center w-5 h-5 rounded border border-green-500 bg-green-50">
              <Check className="h-3 w-3 text-green-600" />
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}
