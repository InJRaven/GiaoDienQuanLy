import { ReactNode } from 'react';
import { Calendar, Settings, Settings2, Shield, Users } from 'lucide-react';
import { Link } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NotificationItemProps {
  userName: string;
  avatar: string;
  description: string;
  link?: string;
  time: string;
  text?: string;
  badge?: string;
  badgeColor?: 'online' | 'offline';
}

function NotificationRow({
  userName,
  avatar,
  description,
  link,
  time,
  text,
  badge,
  badgeColor,
}: NotificationItemProps) {
  return (
    <div className="flex items-start gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl(`/media/avatars/${avatar}`)}
          alt={userName}
          className="size-9 rounded-full object-cover border border-border"
        />
        {badgeColor && (
          <span
            className={`absolute bottom-0 end-0 size-2.5 rounded-full ring-2 ring-background ${
              badgeColor === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground'
            }`}
          />
        )}
      </div>
      <div className="flex flex-col gap-1 grow min-w-0">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">{userName}</span>{' '}
          {description}{' '}
          {link && (
            <span className="font-medium text-primary hover:underline cursor-pointer">
              {link}
            </span>
          )}
        </p>
        {text && (
          <p className="text-2xs text-muted-foreground/80 bg-muted/50 p-2 rounded border border-border/40 mt-0.5">
            {text}
          </p>
        )}
        <div className="flex items-center gap-2 text-3xs text-muted-foreground">
          <span>{time}</span>
          {badge && (
            <>
              <span>•</span>
              <span className="font-medium text-secondary-foreground">
                {badge}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationsSheet({ trigger }: { trigger: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="p-0 gap-0 sm:w-[500px] sm:max-w-none inset-5 start-auto h-auto rounded-lg [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="mb-0">
          <SheetTitle className="p-4 border-b border-border">
            Notifications
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="grow p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <Tabs defaultValue="all" className="w-full relative">
              <TabsList variant="line" className="w-full px-5 mb-2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="inbox" className="relative">
                  Inbox
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 absolute top-1 -end-1" />
                </TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
                <div className="grow flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        mode="icon"
                        className="mb-1"
                      >
                        <Settings className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-44"
                      side="bottom"
                      align="end"
                    >
                      <DropdownMenuItem asChild>
                        <Link to="/account/members/teams">
                          <Users /> Invite Users
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Settings2 />
                          <span>Team Settings</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="w-44">
                            <DropdownMenuItem asChild>
                              <Link to="/account/members/import-members">
                                <Shield />
                                Find Members
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/account/members/import-members">
                                <Calendar /> Meetings
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TabsList>

              {/* All Tab */}
              <TabsContent value="all" className="mt-0 divide-y divide-border">
                <NotificationRow
                  userName="Joe Lincoln"
                  avatar="300-4.png"
                  description="mentioned you in"
                  link="Latest Trends"
                  time="18 mins ago"
                  badge="Web Design"
                  badgeColor="online"
                  text="For an expert opinion, check out what Mike has to say on this topic!"
                />
                <NotificationRow
                  userName="Guy Hawkins"
                  avatar="300-27.png"
                  description="requested access to"
                  link="AirSpace Project"
                  time="14 hours ago"
                  badge="Dev Team"
                  badgeColor="offline"
                />
                <NotificationRow
                  userName="Raymond Pawell"
                  avatar="300-11.png"
                  description="posted a new article"
                  link="2025 Architecture Roadmap"
                  time="1 hour ago"
                  badge="Roadmap"
                  badgeColor="online"
                />
                <NotificationRow
                  userName="Selene Silverleaf"
                  avatar="300-21.png"
                  description="commented on your commit"
                  link="Auth Middleware Update"
                  time="2 days ago"
                  badge="Security"
                  badgeColor="online"
                />
              </TabsContent>

              {/* Inbox Tab */}
              <TabsContent
                value="inbox"
                className="mt-0 divide-y divide-border"
              >
                <NotificationRow
                  userName="Benjamin Harris"
                  avatar="300-30.png"
                  description="requested to upgrade plan"
                  time="4 days ago"
                  badge="Marketing"
                  badgeColor="offline"
                />
                <NotificationRow
                  userName="Isaac Morgan"
                  avatar="300-24.png"
                  description="shared report with you in"
                  link="Data Transmission"
                  time="6 days ago"
                  badge="Analytics"
                  badgeColor="online"
                />
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="mt-0 divide-y divide-border">
                <NotificationRow
                  userName="Adrian Vale"
                  avatar="300-6.png"
                  description="scheduled a new sprint review"
                  link="Sprint 42 Planning"
                  time="2 days ago"
                  badge="Product"
                  badgeColor="offline"
                />
                <NotificationRow
                  userName="Thalia Fox"
                  avatar="300-13.png"
                  description="invited you to join team"
                  link="Frontend Engineers"
                  time="4 days ago"
                  badge="Engineering"
                  badgeColor="online"
                />
              </TabsContent>

              {/* Following Tab */}
              <TabsContent
                value="following"
                className="mt-0 divide-y divide-border"
              >
                <NotificationRow
                  userName="Chloe Morgan"
                  avatar="300-34.png"
                  description="published a new design guideline"
                  link="Component Standards v2"
                  time="1 day ago"
                  badge="Design System"
                  badgeColor="online"
                />
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </SheetBody>
        <SheetFooter className="border-t border-border p-4 grid grid-cols-2 gap-2.5">
          <Button variant="outline" size="sm">
            Archive all
          </Button>
          <Button variant="outline" size="sm">
            Mark all as read
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
