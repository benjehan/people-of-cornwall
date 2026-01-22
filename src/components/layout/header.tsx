"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Menu, X, User, LogOut, FileText, Settings, PenLine } from "lucide-react";
import { useState } from "react";
import { useUser, getDisplayName, getAvatarUrl } from "@/hooks/use-user";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isLoading, isAdmin, signOut } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const displayName = getDisplayName(user, profile);
  const avatarUrl = getAvatarUrl(user, profile);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:no-underline">
          <div className="flex flex-col">
            <span className="font-serif text-xl font-semibold text-foreground">
              People of Cornwall
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              A living archive of Cornish voices
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/stories"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:no-underline"
          >
            Stories
          </Link>
          <Link
            href="/map"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:no-underline"
          >
            <MapPin className="h-4 w-4" />
            By Place
          </Link>
          <Link
            href="/timeline"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:no-underline"
          >
            <Clock className="h-4 w-4" />
            By Time
          </Link>
          <Link
            href="/collections"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:no-underline"
          >
            Collections
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            // Loading skeleton
            <div className="flex items-center gap-3">
              <div className="hidden h-9 w-24 animate-pulse rounded-md bg-chalk-white-dark sm:block" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-chalk-white-dark" />
            </div>
          ) : user ? (
            <>
              <Link href="/write" className="hidden sm:block">
                <Button className="gap-2 bg-copper-clay text-chalk-white hover:bg-copper-clay-light">
                  <PenLine className="h-4 w-4" />
                  Share a story
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-atlantic-blue/20"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={avatarUrl || undefined}
                        alt={displayName}
                      />
                      <AvatarFallback className="bg-atlantic-blue text-chalk-white text-sm font-medium">
                        {displayName[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                      <AvatarFallback className="bg-atlantic-blue text-chalk-white">
                        {displayName[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/stories" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4" />
                      My Stories
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/write" className="flex items-center gap-2 cursor-pointer sm:hidden">
                      <PenLine className="h-4 w-4" />
                      Share a story
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-atlantic-blue">
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="text-atlantic-blue">
                  Sign in
                </Button>
              </Link>
              <Link href="/login">
                <Button className="gap-2 bg-atlantic-blue text-chalk-white hover:bg-atlantic-blue-light">
                  <PenLine className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Share a story</span>
                  <span className="sm:hidden">Sign in</span>
                </Button>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/stories"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              Stories
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MapPin className="h-4 w-4" />
              Stories by Place
            </Link>
            <Link
              href="/timeline"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Clock className="h-4 w-4" />
              Stories by Time
            </Link>
            <Link
              href="/collections"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              Collections
            </Link>
            {user && (
              <Link
                href="/write"
                className="mt-2 rounded-md bg-copper-clay px-3 py-2 text-center text-sm font-medium text-chalk-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Share a story
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
