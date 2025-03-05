import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber, formatCurrency } from '../i18n';

const ExampleUsage = () => {
  const { t } = useTranslation();
  const efficiency = 85.75;
  const price = 1250.99;

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.description')}</p>

      <button>{t('nesting.startNesting')}</button>

      <div>
        {/* Translation with variable interpolation */}
        <p>{t('nesting.timeTaken', { time: 45 })}</p>

        {/* Formatted numbers */}
        <p>{t('nesting.efficiency')}: {formatNumber(efficiency, { maximumFractionDigits: 2 })}%</p>

        {/* Currency formatting */}
        <p>Total: {formatCurrency(price)}</p>
      </div>
    </div>
  );
};

export default ExampleUsage;
