'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Download, BookOpen } from 'lucide-react';
import { AnimatedSection } from '../AnimatedSection';
import { GradientText } from '../GradientText';
import { DOWNLOAD_URL } from '@/utils/constants';

export const Hero = () => {
  const screenshotRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: screenshotRef,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <AnimatedSection>
          <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-6">
            Debug React Native.
            <br />
            <GradientText>Visually.</GradientText>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            One tool to replace React DevTools, Flipper, and Reactotron.
            Console, network, components, profiler, performance, state, storage
            — unified and AI-ready.
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
              href="/docs"
              className="flex items-center gap-2 border border-border-default hover:bg-bg-surface text-text-primary rounded-xl px-8 py-3 font-semibold transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              View Documentation
            </a>
          </div>
        </AnimatedSection>

        {/* Product screenshot placeholder */}
        <AnimatedSection delay={0.3}>
          <motion.div
            ref={screenshotRef}
            style={{ y }}
            className="mt-16 max-w-4xl mx-auto aspect-video bg-bg-secondary rounded-2xl border border-border-default shadow-[0_0_60px_rgba(108,108,255,0.15)] flex items-center justify-center"
          >
            <span className="text-text-tertiary text-lg">
              Product Screenshot
            </span>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
};
