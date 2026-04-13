import { Smartphone, Monitor, Wifi } from 'lucide-react';
import { AnimatedSection } from '../AnimatedSection';

const HIGHLIGHTS = [
  {
    icon: 'Wifi',
    title: 'Auto-Detection',
    description: 'Radar automatically discovers devices on your network.',
  },
  {
    icon: 'Monitor',
    title: 'Multi-Device Selector',
    description: 'Switch between connected devices with a single click.',
  },
  {
    icon: 'Smartphone',
    title: 'Per-Device Filtering',
    description: 'Filter logs and network requests by device.',
  },
];

const ICON_MAP: Record<string, typeof Wifi> = { Wifi, Monitor, Smartphone };

export const MultiDevice = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <AnimatedSection>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">
            Debug any device, any platform
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            Seamless multi-device debugging for iOS and Android.
          </p>
          <div className="flex items-center justify-center gap-3 mb-16">
            <span className="px-4 py-1.5 rounded-full border border-border-default bg-bg-surface text-sm font-medium">
              iOS
            </span>
            <span className="px-4 py-1.5 rounded-full border border-border-default bg-bg-surface text-sm font-medium">
              Android
            </span>
            <span className="px-4 py-1.5 rounded-full border border-border-default bg-bg-surface text-sm font-medium">
              Expo
            </span>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HIGHLIGHTS.map((item, index) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <AnimatedSection key={item.title} delay={index * 0.1}>
                <div className="p-6">
                  {Icon && (
                    <Icon className="w-8 h-8 text-accent mx-auto mb-4" />
                  )}
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-text-secondary text-sm">
                    {item.description}
                  </p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
};
