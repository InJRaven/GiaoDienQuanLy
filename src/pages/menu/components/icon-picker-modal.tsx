import { useMemo, useState } from 'react';
import { UniversalIcon } from '@/layouts/demo1/components/universal-icon';
import * as LucideIcons from 'lucide-react';
import keeniconsData from '@/config/keenicons-list.json';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Get list of valid lucide icons (capitalize first letter, valid component)
const lucideIconNames = Object.keys(LucideIcons).filter(
  (key) =>
    key !== 'createLucideIcon' && key !== 'default' && /^[A-Z]/.test(key),
);

interface IconPickerModalProps {
  value: string;
  onChange: (value: string) => void;
  trigger?: React.ReactNode;
}

export function IconPickerModal({
  value,
  onChange,
  trigger,
}: IconPickerModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('lucide');
  const [search, setSearch] = useState('');

  const iconsToDisplay = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (activeTab === 'lucide') {
      return lucideIconNames
        .filter((name) => name.toLowerCase().includes(s))
        .slice(0, 200)
        .map((name) => `lucide:${name}`);
    } else {
      const list = (keeniconsData as any)[activeTab] || [];
      return list
        .filter((name: string) => name.toLowerCase().includes(s))
        .slice(0, 200)
        .map((name: string) => `keen:${activeTab}:${name}`);
    }
  }, [activeTab, search]);

  const handleSelect = (icon: string) => {
    onChange(icon);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" className="px-3 shrink-0">
            Select Icon
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden grow">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="lucide" className="text-xs">
                Lucide
              </TabsTrigger>
              <TabsTrigger value="duotone" className="text-xs">
                Duotone
              </TabsTrigger>
              <TabsTrigger value="filled" className="text-xs">
                Filled
              </TabsTrigger>
              <TabsTrigger value="outline" className="text-xs">
                Outline
              </TabsTrigger>
              <TabsTrigger value="solid" className="text-xs">
                Solid
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Input
            placeholder="Search icons... (e.g., home, user)"
            value={search}
            variant="lg"
            onChange={(e) => setSearch(e.target.value)}
            className="h-16"
          />

          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 overflow-y-auto p-1 pb-4 min-h-[300px] content-start">
            {iconsToDisplay.length > 0 ? (
              iconsToDisplay.map((ico: string) => (
                <button
                  key={ico}
                  type="button"
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-md border hover:bg-muted transition-colors ${
                    value === ico
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                  onClick={() => handleSelect(ico)}
                  title={ico}
                >
                  <UniversalIcon icon={ico} className="size-6 text-2xl" />
                </button>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No icons found.
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Showing up to 200 results. Please enter a keyword for a specific search.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
