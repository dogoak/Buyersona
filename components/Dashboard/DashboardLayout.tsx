import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSEO } from '../../hooks/useSEO';

export default function DashboardLayout() {
  useSEO({
    title: 'App - Buyersona',
    noindex: true
  });

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

