"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Trees, Search, BarChart3, BookOpen, Info, Home, User, PlusCircle, HelpCircle, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { getUser } from "@/lib/api";
import { getClanMeta, getClanIds } from "@/lib/clans";
import { getClanIdFromPath, getImageBase } from "@/lib/router";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const clanId = getClanIdFromPath(pathname);
  const isRoot = !getClanIds().includes(clanId);
  const meta = isRoot ? null : getClanMeta(clanId);
  const prefix = isRoot ? "" : `/${clanId}`;

  const navItems = [
    { href: `${prefix}/`, label: "首页", icon: Home },
    { href: `${prefix}/family-tree`, label: "家谱树", icon: Trees },
    { href: `${prefix}/search`, label: "搜索", icon: Search },
    { href: `${prefix}/stats`, label: "统计", icon: BarChart3 },
    { href: `${prefix}/documents`, label: "文献", icon: BookOpen },
    { href: `${prefix}/about`, label: "关于", icon: Info },
    { href: `${prefix}/help`, label: "帮助", icon: HelpCircle },
  ];

  useEffect(() => {
    const user = getUser();
    setLoggedIn(!!user);
    setIsAdmin(user?.role === "admin");
  }, [pathname]);

  const brand = meta ? (
    <Link href={`/${clanId}`} className="flex items-center gap-2 shrink-0">
      <img
        src={`${getImageBase(clanId)}/logo.png`}
        alt={meta.surname}
        width={32}
        height={32}
        className="w-8 h-8 rounded-lg object-contain bg-white"
      />
      <span className="chinese-heading text-lg font-bold text-primary-800 hidden sm:block">
        {meta.name}
      </span>
    </Link>
  ) : (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <span className="chinese-heading text-lg font-bold text-primary-800 hidden sm:block">
        我们的家谱
      </span>
    </Link>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {brand}

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {isRoot ? (
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  bg-primary-50 text-primary-700`}
              >
                <Home size={16} />
                谱系选择
              </Link>
            ) : (
              <>
                {navItems.map((item) => {
                  const isActive =
                    item.href === `${prefix}/`
                      ? pathname === `${prefix}/`
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                        }`}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
                {loggedIn ? (
                  <>
                    <Link
                      href={`${prefix}/submit`}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${pathname.startsWith(`${prefix}/submit`) ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"}`}
                    >
                      <PlusCircle size={16} />
                      提交变更
                    </Link>
                    <Link
                      href={`${prefix}/feedback`}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${pathname.startsWith(`${prefix}/feedback`) ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"}`}
                    >
                      <MessageSquare size={16} />
                      反馈
                    </Link>
                    {isAdmin && (
                      <Link
                        href={`${prefix}/admin`}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${pathname.startsWith(`${prefix}/admin`) ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"}`}
                      >
                        <User size={16} />
                        审核
                      </Link>
                    )}
                  </>
                ) : (
                  <Link
                    href={`${prefix}/login`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-all duration-200"
                  >
                    <User size={16} />
                    登录 / 注册
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 pt-2">
            {isRoot ? (
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary-50 text-primary-700"
              >
                <Home size={18} />
                谱系选择
              </Link>
            ) : (
              <>
                {navItems.map((item) => {
                  const isActive =
                    item.href === `${prefix}/`
                      ? pathname === `${prefix}/`
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                        }`}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
                {loggedIn ? (
                  <>
                    <Link
                      href={`${prefix}/submit`}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${pathname.startsWith(`${prefix}/submit`) ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"}`}
                    >
                      <PlusCircle size={18} />
                      提交变更
                    </Link>
                    <Link
                      href={`${prefix}/feedback`}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${pathname.startsWith(`${prefix}/feedback`) ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"}`}
                    >
                      <MessageSquare size={18} />
                      反馈
                    </Link>
                    {isAdmin && (
                      <Link
                        href={`${prefix}/admin`}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                          ${pathname.startsWith(`${prefix}/admin`) ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"}`}
                      >
                        <User size={18} />
                        审核管理
                      </Link>
                    )}
                  </>
                ) : (
                  <Link
                    href={`${prefix}/login`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-all duration-200"
                  >
                    <User size={18} />
                    登录 / 注册
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}