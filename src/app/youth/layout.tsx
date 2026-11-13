import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "RESPONDENT")
    redirect(u.role === "ADMIN" ? "/admin" : "/company");
  return (
    <Shell user={{ id: u.id, name: u.name, email: u.email, role: u.role }}>
      {children}
    </Shell>
  );
}
