import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  noindex?: boolean;
}

export function useSEO({
  title = 'Buyersona',
  description = 'Descubrí a tu cliente ideal, la mejor forma de captarlo y analiza a tu competencia con IA.',
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    // Título de la página
    document.title = title;

    // Etiqueta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Indexación y bots (PWA/SPA handling)
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (metaRobots) {
        metaRobots.setAttribute('content', 'noindex, nofollow');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, nofollow';
        document.head.appendChild(meta);
      }
    } else {
      // Remover noindex si es público y el componente lo desmonta
      if (metaRobots) {
        metaRobots.removeAttribute('content');
        metaRobots.remove();
      }
    }
  }, [title, description, noindex]);
}
