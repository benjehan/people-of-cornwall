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
    <header className="sticky top-0 z-50 w-full border-b border-bone bg-parchment/95 backdrop-blur supports-[backdrop-filter]:bg-parchment/80">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:no-underline group">
          <span className="font-serif text-xl font-bold text-granite tracking-tight group-hover:text-slate transition-colors">
            People of Cornwall
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/stories"
            className="text-sm font-medium text-stone transition-colors hover:text-granite hover:no-underline"
          >
            Stories
          </Link>
          <Link
            href="/map"
            className="text-sm font-medium text-stone transition-colors hover:text-granite hover:no-underline"
          >
            Map
          </Link>
          <Link
            href="/timeline"
            className="text-sm font-medium text-stone transition-colors hover:text-granite hover:no-underline"
          >
            Timeline
          </Link>
          <Link
            href="/collections"
            className="text-sm font-medium text-stone transition-colors hover:text-granite hover:no-underline"
          >
            Collections
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            // Loading skeleton
            <div className="flex items-center gap-3">
              <div className="hidden h-9 w-24 animate-pulse rounded bg-bone sm:block" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-bone" />
            </div>
          ) : user ? (
            <>
              <Link href="/write" className="hidden sm:block">
                <Button className="gap-2 bg-granite text-parchment hover:bg-slate font-medium">
                  <PenLine className="h-4 w-4" />
                  Share a story
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-bone"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={avatarUrl || undefined}
                        alt={displayName}
                      />
                      <AvatarFallback className="bg-granite text-parchment text-sm font-medium">
                        {displayName[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                      <AvatarFallback className="bg-granite text-parchment">
                        {displayName[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-granite">{displayName}</p>
                      <p className="text-xs text-stone">{user.email}</p>
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
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-copper font-medium">
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
                <Button variant="ghost" className="text-granite font-medium hover:text-slate">
                  Sign in
                </Button>
              </Link>
              <Link href="/login">
                <Button className="gap-2 bg-granite text-parchment hover:bg-slate font-medium">
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
        <nav className="border-t border-bone bg-parchment px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/stories"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-granite hover:bg-cream"
              onClick={() => setMobileMenuOpen(false)}
            >
              Stories
            </Link>
            <Link
              href="/map"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-granite hover:bg-cream"
              onClick={() => setMobileMenuOpen(false)}
            >
              Map
            </Link>
            <Link
              href="/timeline"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-granite hover:bg-cream"
              onClick={() => setMobileMenuOpen(false)}
            >
              Timeline
            </Link>
            <Link
              href="/collections"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-granite hover:bg-cream"
              onClick={() => setMobileMenuOpen(false)}
            >
              Collections
            </Link>
            <Link
              href="/prompts"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-granite hover:bg-cream"
              onClick={() => setMobileMenuOpen(false)}
            >
              Prompts
            </Link>
            {user && (
              <Link
                href="/write"
                className="mt-3 rounded-md bg-granite px-3 py-2.5 text-center text-sm font-medium text-parchment"
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
