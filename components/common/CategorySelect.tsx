import React from 'react';

const categories = [
  { value: 'food', label: 'Alimentação' },
  { value: 'transport', label: 'Transporte' },
  { value: 'accommodation', label: 'Hospedagem' },
  { value: 'entertainment', label: 'Entretenimento' },
  { value: 'other', label: 'Outros' },
];

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CategorySelect({
  value,
  onChange,
  className = '',
}: CategorySelectProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-dark mb-2" htmlFor="category">
        Categoria
      </label>
      <select
        id="category"
        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {categories.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CategorySelect;
