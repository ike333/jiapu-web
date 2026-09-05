"use client";

import { useEffect, useRef } from "react";

// 百度联盟(百青藤)代码位容器：渲染广告投放代码（div + script），自动拉起内部脚本
export default function BaiduAd({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !code) return;
    el.innerHTML = code;
    // innerHTML 插入的 <script> 不会自动执行，手动按顺序重建执行（这段代码来自自家 admin 后台，可信源）
    const scripts = Array.from(el.querySelectorAll("script"));
    scripts.forEach((s) => {
      const ns = document.createElement("script");
      if (s.src) ns.src = s.src;
      else ns.textContent = s.textContent;
      el.appendChild(ns);
    });
  }, [code]);

  return <div ref={ref} className="overflow-hidden min-h-[60px]" />;
}