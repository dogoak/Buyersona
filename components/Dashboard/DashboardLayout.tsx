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
      <main className="w-full px-4 sm:px-6 lg:px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}

