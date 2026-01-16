import React from 'react';
import styles from './CategorySelect.module.css';

type Category = 'food' | 'transport' | 'accommodation' | 'entertainment' | 'other';

interface CategorySelectProps {
  value: Category;
  onChange: (category: Category) => void;
}

const categories = [
  { value: 'food' as Category, label: ' Comida', emoji: '' },
  { value: 'transport' as Category, label: ' Transporte', emoji: '' },
  { value: 'accommodation' as Category, label: ' Hospedagem', emoji: '' },
  { value: 'entertainment' as Category, label: ' Entretenimento', emoji: '' },
  { value: 'other' as Category, label: ' Outro', emoji: '' },
];

export const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange }) => {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Categoria</label>
      <div className={styles.grid}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            className={`${styles.categoryButton} ${value === cat.value ? styles.selected : ''}`}
            onClick={() => onChange(cat.value)}
            title={cat.label}
          >
            <span className={styles.emoji}>{cat.emoji}</span>
            <span className={styles.name}>{cat.label.split(' ')[1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
// components/common/CategorySelect.tsx

import React from 'react';
import styles from './CategorySelect.module.css';

type Category = 'food' | 'transport' | 'accommodation' | 'entertainment' | 'other';

interface CategorySelectProps {
  value: Category;
  onChange: (category: Category) => void;
}

const categories = [
  { value: 'food' as Category, label: ' Comida', emoji: '' },
  { value: 'transport' as Category, label: ' Transporte', emoji: '' },
  { value: 'accommodation' as Category, label: ' Hospedagem', emoji: '' },
  { value: 'entertainment' as Category, label: ' Entretenimento', emoji: '' },
  { value: 'other' as Category, label: ' Outro', emoji: '' },
];

export const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange }) => {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Categoria</label>
      <div className={styles.grid}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            className={`${styles.categoryButton} ${value === cat.value ? styles.selected : ''}`}
            onClick={() => onChange(cat.value)}
            title={cat.label}
          >
            <span className={styles.emoji}>{cat.emoji}</span>
            <span className={styles.name}>{cat.label.split(' ')[1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
