"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { getClanMeta, getClanIds } from "@/lib/clans";
import { getClanIdFromPath } from "@/lib/router";

export default function Footer() {
  const pathname = usePathname();
  const clanId = getClanIdFromPath(pathname);
  const isRoot = !getClanIds().includes(clanId);
  const meta = isRoot ? null : getClanMeta(clanId);
  const [qrAccount, setQrAccount] = useState<string | null>(null);

  return (
    <footer className="bg-gray-900 text-gray-400 py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center space-y-2">
        {meta ? (
          <>
            <p className="chinese-heading text-lg text-gray-300">{meta.name}</p>
            <p className="text-sm">
              {meta.region} · 始迁祖{meta.rootName}
            </p>
            <div className="flex items-center justify-center gap-4 pt-1 text-xs">
              {(meta.wechatAccounts ?? ["我们的家谱"]).map((acc, i) => {
                const links: Record<string, string> = {
                  "我们的家谱": "https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzUyOTEzNjAyMQ==&action=getalbum&album_id=4556229959886307330#wechat_redirect",
                };
                const link = links[acc];
                return (
                  <span key={acc}>
                    {i > 0 && <span className="text-gray-600 mr-4">|</span>}
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 transition-colors underline text-xs cursor-pointer">
                        微信公众号：我们的家谱-那些不易的前辈
                      </a>
                    ) : meta.wechatQr?.[acc] ? (
                      <button
                        onClick={() => setQrAccount(acc)}
                        className="cursor-pointer text-gray-400 hover:text-amber-400 transition-colors"
                      >
                        微信公众号：{acc}
                      </button>
                    ) : (
                      <span>微信公众号：{acc}</span>
                    )}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-gray-600 pt-1">
              © {new Date().getFullYear()} {meta.name}编委会
            </p>
          </>
        ) : (
          <>
            <p className="chinese-heading text-lg text-gray-300">我们的家谱</p>
            <p className="text-sm">一套程序，承载多个家族宗谱</p>
            <p className="text-xs text-gray-600 pt-1">
              © {new Date().getFullYear()}
            </p>
          </>
        )}
        <p className="text-xs text-gray-500 pt-2">
          <a
            href="https://beian.miit.gov.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            陕ICP备18006511号
          </a>
        </p>
      </div>

      {qrAccount && meta?.wechatQr?.[qrAccount] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setQrAccount(null)}
        >
          <div
            className="bg-white rounded-xl p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={meta.wechatQr[qrAccount]}
              alt={qrAccount}
              className="w-52 h-52 object-contain mx-auto"
            />
            <p className="mt-3 text-gray-700 text-sm">
              微信扫一扫，关注「{qrAccount}」
            </p>
            <button
              onClick={() => setQrAccount(null)}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}