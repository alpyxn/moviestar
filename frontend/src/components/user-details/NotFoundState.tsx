import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface NotFoundStateProps {
  error: string | null;
  username?: string;
}

export default function NotFoundState({ error, username }: NotFoundStateProps) {
  const isNotFoundError = error?.toLowerCase().includes('not found');
  
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">
        {isNotFoundError ? 'User Not Found' : 'Error'}
      </h1>
      <p className="text-gray-500 mb-6">
        {error || `The user "${username}" could not be found.`}
      </p>
      <Button
        variant="outline"
        onClick={() => window.history.back()}
        className="mr-2"
      >
        Go Back
      </Button>
      <Button asChild>
        <Link to="/movies">Browse Movies</Link>
      </Button>
    </div>
  );
}
