"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";

type DocsLayoutProps = {
  children: ReactNode;
};

const SIDEBAR_ITEMS = [
  { label: "Installation", href: "#installation" },
  { label: "Quick Start", href: "#quick-start" },
  { label: "Configuration", href: "#configuration" },
  { label: "Features", href: "#features-overview" },
];

export const DocsLayout = ({ children }: DocsLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen pt-16">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden sticky top-16 z-40 bg-bg-base/90 backdrop-blur-lg border-b border-border-default px-6 py-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          Documentation
        </button>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } lg:block w-64 shrink-0 border-r border-border-default bg-bg-inset sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto`}
        >
          <nav className="py-8 px-4">
            <h3 className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-medium px-3 mb-4">
              Documentation
            </h3>
            <ul className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-8 py-12 max-w-3xl">
          {children}
        </main>
      </div>
    </div>
  );
};
