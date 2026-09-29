import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <p className="text-5xl font-semibold text-primary">404</p>
      <h1 className="mt-2 text-xl font-semibold text-secondary">Page not found</h1>
      <p className="mt-1 text-sm text-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="mt-4">
        <Button size="sm">Back to home</Button>
      </Link>
    </div>
  );
}

export default NotFoundPage;
