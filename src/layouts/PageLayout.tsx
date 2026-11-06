import "./PageLayout.scss";
import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return <section className="page-layout">{children}</section>;
}
