import { Radar } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-bg-inset border-t border-border-default">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Top section */}
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
          {/* Logo + tagline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Radar className="w-5 h-5 text-accent" />
              <span className="font-display font-bold">Radar</span>
            </div>
            <p className="text-text-tertiary text-sm max-w-xs">
              Unified developer tools for React Native. Debug smarter, not harder.
            </p>
          </div>

          {/* Nav links */}
          <div className="flex gap-16">
            <div>
              <h4 className="text-text-primary text-sm font-semibold mb-4">Product</h4>
              <div className="flex flex-col gap-3">
                <a href="#features" className="text-text-secondary text-sm hover:text-text-primary transition-colors">Features</a>
                <a href="/docs" className="text-text-secondary text-sm hover:text-text-primary transition-colors">Docs</a>
                <a href="#download" className="text-text-secondary text-sm hover:text-text-primary transition-colors">Download</a>
              </div>
            </div>
            <div>
              <h4 className="text-text-primary text-sm font-semibold mb-4">Community</h4>
              <div className="flex flex-col gap-3">
                <a href="https://github.com/trontechnologies/radar" target="_blank" rel="noopener noreferrer" className="text-text-secondary text-sm hover:text-text-primary transition-colors">GitHub</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border-subtle pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-tertiary text-xs">
            Built with Electron, React, and TypeScript
          </p>
          <p className="text-text-tertiary text-xs">
            &copy; {new Date().getFullYear()} Radar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
