import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ 
      error: "Not logged in",
      user: null,
      profile: null 
    });
  }

  const { data: profile, error: profileError } = await (supabase
    .from("users") as any)
    .select("*")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile || null,
    profileError: profileError?.message || null,
    isAdmin: profile?.role === "admin",
  });
}
