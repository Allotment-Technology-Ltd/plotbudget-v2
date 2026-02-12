'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

export interface PricingAmountSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function PricingAmountSelector({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.5,
}: PricingAmountSelectorProps) {
  const [inputValue, setInputValue] = useState(value.toFixed(2));

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0];
    onChange(newValue);
    setInputValue(newValue.toFixed(2));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);

    const numValue = parseFloat(rawValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    // Ensure valid value on blur
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue < min) {
      setInputValue(min.toFixed(2));
      onChange(min);
    } else if (numValue > max) {
      setInputValue(max.toFixed(2));
      onChange(max);
    } else {
      setInputValue(numValue.toFixed(2));
      onChange(numValue);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Choose your monthly contribution
        </label>

        {/* Slider */}
        <div className="px-2 mb-6">
          <Slider
            value={[value]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>£{min}</span>
            <span>£{max}</span>
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg border border-border p-3">
          <span className="text-sm font-medium text-muted-foreground">£</span>
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            className="flex-1 text-center font-heading text-2xl border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
      </div>

      {/* Simple supportive message */}
      <p className="text-xs text-center text-muted-foreground">
        {value === 0
          ? 'Use PLOT Premium for free'
          : 'Thank you for supporting PLOT development'}
      </p>
    </div>
  );
}
