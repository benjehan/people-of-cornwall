"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users as UsersIcon,
  Loader2,
  ArrowLeft,
  Search,
  Shield,
  ShieldCheck,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "moderator" | "admin";
  created_at: string;
  avatar_url: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [authLoading, isAdmin, router]);

  const loadUsers = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await (supabase
      .from("users") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading users:", error);
    } else {
      setUsers(data || []);
      setFilteredUsers(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users;

    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.display_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [search, roleFilter, users]);

  const updateUserRole = async (userId: string, newRole: "user" | "moderator" | "admin") => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    setUpdatingUserId(userId);
    const supabase = createClient();

    const { error } = await (supabase
      .from("users") as any)
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    } else {
      await loadUsers();
    }
    setUpdatingUserId(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500 text-white border-0"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>;
      case "moderator":
        return <Badge className="bg-copper text-white border-0"><Shield className="h-3 w-3 mr-1" />Moderator</Badge>;
      default:
        return <Badge variant="secondary"><User className="h-3 w-3 mr-1" />User</Badge>;
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-granite" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back to Admin */}
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-granite mb-2 flex items-center gap-3">
              <UsersIcon className="h-8 w-8 text-granite" />
              User Management
            </h1>
            <p className="text-stone">Manage user roles and permissions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-bone"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px] border-bone">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="moderator">Moderators</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card className="border-bone">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-granite">{users.length}</p>
              <p className="text-sm text-stone">Total Users</p>
            </CardContent>
          </Card>
          <Card className="border-bone">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-granite">{users.filter(u => u.role === "admin").length}</p>
              <p className="text-sm text-stone">Admins</p>
            </CardContent>
          </Card>
          <Card className="border-bone">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-granite">{users.filter(u => u.role === "moderator").length}</p>
              <p className="text-sm text-stone">Moderators</p>
            </CardContent>
          </Card>
          <Card className="border-bone">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-granite">{users.filter(u => u.role === "user").length}</p>
              <p className="text-sm text-stone">Regular Users</p>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-granite" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="border-bone">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="h-12 w-12 text-silver mb-4" />
              <p className="text-lg font-medium text-granite">No users found</p>
              <p className="text-stone">Try adjusting your search filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((userData) => (
              <Card key={userData.id} className="border-bone">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {userData.avatar_url ? (
                          <img
                            src={userData.avatar_url}
                            alt={userData.display_name || "User"}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-granite/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-granite" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-granite truncate">
                            {userData.display_name || "Anonymous"}
                          </h3>
                          <p className="text-sm text-stone flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            {userData.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(userData.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getRoleBadge(userData.role)}

                      {userData.id !== user?.id && (
                        <Select
                          value={userData.role}
                          onValueChange={(newRole) => updateUserRole(userData.id, newRole as any)}
                          disabled={updatingUserId === userData.id}
                        >
                          <SelectTrigger className="w-[140px] border-bone">
                            {updatingUserId === userData.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Change to User</SelectItem>
                            <SelectItem value="moderator">Change to Moderator</SelectItem>
                            <SelectItem value="admin">Change to Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {userData.id === user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
