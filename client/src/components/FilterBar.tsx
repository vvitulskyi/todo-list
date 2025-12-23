import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import type { TaskFilter } from '@/hooks/useTasks';

export function FilterBar({
  value,
  onChange,
}: {
  value: TaskFilter;
  onChange: (value: TaskFilter) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="task-filter">Filter</Label>
      <Select value={value} onValueChange={(v) => onChange(v as TaskFilter)}>
        <SelectTrigger id="task-filter" className="w-[180px]">
          <SelectValue placeholder="Select filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}


