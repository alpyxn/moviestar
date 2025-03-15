import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Clock, ThumbsUp } from 'lucide-react';

interface CommentSorterProps {
  currentValue: string;
  onChange: (value: string) => void;
  showLabel?: boolean;
  className?: string;
}

export default function CommentSorter({
  currentValue = 'newest',
  onChange,
  showLabel = true,
  className = ''
}: CommentSorterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
      )}
      <Select value={currentValue} onValueChange={onChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Sort comments" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="newest" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Newest</span>
              </div>
            </SelectItem>
            <SelectItem value="oldest">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Oldest</span>
              </div>
            </SelectItem>
            <SelectItem value="likes">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                <span>Most Liked</span>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
