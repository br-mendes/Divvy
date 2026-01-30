'use client';

import * as React from 'react';
import styles from './HeroVideo.module.css';

export default function HeroVideo() {
  return (
    <div
      className={[
        'relative w-full max-w-xl rounded-3xl border border-gray-200 bg-white shadow-xl',
        'ring-1 ring-black/5',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="text-sm font-semibold text-gray-900">Demo</div>
          <div className="text-xs text-gray-500">divisao automatica</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-brand-500" />
          ao vivo
        </div>
      </div>

      <div
        className={[
          styles.frame,
          'relative grid grid-cols-2 gap-4 p-5',
          'bg-gradient-to-br from-brand-50 via-white to-indigo-50',
        ].join(' ')}
      >
        <div className={styles.scanLine} />

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Despesas</div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">Supermercado</div>
              <div className="font-mono text-sm text-gray-900">R$ 186,40</div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-brand-500" />
              pago por Ana
              <span className="opacity-50">•</span>
              dividido em 4
            </div>
          </div>

          <div className={['rounded-2xl border border-gray-200 bg-white p-4 shadow-sm', styles.chip].join(' ')}>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">Gasolina</div>
              <div className="font-mono text-sm text-gray-900">R$ 240,00</div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              pago por Bruno
              <span className="opacity-50">•</span>
              dividido por shares
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Saldos</div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">Ana</div>
              <div className="text-sm font-bold text-emerald-600">+ R$ 72,15</div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-2/3 rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">Carlos</div>
              <div className="text-sm font-bold text-red-600">- R$ 41,30</div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-1/3 rounded-full bg-red-500" />
            </div>
          </div>

          <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sugestao</div>
            <div className="mt-2 text-sm text-gray-800">
              Carlos paga <span className="font-semibold">R$ 41,30</span> para Ana
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Log</div>
            <div className="mt-2 h-20 overflow-hidden">
              <div className={[styles.ticker, 'space-y-2 text-xs text-gray-500'].join(' ')}>
                <div>+ despesa adicionada</div>
                <div>+ splits calculados</div>
                <div>+ saldos atualizados</div>
                <div>+ convite enviado</div>
                <div>+ despesa adicionada</div>
                <div>+ splits calculados</div>
                <div>+ saldos atualizados</div>
                <div>+ convite enviado</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
