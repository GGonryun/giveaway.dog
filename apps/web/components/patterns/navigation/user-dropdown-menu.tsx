'use client';

import {
  Home,
  LogOut,
  ArrowUpCircle,
  User,
  History,
  Settings,
  Monitor,
  Sun,
  Moon,
  Gift
} from 'lucide-react';
import Link from 'next/link';
import { UserSchema } from '@/schemas/user';
import { UNKNOWN_USER_NAME } from '@giveaway/app-config/settings';
import { UserAccountType } from '@prisma/client';
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@giveaway/ui-primitives/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@giveaway/ui-primitives/dropdown-menu';
import { Button } from '@giveaway/ui-primitives/button';
import {
  ToggleGroup,
  ToggleGroupItem
} from '@giveaway/ui-primitives/toggle-group';
import { useLogout } from '@/lib/auth/hooks/use-logout';
import { useTheme } from 'next-themes';

export const UserDropdownMenu: React.FC<{ user: UserSchema }> = ({ user }) => {
  const isHost = user.accountType === UserAccountType.HOST;
  const logout = useLogout();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
          <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage
              src={
                user?.image ||
                `https://avatar.vercel.sh/${user?.email || user?.id}`
              }
              alt={user?.name || 'User avatar'}
            />
            <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <div className="px-3 py-2">
          <p className="text-sm font-medium">
            {user?.name || UNKNOWN_USER_NAME}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>

        <DropdownMenuSeparator />

        {isHost && (
          <DropdownMenuItem asChild>
            <Link
              href="/app"
              className="cursor-pointer flex items-center justify-between"
            >
              <span>Dashboard</span>
              <Settings className="h-4 w-4" />
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link
            href="/browse"
            className="cursor-pointer flex items-center justify-between"
          >
            <span>Browse Giveaways</span>
            <Gift className="h-4 w-4" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/account"
            className="cursor-pointer flex items-center justify-between"
          >
            <span>Account Settings</span>
            <User className="h-4 w-4" />
          </Link>
        </DropdownMenuItem>

        {!isHost && (
          <DropdownMenuItem asChild>
            <Link
              href="/account/history"
              className="cursor-pointer flex items-center justify-between"
            >
              <span>Participation History</span>
              <History className="h-4 w-4" />
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <div className="px-2 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Theme</span>
          </div>
          <ToggleGroup
            type="single"
            value={theme}
            onValueChange={(value) => value && setTheme(value)}
            className="gap-0 border rounded-md bg-muted p-0.5 w-full"
          >
            <ToggleGroupItem
              value="system"
              className="h-7 flex-1 data-[state=on]:bg-background data-[state=on]:border data-[state=on]:text-foreground"
            >
              <Monitor className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="light"
              className="h-7 flex-1 data-[state=on]:bg-background data-[state=on]:border data-[state=on]:text-foreground"
            >
              <Sun className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="dark"
              className="h-7 flex-1 data-[state=on]:bg-background data-[state=on]:border data-[state=on]:text-foreground"
            >
              <Moon className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/home"
            className="cursor-pointer flex items-center justify-between"
          >
            <span>Home Page</span>
            <Home className="h-4 w-4" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => logout.run('/')}
          className="cursor-pointer flex items-center justify-between"
        >
          <span>Logout</span>
          <LogOut className="h-4 w-4" />
        </DropdownMenuItem>

        {isHost && (
          <>
            <DropdownMenuSeparator />

            <div className="p-2">
              <Button className="w-full" size="sm" asChild>
                <Link href="/pricing">
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
