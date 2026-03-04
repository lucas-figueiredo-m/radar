import { Check, X } from "lucide-react";
import { AnimatedSection } from "../AnimatedSection";
import { COMPARISON_DATA } from "@/utils/constants";

const TOOLS = ["Radar", "React DevTools", "Flipper", "Reactotron"];

export const ComparisonTable = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">
              How Radar compares
            </h2>
            <p className="text-text-secondary text-lg">
              One tool to replace them all.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="overflow-x-auto">
            <table className="w-full bg-bg-secondary rounded-2xl border border-border-default overflow-hidden">
              <thead>
                <tr className="bg-bg-surface">
                  <th className="text-left text-sm font-semibold text-text-primary px-6 py-4">
                    Feature
                  </th>
                  {TOOLS.map((tool) => (
                    <th
                      key={tool}
                      className={`text-center text-sm font-semibold px-6 py-4 ${
                        tool === "Radar" ? "text-accent" : "text-text-primary"
                      }`}
                    >
                      {tool}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={index < COMPARISON_DATA.length - 1 ? "border-b border-border-subtle" : ""}
                  >
                    <td className="text-sm text-text-secondary px-6 py-4">
                      {row.feature}
                    </td>
                    {[row.radar, row.reactDevTools, row.flipper, row.reactotron].map(
                      (supported, i) => (
                        <td
                          key={TOOLS[i]}
                          className={`text-center px-6 py-4 ${
                            i === 0 ? "bg-accent/5" : ""
                          }`}
                        >
                          {supported ? (
                            <Check className="w-5 h-5 text-status-success mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-text-disabled mx-auto" />
                          )}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
