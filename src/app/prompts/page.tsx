import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Writing Prompts | People of Cornwall",
  description: "Admin page for managing writing prompts.",
};

export default async function PromptsPage() {
  const supabase = await createClient();
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login?redirect=/prompts");
  }
  
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  
  if (userData?.role !== "admin") {
    // Non-admins are redirected to home - prompts are shown on the homepage
    redirect("/");
  }
  
  // Admins are redirected to the admin prompts management page
  redirect("/admin/prompts");
}
