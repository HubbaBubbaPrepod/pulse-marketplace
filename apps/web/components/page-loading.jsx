'use client';
import { ViewTransition } from 'react';
import { useParams } from 'next/navigation';
import { CatalogSkeleton } from './skeleton';
export default function Loading() {
  const params = useParams();
  return (
    <ViewTransition exit="slide-down" default="none">
      <div className="page-container">
        <CatalogSkeleton lang={params.lang === 'en' ? 'en' : 'ru'} />
      </div>
    </ViewTransition>
  );
}
