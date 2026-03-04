"use client";

import { AnimatedSection } from "../AnimatedSection";
import { CodeBlock } from "../CodeBlock";
import { HOW_IT_WORKS_STEPS } from "@/utils/constants";

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">
              Get started in seconds
            </h2>
            <p className="text-text-secondary text-lg">
              Three steps. That&apos;s it.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <AnimatedSection key={step.step} delay={index * 0.15}>
              <div className="text-center md:text-left">
                <span className="text-5xl font-bold text-accent/20 font-display">
                  {step.step}
                </span>
                <h3 className="text-xl font-semibold mt-2 mb-2">{step.title}</h3>
                <p className="text-text-secondary text-sm mb-4">{step.description}</p>
                {step.code && <CodeBlock code={step.code} />}
                {!step.code && (
                  <div className="aspect-video bg-bg-secondary rounded-xl border border-border-default flex items-center justify-center mt-2">
                    <span className="text-text-tertiary text-sm">Open Radar</span>
                  </div>
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
