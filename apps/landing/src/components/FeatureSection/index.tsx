import { Check } from "lucide-react";
import { AnimatedSection } from "../AnimatedSection";
import { FEATURE_DEEP_DIVES } from "@/utils/constants";

export const FeatureSection = () => {
  return (
    <div className="px-6">
      {FEATURE_DEEP_DIVES.map((feature, index) => (
        <section key={feature.title} className="py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Text side */}
              <AnimatedSection
                className={feature.imagePosition === "left" ? "lg:order-2" : ""}
              >
                <div>
                  <span className="text-accent text-xs uppercase tracking-[0.2em] font-mono font-medium">
                    {feature.title}
                  </span>
                  <h3 className="font-display font-bold text-2xl md:text-3xl tracking-tight mt-3 mb-4">
                    {feature.headline}
                  </h3>
                  <p className="text-text-secondary leading-relaxed mb-8">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                        <span className="text-text-secondary text-sm">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>

              {/* Image placeholder */}
              <AnimatedSection
                delay={0.2}
                className={feature.imagePosition === "left" ? "lg:order-1" : ""}
              >
                <div className="aspect-video bg-bg-secondary rounded-2xl border border-border-default flex items-center justify-center">
                  <span className="text-text-tertiary">{feature.title} Screenshot</span>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};
