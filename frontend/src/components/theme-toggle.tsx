'use client';

import { useEffect, useState } from 'react';
import { useThemeStore, Theme, ResolvedTheme } from '@/stores/theme.store';
import { Sun, Moon, Monitor } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

const ThemeIcon = ({ theme, className }: { theme: ResolvedTheme | 'system'; className?: string }) => {
  switch (theme) {
    case 'light':
      return <Sun className={className} />;
    case 'dark':
      return <Moon className={className} />;
    case 'system':
      return <Monitor className={className} />;
  }
};

const themeOptions: { value: Theme; label: string; icon: ResolvedTheme | 'system' }[] = [
  { value: 'light', label: 'Light', icon: 'light' },
  { value: 'dark', label: 'Dark', icon: 'dark' },
  { value: 'system', label: 'System', icon: 'system' },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-9 w-9 rounded-md transition-colors data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:ring-2 data-[state=open]:ring-ring/30',
            className
          )}
        >
          <ThemeIcon theme={mounted ? resolvedTheme : 'light'} className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[140px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          sideOffset={4}
          align="end"
        >
          {themeOptions.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none',
                'focus:bg-accent focus:text-accent-foreground',
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                theme === option.value && 'bg-accent/50'
              )}
              onSelect={() => setTheme(option.value)}
            >
              <ThemeIcon theme={option.icon} className="h-4 w-4" />
              <span>{option.label}</span>
              {theme === option.value && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
