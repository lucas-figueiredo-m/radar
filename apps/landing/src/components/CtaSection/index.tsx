import { Download, Github } from "lucide-react";
import { AnimatedSection } from "../AnimatedSection";
import { DOWNLOAD_URL } from "@/utils/constants";

export const CtaSection = () => {
  return (
    <section className="py-24 px-6">
      <AnimatedSection>
        <div className="max-w-5xl mx-auto rounded-3xl border border-border-default bg-gradient-to-b from-accent/5 to-transparent p-12 md:p-16 text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">
            Ready to simplify your debugging?
          </h2>
          <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto">
            Stop juggling multiple tools. Radar gives you everything in one beautiful interface.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white rounded-xl px-8 py-3 font-semibold transition-colors"
            >
              <Download className="w-5 h-5" />
              Download for macOS
            </a>
            <a
              href="https://github.com/trontechnologies/radar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-border-default hover:bg-bg-surface text-text-primary rounded-xl px-8 py-3 font-semibold transition-colors"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
};
