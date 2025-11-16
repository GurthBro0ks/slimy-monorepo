'use client';

import { PersonalityMode, personalityModes } from '@/lib/personality-modes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PersonalitySelectorProps {
  currentMode: PersonalityMode;
  onModeChange: (mode: PersonalityMode) => void;
  disabled?: boolean;
}

export function PersonalitySelector({
  currentMode,
  onModeChange,
  disabled = false,
}: PersonalitySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(personalityModes).map(([key, config]) => {
        const mode = key as PersonalityMode;
        const isActive = mode === currentMode;

        return (
          <Button
            key={mode}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange(mode)}
            disabled={disabled}
            className={cn(
              'transition-all',
              isActive && 'bg-neon-green text-zinc-900 hover:bg-neon-green/90'
            )}
          >
            <span className="mr-2">{config.icon}</span>
            {config.name}
          </Button>
        );
      })}
    </div>
  );
}
