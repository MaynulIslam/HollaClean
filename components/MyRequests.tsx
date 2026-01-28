
import React, { useState, useEffect } from 'react';
import { CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Card, Badge, Button } from './UI';
import { ArrowLeft, Clock, MapPin, MessageSquare, Phone } from 'lucide-react';
import ReviewModal from './ReviewModal';

interface Props {
  homeownerId: string;
  onBack: () => void;
}

const MyRequests: React.FC<Props> = ({ homeownerId, onBack }) => {
  const [requests, setRequests] = useState<CleaningRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<CleaningRequest | null>(null);

  const loadRequests = async () => {
    const keys = await storage.list('request:');
    const myItems: CleaningRequest[] = [];
    for (const key of keys) {
      const req = await storage.get(key);
      if (req && req.homeownerId === homeownerId) {
        myItems.push(req);
      }
    }
    setRequests(myItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCancel = async (id: string) => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
      const req = await storage.get(`request:${id}`);
      if (req) {
        req.status = 'cancelled';
        await storage.set(`request:${id}`, req);
        loadRequests();
      }
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-semibold">Back to Overview</span>
      </button>

      <h2 className="text-4xl font-bold mb-8 font-outfit">My Cleaning Requests</h2>

      <div className="grid grid-cols-1 gap-6">
        {requests.length === 0 ? (
          <Card className="py-20 text-center">
            <p className="text-gray-400 mb-6">You haven't made any requests yet.</p>
            <Button onClick={onBack}>Create Your First Request</Button>
          </Card>
        ) : (
          requests.map(req => (
            <Card key={req.id} className="relative overflow-hidden p-0">
              {/* Header row with status and main actions */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Badge status={req.status} />
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">POSTED {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    {(req.status === 'open' || req.status === 'accepted') && (
                      <Button 
                        variant="danger" 
                        onClick={() => handleCancel(req.id)} 
                        className="w-full text-xs py-2 bg-gradient-to-r from-red-500 to-red-600 shadow-md border-none rounded-lg"
                      >
                        {req.status === 'open' ? 'Cancel Request' : 'Cancel Booking'}
                      </Button>
                    )}
                    <Button variant="secondary" className="w-full text-xs py-2 border-purple-100 text-purple-600 rounded-lg">
                      View Full Details
                    </Button>
                    {req.status === 'completed' && (
                      <Button variant="primary" onClick={() => setSelectedReq(req)} className="w-full text-xs py-2">Leave Review</Button>
                    )}
                  </div>
                </div>

                {/* Job Content */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold font-outfit mb-2">{req.serviceType}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4" /> {req.date} at {req.time}
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4" /> {req.address.split(',')[0]}
                    </div>
                  </div>
                </div>

                {/* Cleaner Details Section */}
                {req.status === 'open' ? (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-700 text-sm font-medium">
                    Waiting for a local cleaner to accept your job...
                  </div>
                ) : req.cleanerName ? (
                  <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-100">
                    <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest mb-3">CLEANER DETAILS</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg text-gray-900 leading-none mb-1">{req.cleanerName}</p>
                        <p className="text-sm text-gray-500">${req.hourlyRate}/hr • Expected: ${req.totalAmount}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-3 bg-white border border-blue-200 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          <MessageSquare className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          ))
        )}
      </div>

      {selectedReq && (
        <ReviewModal 
          request={selectedReq} 
          onClose={() => {
            setSelectedReq(null);
            loadRequests();
          }} 
        />
      )}
    </div>
  );
};

export default MyRequests;
