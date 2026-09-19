"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { sidebarNav, profileNavItem } from "@/lib/navigation";

export default function Sidebar({ profile }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeFlyout, setActiveFlyout] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState(null);

  // Close flyout on navigation
  useEffect(() => {
    setActiveFlyout(null);
  }, [pathname]);

  // Close flyout on escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setActiveFlyout(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout() {
    try {
      setLogoutLoading(true);
      setLogoutError(null);
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to logout.");
      }
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      setLogoutError(error.message);
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <aside
      className="sticky top-0 flex h-screen w-full flex-col border-r border-white/5 bg-slate-950/80 px-6 py-8 backdrop-blur"
      onMouseLeave={() => setActiveFlyout(null)}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">STOKIQ</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Control Tower</h2>
        <p className="text-xs text-slate-500">Hi {profile.full_name.split(" ")[0]}</p>
      </div>

      <nav className="mt-10 flex-1 space-y-4 text-sm font-medium text-slate-400">
        {sidebarNav.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            pathname={pathname}
            profile={profile}
            activeFlyout={activeFlyout}
            setActiveFlyout={setActiveFlyout}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <NavItem
          item={profileNavItem}
          pathname={pathname}
          profile={profile}
          isProfile
          activeFlyout={activeFlyout}
          setActiveFlyout={setActiveFlyout}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
          logoutError={logoutError}
        />
        <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">STOKIQ v1.0</p>
      </div>
    </aside>
  );
}

function NavItem({
  item,
  pathname,
  profile,
  isProfile = false,
  activeFlyout,
  setActiveFlyout,
  onLogout,
  logoutLoading = false,
  logoutError = null,
}) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const showProfileHover = isProfile;
  const isFlyoutOpen = hasChildren && activeFlyout === item.label;
  const closeTimeoutRef = useRef(null);

  function handleMouseEnter() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (hasChildren && typeof setActiveFlyout === "function") {
      setActiveFlyout(item.label);
    } else if (!hasChildren && typeof setActiveFlyout === "function") {
      setActiveFlyout(null);
    }
  }

  function handleMouseLeave() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveFlyout?.((current) => (current === item.label ? null : current));
    }, 150);
  }

  return (
    <div
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={item.href}
        onClick={() => setActiveFlyout?.(null)}
        className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition ${
          isActive ? "bg-emerald-500/10 text-white" : "hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon name={item.icon} />
        <span className="flex-1">{item.label}</span>
        {(hasChildren || showProfileHover) && (
          <Icons.ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-300" />
        )}
      </Link>

      {hasChildren && isFlyoutOpen && (
        <div
          className="absolute left-full top-0 z-50 pl-2 min-w-[240px]"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/95 p-4 text-xs text-slate-200 shadow-2xl backdrop-blur">
            <div className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500 px-1">{item.label}</div>
            <div className="space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setActiveFlyout?.(null)}
                  className={`block rounded-xl px-3 py-2 transition ${
                    pathname === child.href ? "bg-emerald-500/10 text-emerald-300 font-medium" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {showProfileHover && (
        <div className="absolute left-0 right-0 bottom-full z-40 hidden rounded-2xl border border-white/10 bg-slate-900/95 p-4 text-xs text-slate-200 shadow-2xl group-hover:flex group-focus-within:flex">
          <div className="space-y-4">
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Role</p>
              <p className="mt-1 text-sm capitalize text-white">{profile.role.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Login ID</p>
              <p className="mt-1 text-sm text-slate-100">{profile.login_id}</p>
            </div>
            {profile.email && (
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Email</p>
                <p className="mt-1 truncate text-sm text-slate-200">{profile.email}</p>
              </div>
            )}
            <button
              type="button"
              onClick={onLogout}
              disabled={logoutLoading}
              className="w-full rounded-2xl border border-white/10 px-3 py-2 text-sm font-medium text-rose-300 transition hover:border-rose-300 disabled:opacity-60"
            >
              {logoutLoading ? "Signing out..." : "Logout"}
            </button>
            {logoutError && <p className="text-[0.65rem] text-rose-400">{logoutError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Icon({ name }) {
  const Component = Icons[name] ?? Icons.Circle;
  return <Component size={16} />;
}
