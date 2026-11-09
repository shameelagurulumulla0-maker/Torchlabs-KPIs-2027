import type { Metadata } from "next";
import "./globals.css";
import "./dashboard.css";
import "./workspace.css";
import "./torchlabs-theme.css";
import "./contribution.css";
import "./performance.css";
import "./review-ui.css";
import "./dark-mode.css";
import "./role-overview.css";
import "./review-workflow.css";

export const metadata: Metadata = {
  title: "Torchlabs · KPI Evaluator",
  description: "Organizational KPI tracking, actual results and performance reviews for Torchlabs.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
