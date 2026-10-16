import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { ContextDisplay } from '@/components/ContextDisplay';

export default function Home() {
  return (
    <div className="relative">
      <Hero />
      <ContextDisplay />
      <Features />
    </div>
  );
}
