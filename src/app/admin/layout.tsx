import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!["MAIN_ADMIN", "SUB_ADMIN"].includes(session.user.role)) redirect("/login");
  return <>{children}</>;
}
