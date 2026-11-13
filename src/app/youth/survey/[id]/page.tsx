import { Survey } from "@/components/youth";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Survey id={(await params).id} />;
}
