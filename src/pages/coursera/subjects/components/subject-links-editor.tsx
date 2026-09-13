import { useState, useEffect } from 'react';
import { SubjectLink } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Link2,
  Sparkles,
  Layers,
  FileCode,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  links: SubjectLink[];
  onChange: (links: SubjectLink[]) => void;
  error?: string;
  disabled?: boolean;
}

function detectCourseraUrlType(url: string): string | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('/specializations/')) return 'Specialization';
  if (lower.includes('/professional-certificates/')) return 'Professional Certificate';
  if (lower.includes('/learn/')) return 'Single Course';
  if (lower.includes('/degrees/')) return 'Degree Program';
  return null;
}

export function SubjectLinksEditor({ links, onChange, error, disabled }: Props) {
  // Mode: 'single' (1 Specialization or main link) or 'multiple' (Multi-part / multiple courses)
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [singleLabelExpanded, setSingleLabelExpanded] = useState(false);

  // Initialize mode based on links count
  useEffect(() => {
    if (links.length > 1) {
      setMode('multiple');
    }
  }, [links.length]);

  const handleSwitchMode = (newMode: 'single' | 'multiple') => {
    setMode(newMode);
    if (newMode === 'single') {
      // Keep only first link or default empty
      if (links.length === 0) {
        onChange([{ label: '', url: '' }]);
      } else if (links.length > 1) {
        onChange([links[0]]);
      }
    } else {
      // Multiple mode: ensure at least 1 link, add second if only 1
      if (links.length === 0) {
        onChange([
          { label: 'Part 1', url: '' },
          { label: 'Part 2', url: '' },
        ]);
      } else if (links.length === 1) {
        onChange([
          { label: links[0].label || 'Part 1', url: links[0].url },
          { label: 'Part 2', url: '' },
        ]);
      }
    }
  };

  const handleSingleUrlChange = (value: string) => {
    const currentLabel = links[0]?.label || '';
    onChange([{ label: currentLabel, url: value }]);
  };

  const handleSingleLabelChange = (value: string) => {
    const currentUrl = links[0]?.url || '';
    onChange([{ label: value, url: currentUrl }]);
  };

  const handleAdd = () => {
    const nextIdx = links.length + 1;
    onChange([...links, { label: `Part ${nextIdx}`, url: '' }]);
  };

  const handleRemove = (index: number) => {
    if (links.length <= 1) return;
    const newLinks = [...links];
    newLinks.splice(index, 1);
    onChange(newLinks);
  };

  const handleChange = (index: number, field: keyof SubjectLink, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange(newLinks);
  };

  const currentSingleUrl = links[0]?.url || '';
  const detectedType = detectCourseraUrlType(currentSingleUrl);

  return (
    <div className="flex flex-col gap-3">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-border">
        <div className="flex flex-col">
          <Label className="font-semibold text-xs text-foreground uppercase tracking-wider">
            Course Link Structure
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {mode === 'single'
              ? 'Ideal for Specializations or single Coursera courses'
              : 'For multi-part courses, modules, or series'}
          </span>
        </div>

        {/* Tab Pills */}
        <div className="inline-flex p-0.5 rounded-lg bg-muted/60 border border-border shrink-0">
          <button
            type="button"
            onClick={() => handleSwitchMode('single')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer select-none',
              mode === 'single'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Link2 className="size-3 text-primary" />
            Single Link (Specialization)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('multiple')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer select-none',
              mode === 'multiple'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Layers className="size-3 text-primary" />
            Multiple Parts {links.length > 1 && `(${links.length})`}
          </button>
        </div>
      </div>

      {/* SINGLE LINK MODE */}
      {mode === 'single' ? (
        <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/80">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <FileCode className="size-3.5 text-primary" />
                Coursera URL (Required)
              </Label>
              {detectedType && (
                <Badge
                  variant="primary"
                  className="text-[10px] py-0.5 px-2 gap-1 font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  <Sparkles className="size-3" />
                  {detectedType} detected
                </Badge>
              )}
            </div>

            <div className="relative">
              <Input
                value={currentSingleUrl}
                onChange={(e) => handleSingleUrlChange(e.target.value)}
                placeholder="https://www.coursera.org/specializations/..."
                className="font-mono text-xs pr-8 h-9 bg-background"
                disabled={disabled}
              />
              {currentSingleUrl && (
                <button
                  type="button"
                  onClick={() => handleSingleUrlChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Clear input"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Paste the full Specialization or Course link from Coursera.
            </p>
          </div>

          {/* Optional Label (Collapsible / Sleek) */}
          <div className="pt-2 border-t border-border/40 flex flex-col gap-1.5">
            {!singleLabelExpanded && !links[0]?.label ? (
              <button
                type="button"
                onClick={() => setSingleLabelExpanded(true)}
                className="text-xs text-primary hover:underline font-medium self-start flex items-center gap-1"
              >
                + Add custom label (optional)
              </button>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-normal text-muted-foreground">
                    Custom Label (Optional)
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setSingleLabelExpanded(false);
                      handleSingleLabelChange('');
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Hide
                  </button>
                </div>
                <Input
                  value={links[0]?.label || ''}
                  onChange={(e) => handleSingleLabelChange(e.target.value)}
                  placeholder="e.g. Specialization, Full Track"
                  className="text-xs h-8 bg-background"
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MULTIPLE LINKS MODE */
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
            {links.map((link, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border hover:border-border/80 transition-all"
              >
                <span className="size-7 rounded-md bg-muted flex items-center justify-center font-mono font-semibold text-[11px] text-muted-foreground shrink-0">
                  #{idx + 1}
                </span>

                <div className="w-1/3 min-w-[120px]">
                  <Input
                    value={link.label || ''}
                    onChange={(e) => handleChange(idx, 'label', e.target.value)}
                    placeholder={`Part ${idx + 1}`}
                    disabled={disabled}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Input
                    value={link.url}
                    onChange={(e) => handleChange(idx, 'url', e.target.value)}
                    placeholder="https://coursera.org/..."
                    disabled={disabled}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>

                {links.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleRemove(idx)}
                    disabled={disabled}
                    title="Remove this link"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={disabled || links.length >= 20}
            className="h-8 text-xs gap-1.5 self-start"
          >
            <Plus className="size-3.5" />
            Add Another Part
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
