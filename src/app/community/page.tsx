import { redirect } from "next/navigation";

// Redirect old community page to the new polls page
export default function CommunityPage() {
  redirect("/polls");
}
