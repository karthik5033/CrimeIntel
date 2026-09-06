/**
 * Entity Resolution Review Queue
 * Phase 0.3 Exit Criterion #2: Human review queue with merge/reject actions
 * 
 * Role-gated to Inspector+ (per Phase 0.14 Human Feedback Loop)
 */

import { Suspense } from 'react';
import { ReviewQueueClient } from './ReviewQueueClient';

export const metadata = {
  title: 'Entity Review Queue | CrimeIntel',
  description: 'Review and approve/reject entity resolution suggestions',
};

export default function EntityReviewPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entity Review Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review entity resolution suggestions before they're applied to the system
          </p>
        </div>
      </div>

      <Suspense fallback={<ReviewQueueSkeleton />}>
        <ReviewQueueClient />
      </Suspense>
    </div>
  );
}

function ReviewQueueSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}
