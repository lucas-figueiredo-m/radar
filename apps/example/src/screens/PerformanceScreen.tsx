import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import ScreenContainer from '../components/ScreenContainer';
import SectionGroup from '../components/SectionGroup';

const fibonacci = (n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

const primeCount = (limit: number): number => {
  let count = 0;
  for (let i = 2; i <= limit; i++) {
    let isPrime = true;
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) count++;
  }
  return count;
};

const matrixMultiply = (size: number): number => {
  const a: number[][] = [];
  const b: number[][] = [];
  const result: number[][] = [];

  for (let i = 0; i < size; i++) {
    a[i] = [];
    b[i] = [];
    result[i] = [];
    for (let j = 0; j < size; j++) {
      a[i][j] = Math.random();
      b[i][j] = Math.random();
      result[i][j] = 0;
    }
  }

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result[0][0];
};

const CPU_OPTIONS = [
  {
    title: 'Fibonacci(35)',
    subtitle: 'Recursive fibonacci - moderate CPU load',
    color: '#f59e0b',
    run: () => {
      const start = Date.now();
      const result = fibonacci(35);
      const elapsed = Date.now() - start;
      console.log(`Fibonacci(35) = ${result} in ${elapsed}ms`);
    },
  },
  {
    title: 'Fibonacci(40)',
    subtitle: 'Recursive fibonacci - heavy CPU load',
    color: '#ef4444',
    run: () => {
      const start = Date.now();
      const result = fibonacci(40);
      const elapsed = Date.now() - start;
      console.log(`Fibonacci(40) = ${result} in ${elapsed}ms`);
    },
  },
  {
    title: 'Count primes to 500K',
    subtitle: 'Sieve-like prime counting - sustained CPU',
    color: '#8b5cf6',
    run: () => {
      const start = Date.now();
      const count = primeCount(500_000);
      const elapsed = Date.now() - start;
      console.log(`Found ${count} primes under 500K in ${elapsed}ms`);
    },
  },
  {
    title: 'Matrix multiply 200x200',
    subtitle: 'Dense matrix multiplication - CPU + memory',
    color: '#3b82f6',
    run: () => {
      const start = Date.now();
      matrixMultiply(200);
      const elapsed = Date.now() - start;
      console.log(`200x200 matrix multiply in ${elapsed}ms`);
    },
  },
];

const MEMORY_OPTIONS = [
  {
    title: 'Allocate 10MB strings',
    subtitle: 'Create large string arrays in memory',
    color: '#10b981',
    run: () => {
      const start = Date.now();
      const chunks: string[] = [];
      for (let i = 0; i < 100; i++) {
        chunks.push('x'.repeat(100_000));
      }
      const elapsed = Date.now() - start;
      console.log(
        `Allocated ${chunks.length} chunks (10MB) in ${elapsed}ms`,
      );
    },
  },
  {
    title: 'Allocate 50MB objects',
    subtitle: 'Create many objects to trigger GC pressure',
    color: '#f97316',
    run: () => {
      const start = Date.now();
      const objects: Record<string, number>[] = [];
      for (let i = 0; i < 500_000; i++) {
        objects.push({ id: i, value: Math.random(), hash: i * 31 });
      }
      const elapsed = Date.now() - start;
      console.log(
        `Allocated ${objects.length} objects (~50MB) in ${elapsed}ms`,
      );
    },
  },
  {
    title: 'Rapid alloc/dealloc cycle',
    subtitle: 'Allocate and discard in a loop to trigger GC',
    color: '#ec4899',
    run: () => {
      const start = Date.now();
      for (let cycle = 0; cycle < 20; cycle++) {
        const temp: number[][] = [];
        for (let i = 0; i < 10_000; i++) {
          temp.push(Array.from({ length: 100 }, (_, j) => j * Math.random()));
        }
      }
      const elapsed = Date.now() - start;
      console.log(`20 alloc/dealloc cycles in ${elapsed}ms`);
    },
  },
];

const PerformanceScreen = () => {
  const [running, setRunning] = useState<string | null>(null);
  const blockingRef = useRef(false);

  const runTask = useCallback(
    (title: string, run: () => void) => {
      if (blockingRef.current) return;
      blockingRef.current = true;
      setRunning(title);

      requestAnimationFrame(() => {
        try {
          run();
        } catch (err) {
          console.error(`${title} failed:`, err);
        }
        blockingRef.current = false;
        setRunning(null);
      });
    },
    [],
  );

  const runSustainedLoad = useCallback(() => {
    if (blockingRef.current) return;
    blockingRef.current = true;
    setRunning('Sustained load');

    let iteration = 0;
    const total = 10;

    const tick = () => {
      if (iteration >= total) {
        console.log(`Sustained load complete: ${total} iterations`);
        blockingRef.current = false;
        setRunning(null);
        return;
      }

      fibonacci(33);
      matrixMultiply(100);

      const temp: number[] = [];
      for (let i = 0; i < 100_000; i++) {
        temp.push(Math.random());
      }

      iteration++;
      console.log(`Sustained load iteration ${iteration}/${total}`);
      setTimeout(tick, 50);
    };

    requestAnimationFrame(tick);
  }, []);

  return (
    <ScreenContainer
      title="Performance"
      subtitle="Heavy computations to stress CPU, memory, and FPS"
    >
      {running && (
        <View style={styles.runningBanner}>
          <Text style={styles.runningText}>Running: {running}...</Text>
        </View>
      )}

      <SectionGroup title="CPU Intensive">
        {CPU_OPTIONS.map(option => (
          <ActionButton
            key={option.title}
            title={option.title}
            subtitle={option.subtitle}
            color={option.color}
            onPress={() => runTask(option.title, option.run)}
          />
        ))}
      </SectionGroup>

      <SectionGroup title="Memory Pressure">
        {MEMORY_OPTIONS.map(option => (
          <ActionButton
            key={option.title}
            title={option.title}
            subtitle={option.subtitle}
            color={option.color}
            onPress={() => runTask(option.title, option.run)}
          />
        ))}
      </SectionGroup>

      <SectionGroup title="Combined Stress">
        <ActionButton
          title="Sustained load (10 iterations)"
          subtitle="Fibonacci + matrix + allocation in a loop with pauses"
          color="#f43f5e"
          onPress={runSustainedLoad}
        />
        <ActionButton
          title="Everything at once"
          subtitle="CPU + memory + network simultaneously"
          color="#d946ef"
          onPress={() =>
            runTask('Everything at once', () => {
              fibonacci(35);
              matrixMultiply(150);
              const chunks: string[] = [];
              for (let i = 0; i < 200; i++) {
                chunks.push('x'.repeat(100_000));
              }
              for (let i = 1; i <= 5; i++) {
                fetch(`https://jsonplaceholder.typicode.com/posts/${i}`)
                  .then(r => r.json())
                  .then(d => console.log(`Stress fetch #${i}:`, d.title))
                  .catch(err => console.error(`Stress fetch failed:`, err));
              }
              console.log(
                `Everything at once: fib + matrix + ${chunks.length} chunks + 5 fetches`,
              );
            })
          }
        />
      </SectionGroup>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  runningBanner: {
    backgroundColor: '#1e293b',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  runningText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default PerformanceScreen;
