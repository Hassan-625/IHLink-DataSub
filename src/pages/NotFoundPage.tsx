import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Home, Search } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold gradient-text mb-4">404</div>
        <h1 className="text-2xl font-bold text-ink mb-2">Page Not Found</h1>
        <p className="text-sm text-muted mb-8">The page you're looking for doesn't exist or has been moved. Let's get you back on track.</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/"><Button leftIcon={<Home className="w-4 h-4" />}>Go Home</Button></Link>
          <Link to="/design-index"><Button variant="secondary" leftIcon={<Search className="w-4 h-4" />}>Design Index</Button></Link>
        </div>
      </div>
    </div>
  );
}
