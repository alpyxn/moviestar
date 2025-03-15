import { Loader2 } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="flex justify-center items-center h-[70vh]">
      <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      <span className="ml-2">Loading user profile...</span>
    </div>
  );
}
