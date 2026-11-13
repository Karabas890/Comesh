import { Library } from "@/components/library";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Library id={(await params).id} />;
}
