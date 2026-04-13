"use client";

import { Terminal, Globe, TreePine, Activity, Gauge, Database, HardDrive, Bot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedSection } from "../AnimatedSection";
import { FEATURES } from "@/utils/constants";

const ICON_MAP: Record<string, LucideIcon> = {
  Terminal,
  Globe,
  TreePine,
  Activity,
  Gauge,
  Database,
  HardDrive,
  Bot,
};

export const FeatureGrid = () => {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">
              Everything you need
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Eight powerful panels, one unified interface. No more switching between tools.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((feature, index) => {
            const Icon = ICON_MAP[feature.icon];
            return (
              <AnimatedSection key={feature.title} delay={index * 0.1}>
                <div className="group relative bg-bg-secondary border border-border-default rounded-2xl p-8 hover:border-border-strong transition-all duration-300 overflow-hidden">
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${feature.color}08, transparent 40%)`,
                    }}
                  />
                  <div className="relative">
                    {Icon && (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${feature.color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: feature.color }} />
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
};
