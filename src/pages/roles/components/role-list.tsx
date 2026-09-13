import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  ShieldCheck,
  Plus,
  Search,
  Users,
  Key,
  X,
} from 'lucide-react';
import { formatRoleName, RoleItem } from '../types';

interface Props {
  roles: RoleItem[];
  selectedRoleId: number | null;
  onSelectRole: (roleId: number) => void;
  onAddRole: () => void;
  canManage: boolean;
  isLoading?: boolean;
}

export function RoleList({
  roles,
  selectedRoleId,
  onSelectRole,
  onAddRole,
  canManage,
  isLoading,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoles = roles.filter((role) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      role.name.toLowerCase().includes(term) ||
      (role.description && role.description.toLowerCase().includes(term))
    );
  });

  return (
    <Card className="border border-border h-full flex flex-col">
      <CardHeader className="p-4 pb-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-4.5 text-primary" />
            <CardTitle className="text-sm font-bold text-foreground">
              Roles
            </CardTitle>
            <Badge variant="secondary" size="xs" className="font-mono">
              {roles.length}
            </Badge>
          </div>

          {canManage && (
            <Button
              size="sm"
              onClick={onAddRole}
              className="h-8 text-xs gap-1.5 px-2.5"
            >
              <Plus className="size-3.5" />
              Add Role
            </Button>
          )}
        </div>

        {/* Search Filter Input */}
        <div className="relative">
          <Search className="size-3.5 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search roles..."
            className="h-8 text-xs ps-8 pe-7 bg-muted/20"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="space-y-2.5 py-1">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-3 rounded-xl border border-border/60 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
                <Skeleton className="h-3 w-40 rounded" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-4 w-14 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            {searchTerm ? (
              <p>No roles match &quot;{searchTerm}&quot;</p>
            ) : (
              <p>No roles found.</p>
            )}
          </div>
        ) : (
          filteredRoles.map((role) => {
            const isSelected = role.id === selectedRoleId;

            return (
              <div
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none text-xs flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-primary/5 border-primary/60 shadow-xs ring-1 ring-primary/30'
                    : 'bg-card hover:bg-muted/40 border-border/70 text-foreground'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-xs leading-snug">
                      {formatRoleName(role.name)}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      @{role.name}
                    </span>
                  </div>

                  {role.isSystem && (
                    <Badge
                      variant="primary"
                      appearance="light"
                      size="xs"
                      className="gap-1 shrink-0 font-medium"
                    >
                      <ShieldCheck className="size-3" />
                      System
                    </Badge>
                  )}
                </div>

                {role.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                    {role.description}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                  <span
                    className="inline-flex items-center gap-1 text-muted-foreground"
                    title={`${role.userCount} users currently assigned`}
                  >
                    <Users className="size-3" />
                    <strong className="text-foreground font-medium font-mono">
                      {role.userCount}
                    </strong>{' '}
                    users
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span
                    className="inline-flex items-center gap-1 text-muted-foreground"
                    title={`${role.permissionCount} permissions configured`}
                  >
                    <Key className="size-3" />
                    <strong className="text-foreground font-medium font-mono">
                      {role.permissionCount}
                    </strong>{' '}
                    perms
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
