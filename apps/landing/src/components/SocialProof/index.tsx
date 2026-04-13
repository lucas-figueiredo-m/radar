import { AnimatedSection } from '../AnimatedSection';

const TECHS = ['React Native', 'Expo', 'Hermes', 'TypeScript'];

export const SocialProof = () => {
  return (
    <section className="py-16 border-y border-border-subtle">
      <AnimatedSection>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-text-tertiary text-xs uppercase tracking-[0.2em] font-medium mb-8">
            Built for React Native developers
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {TECHS.map(tech => (
              <span
                key={tech}
                className="text-text-secondary/60 text-lg font-medium font-display"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
};
