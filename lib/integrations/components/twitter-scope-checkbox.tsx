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
        <div className="flex items-center gap-1">
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
            <Shield className="h-3 w-3 text-blue-600" strokeWidth={3} />
          )}
          {alreadyGranted && (
            <Check className="h-3 w-3 text-green-600" strokeWidth={3} />
          )}
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}
