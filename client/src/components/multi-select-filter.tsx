import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface MultiSelectFilterProps {
  title: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectFilter({
  title,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options..."
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newSelection);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return selectedValues[0];
    if (selectedValues.length === options.length) return "All";
    return `${selectedValues.length} selected`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-zinc-900 border-zinc-700">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">{title}</span>
            {selectedValues.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange([])}
                className="h-6 px-2 text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {options.map((option) => (
              <div
                key={option}
                className="flex items-center space-x-2 p-2 rounded hover:bg-zinc-800 cursor-pointer"
                onClick={() => handleToggle(option)}
              >
                <Checkbox
                  checked={selectedValues.includes(option)}
                  onChange={() => handleToggle(option)}
                  className="border-zinc-600"
                />
                <span className="text-sm text-white flex-1">{option}</span>
                {selectedValues.includes(option) && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}