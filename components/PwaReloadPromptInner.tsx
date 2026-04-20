import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PwaReloadPromptInner() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-[100] animate-fade-in-up">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 max-w-sm w-full mx-auto sm:mx-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 bg-indigo-600 h-full"></div>
        <div className="flex flex-col gap-3 ml-2">
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              {offlineReady ? 'Modo Offline' : 'Actualización disponible'}
            </h4>
            <p className="text-sm text-slate-500 mt-1">
              {offlineReady
                ? 'App instalada para cargar más rápido sin conexión.'
                : 'Hay una nueva versión de Buyersona. Actualizá para ver las mejoras.'}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 hover:shadow-md transition flex-1"
              >
                Actualizar ahora
              </button>
            )}
            <button
              onClick={() => close()}
              className="text-slate-500 font-bold text-sm px-4 py-2 hover:bg-slate-100 rounded-xl transition flex-1 text-center"
            >
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
