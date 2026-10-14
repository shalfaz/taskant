import type { ReactNode } from "react";
import PublicLayout from "../../client/src/layouts/PublicLayout";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
