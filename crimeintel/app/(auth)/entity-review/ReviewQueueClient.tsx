'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle, User, Phone, Car, MapPin, Calendar } from 'lucide-react';

interface PersonRecord {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  vehicle?: string;
  address?: string;
  last_fir_date?: string;
  fir_count?: number;
}

interface MergeCandidate {
  id: string;
  records: PersonRecord[];
  confidence: number;
  resolution_method: 'deterministic' | 'fuzzy' | 'contextual' | 'ml';
  evidence: {
    phone_match?: boolean;
    vehicle_match?: boolean;
    name_similarity?: number;
    address_similarity?: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export function ReviewQueueClient() {
  const [candidates, setCandidates] = useState<MergeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockCandidates: MergeCandidate[] = [
        {
          id: 'MC001',
          records: [
            {
              id: 'P001',
              name: 'Rajesh Kumar Sharma',
              age: 35,
              gender: 'M',
              phone: '9876543210',
              vehicle: 'KA01AB1234',
              address: 'Whitefield, Bengaluru',
              fir_count: 3,
              last_fir_date: '2026-01-15'
            },
            {
              id: 'P002',
              name: 'Rajesh K Sharma',
              age: 35,
              phone: '9876543210',
              vehicle: 'KA01AB1234',
              address: 'Whitefield, Bangalore',
              fir_count: 2,
              last_fir_date: '2026-02-10'
            },
            {
              id: 'P003',
              name: 'R K Sharma',
              age: 36,
              vehicle: 'KA01AB1234',
              address: 'Whitefield',
              fir_count: 1,
              last_fir_date: '2026-03-05'
            }
          ],
          confidence: 0.95,
          resolution_method: 'deterministic',
          evidence: {
            phone_match: true,
            vehicle_match: true,
            name_similarity: 0.88
          },
          status: 'pending',
          created_at: '2026-07-20T10:30:00Z'
        },
        {
          id: 'MC002',
          records: [
            {
              id: 'P004',
              name: 'Suresh Babu Reddy',
              age: 42,
              gender: 'M',
              phone: '9988776655',
              vehicle: 'KA02CD5678',
              address: 'Indiranagar, Bengaluru',
              fir_count: 2
            },
            {
              id: 'P005',
              name: 'Suresh B Reddy',
              age: 42,
              phone: '9988776655',
              address: 'Indiranagar, Bangalore',
              fir_count: 1
            }
          ],
          confidence: 0.89,
          resolution_method: 'fuzzy',
          evidence: {
            phone_match: true,
            name_similarity: 0.92,
            address_similarity: 0.95
          },
          status: 'pending',
          created_at: '2026-07-19T14:20:00Z'
        },
        {
          id: 'MC003',
          records: [
            {
              id: 'P006',
              name: 'Anil Sharma',
              age: 28,
              phone: '9678901234',
              vehicle: 'KA08OP9012',
              address: 'Yelahanka, Bengaluru'
            },
            {
              id: 'P007',
              name: 'Sunil Sharma',
              age: 30,
              phone: '9678901234',
              vehicle: 'KA09QR3456',
              address: 'Hebbal, Bengaluru'
            }
          ],
          confidence: 0.72,
          resolution_method: 'contextual',
          evidence: {
            phone_match: true,
            name_similarity: 0.85,
            address_similarity: 0.4
          },
          status: 'pending',
          created_at: '2026-07-18T09:15:00Z'
        }
      ];

      setCandidates(mockCandidates);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(candidateId: string) {
    try {
      // TODO: API call to approve merge
      console.log('Approving merge:', candidateId);
      
      setCandidates(prev =>
        prev.map(c => c.id === candidateId ? { ...c, status: 'approved' as const } : c)
      );
      
      // Show success notification
      alert('✅ Merge approved successfully');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('❌ Failed to approve merge');
    }
  }

  async function handleReject(candidateId: string) {
    try {
      // TODO: API call to reject merge
      console.log('Rejecting merge:', candidateId);
      
      setCandidates(prev =>
        prev.map(c => c.id === candidateId ? { ...c, status: 'rejected' as const } : c)
      );
      
      alert('✅ Merge rejected successfully');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('❌ Failed to reject merge');
    }
  }

  async function handleNeedsMoreInfo(candidateId: string) {
    // TODO: Implement escalation to DCP/Admin (Phase 0.14)
    alert('🔼 Escalated for additional review');
  }

  const filteredCandidates = filter === 'all' 
    ? candidates 
    : candidates.filter(c => c.status === filter);

  const pendingCount = candidates.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              Pending {pendingCount > 0 && <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No items in {filter} queue</p>
            <p className="text-sm mt-2">All entity resolution suggestions have been reviewed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map(candidate => (
            <MergeCandidateCard
              key={candidate.id}
              candidate={candidate}
              onApprove={handleApprove}
              onReject={handleReject}
              onNeedsMoreInfo={handleNeedsMoreInfo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MergeCandidateCard({
  candidate,
  onApprove,
  onReject,
  onNeedsMoreInfo
}: {
  candidate: MergeCandidate;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onNeedsMoreInfo: (id: string) => void;
}) {
  const confidenceColor = candidate.confidence >= 0.9 ? 'text-green-600' :
    candidate.confidence >= 0.75 ? 'text-amber-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Merge Suggestion: {candidate.records.length} Records
            </CardTitle>
            <CardDescription className="mt-2">
              {candidate.records.map(r => r.name).join(' • ')}
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge variant={candidate.status === 'pending' ? 'outline' : 
              candidate.status === 'approved' ? 'default' : 'destructive'}>
              {candidate.status}
            </Badge>
            <p className={`text-sm font-semibold mt-2 ${confidenceColor}`}>
              {(candidate.confidence * 100).toFixed(0)}% confidence
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Evidence Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-3">Evidence for Merge:</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {candidate.evidence.phone_match && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Exact phone match</span>
              </div>
            )}
            {candidate.evidence.vehicle_match && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Vehicle match</span>
              </div>
            )}
            {candidate.evidence.name_similarity && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Name similarity: {(candidate.evidence.name_similarity * 100).toFixed(0)}%</span>
              </div>
            )}
            {candidate.evidence.address_similarity && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Address similarity: {(candidate.evidence.address_similarity * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Method: <Badge variant="outline" className="text-xs">{candidate.resolution_method}</Badge>
          </p>
        </div>

        {/* Records Comparison */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Records to Merge:</h4>
          <div className="grid gap-3">
            {candidate.records.map((record, idx) => (
              <div key={record.id} className="border rounded-lg p-3 bg-card">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium">{record.name}</p>
                  <Badge variant="secondary" className="text-xs">#{idx + 1}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {record.age && (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      Age {record.age}
                    </div>
                  )}
                  {record.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {record.phone}
                    </div>
                  )}
                  {record.vehicle && (
                    <div className="flex items-center gap-2">
                      <Car className="h-3 w-3" />
                      {record.vehicle}
                    </div>
                  )}
                  {record.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {record.address}
                    </div>
                  )}
                  {record.fir_count !== undefined && (
                    <div className="col-span-2 flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      {record.fir_count} FIR{record.fir_count !== 1 ? 's' : ''}
                      {record.last_fir_date && ` (last: ${new Date(record.last_fir_date).toLocaleDateString()})`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {candidate.status === 'pending' && (
        <CardFooter className="flex gap-3">
          <Button
            onClick={() => onApprove(candidate.id)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve Merge
          </Button>
          <Button
            onClick={() => onReject(candidate.id)}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() => onNeedsMoreInfo(candidate.id)}
            variant="outline"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Needs Review
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
