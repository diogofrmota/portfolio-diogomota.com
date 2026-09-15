'use client';

import { useEffect, useState } from 'react';
import { appSections } from '../../lib/app-sections';

export default function useAppSection(app) {
  const sections = appSections[app].sections;
  const [active, setActive] = useState(sections[0][0]);
  useEffect(() => {
    const update = () => {
      const id = window.location.hash.slice(1);
      setActive(sections.some(([key]) => key === id) ? id : sections[0][0]);
    };
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, [sections]);
  return [active, (id) => { window.location.hash = id; setActive(id); }];
}
