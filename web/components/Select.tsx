import React from "react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function Select({
  name,
  value,
  defaultValue,
  options,
  placeholder,
  className = "",
  onChange,
  required,
  disabled,
}: SelectProps) {
  const baseClasses =
    "h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50 disabled:text-neutral-400";

  return (
    <select
      name={name}
      value={value}
      defaultValue={defaultValue}
      className={`${baseClasses} ${className}`}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      required={required}
      disabled={disabled}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface SelectCardProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SelectCards({
  name,
  value,
  defaultValue,
  options,
  onChange,
  required,
  disabled,
  className = "",
}: SelectCardProps) {
  const [selectedValue, setSelectedValue] = React.useState(
    value || defaultValue || "",
  );

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    setSelectedValue(optionValue);
    onChange?.(optionValue);
  };

  return (
    <div className={`grid gap-3 ${className}`}>
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={selectedValue}
        required={required}
      />

      {options.map((option) => (
        <div
          key={option.value}
          className={`card p-4 border-2 transition-all cursor-pointer ${
            selectedValue === option.value
              ? "border-black bg-neutral-50 ring-1 ring-black/5"
              : "border-neutral-200 hover:border-neutral-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => handleSelect(option.value)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{option.label}</div>
              {option.description && (
                <div className="text-xs text-neutral-600 mt-1">
                  {option.description}
                </div>
              )}
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                selectedValue === option.value
                  ? "border-black bg-black"
                  : "border-neutral-300"
              }`}
            >
              {selectedValue === option.value && (
                <div className="w-1.5 h-1.5 bg-white rounded-full m-0.5" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
