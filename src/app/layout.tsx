import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "我们的家谱",
  description: "一套程序承载多个家族宗谱，陈氏宗谱、赵氏宗谱等。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:weights@400;500;700;900&family=Noto+Sans:weights@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col">
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          {children}
        </main>
        <Footer />
        {/* Microsoft Clarity - 访问统计（免费、隐私友好、无Cookie弹窗） */}
        <script async src="https://www.clarity.ms/tag/js" data-clarity-id="ycaaq52uhd"></script>
      </body>
    </html>
  );
}