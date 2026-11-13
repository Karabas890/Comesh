import { AuthForm } from "@/components/auth-form";
export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  return (
    <AuthForm
      register
      initialRole={role === "RESPONDENT" ? "RESPONDENT" : "COMPANY"}
    />
  );
}
