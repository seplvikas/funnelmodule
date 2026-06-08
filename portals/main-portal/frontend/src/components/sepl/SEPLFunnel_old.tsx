import React, { useState, useEffect } from 'react';
import { usersApi, seplApi } from '../../services/api';
import { Plus, RefreshCw, Loader, ChevronDown, ChevronRight, Trash2, ArrowRight, Archive } from 'lucide-react';
import { OpportunityFormV2 } from './OpportunityFormV2';
import { OwnerAssignmentModal } from './OwnerAssignmentModal';

interface User {
  id: number;
  email: string;
  name: string;
}

interface Opportunity {
  id: number;
  customer_name: string;
  customer_alias: string;
  state: string;
  city: string;
  tender_name: string;
  tender_number: string;
  requirement_type: string;
  eligible: boolean;
  pre_bid_date: string;
  due_date: string;
  submission_end_date: string;
  estimated_value: number;
  contract_year: number;
  contract_month: number;
  ra: boolean;
  emd: boolean;
  emd_value: string;
  product_name: string;
  oem_name: string;
  quantity: number;
  oic_name: string;
  remarks: string;
  current_stage: string;
  status: string;
  created_at: string;
  case_owner_name: string;
  case_owner_email: string;
}

type TabType = 'Bucket' | 'On Going' | 'Archived';

interface OwnerAssignmentState {
  show: boolean;
  opportunityId: number | null;
  opportunityName: string;
}

export function SEPLFunnel() {
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [bucketCount, setBucketCount] = useState(0);
  const [ongoingCount, setOngoingCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('Bucket');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownerAssignment, setOwnerAssignment] = useState<OwnerAssignmentState>({
    show: false,
    opportunityId: null,
    opportunityName: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOpportunities(activeTab);
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [usersRes, bucketRes, ongoingRes, archivedRes] = await Promise.all([
        usersApi.listAll(),
        seplApi.listOpportunities(undefined, 'Bucket'),
        seplApi.listOpportunities(undefined, 'On Going'),
        seplApi.listOpportunities(undefined, 'Archived')
      ]);
      setUsers(usersRes?.data || []);
      setBucketCount(bucketRes?.data?.length || 0);
      setOngoingCount(ongoingRes?.data?.length || 0);
      setArchivedCount(archivedRes?.data?.length || 0);
      setOpportunities(bucketRes?.data || []);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunities = async (status: TabType) => {
    try {
      setRefreshing(true);
      const oppsRes = await seplApi.listOpportunities(undefined, status);
      setOpportunities(oppsRes?.data || []);
    } catch (err) {
      console.error('Error loading opportunities:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshCounts = async () => {
    try {
      const [bucketRes, ongoingRes, archivedRes] = await Promise.all([
        seplApi.listOpportunities(undefined, 'Bucket'),
        seplApi.listOpportunities(undefined, 'On Going'),
        seplApi.listOpportunities(undefined, 'Archived')
      ]);
      setBucketCount(bucketRes?.data?.length || 0);
      setOngoingCount(ongoingRes?.data?.length || 0);
      setArchivedCount(archivedRes?.data?.length || 0);
    } catch (err) {
      console.error('Error refreshing counts:', err);
    }
  };

  const handleFormSave = async () => {
    setShowCreateForm(false);
    await loadOpportunities('Bucket');
    await refreshCounts();
    setActiveTab('Bucket');
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    
    try {
      await seplApi.deleteOpportunity(id);
      await loadOpportunities(activeTab);
      await refreshCounts();
      alert('Opportunity deleted successfully');
    } catch (err: any) {
      console.error('Error deleting opportunity:', err);
      alert('Error: ' + (err.response?.data?.error || 'Failed to delete opportunity'));
    }
  };


  const handleMoveToOngoing = (opportunityId: number, opportunityName: string) => {
    // Show owner assignment modal when moving from Bucket to Ongoing
    setOwnerAssignment({
      show: true,
      opportunityId,
      opportunityName
    });
  };

  const handleOwnerAssigned = async (owner: any) => {
    if (!ownerAssignment.opportunityId) return;

    try {
      console.log('Assigning owner:', owner, 'to opportunity:', ownerAssignment.opportunityId);
      
      // Update opportunity with owner and move to Ongoing
      // Send both assigned_owner fields (for backend validation) and case_owner fields (for display)
      const updateData = {
        status: 'On Going',
        case_owner_email: owner.email,
        case_owner_name: owner.name,
        assigned_owner_email: owner.email,
        assigned_owner_name: owner.name,
        assigned_owner_id: owner.id || 0
      };
      
      console.log('Sending update data:', updateData);
      const response = await seplApi.updateOpportunity(ownerAssignment.opportunityId, updateData);
      console.log('Update response:', response);

      // Close modal and refresh
      setOwnerAssignment({ show: false, opportunityId: null, opportunityName: '' });
      await loadOpportunities(activeTab);
      await refreshCounts();
      alert(`✓ Opportunity moved to Ongoing with owner: ${owner.name}`);
    } catch (err: any) {
      console.error('Error assigning owner and moving:', err);
      const errorMsg = err.response?.data?.error || (err instanceof Error ? err.message : String(err));
      alert('Failed to move: ' + errorMsg);
      throw err; // Re-throw for modal to handle
    }
  };
  const handleMove = async (id: number, toStatus: TabType) => {
    try {
      await seplApi.updateOpportunity(id, { status: toStatus });
      await loadOpportunities(activeTab);
      await refreshCounts();
      alert(`Opportunity moved to ${toStatus} successfully`);
    } catch (err: any) {
      console.error('Error moving opportunity:', err);
      alert('Error: ' + (err.response?.data?.error || 'Failed to move opportunity'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                SEPL Sales Funnel
              </h1>
              <p className="text-gray-600 text-lg">Track and manage your sales opportunities through the pipeline</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { loadOpportunities(activeTab); refreshCounts(); }}
                disabled={refreshing}
                className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 font-medium"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                New Opportunity
              </button>
            </div>
          </div>

          {/* Modern Tab Pills */}
          <div className="flex gap-3 bg-white rounded-2xl p-2 shadow-lg">
            <button
              onClick={() => setActiveTab('Bucket')}
              className={`flex-1 px-8 py-4 rounded-xl font-bold text-base transition-all ${
                activeTab === 'Bucket'
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span>Bucket</span>
                <span className={`text-sm font-normal ${activeTab === 'Bucket' ? 'opacity-90' : 'opacity-60'}`}>
                  {bucketCount} {bucketCount === 1 ? 'opportunity' : 'opportunities'}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('On Going')}
              className={`flex-1 px-8 py-4 rounded-xl font-bold text-base transition-all ${
                activeTab === 'On Going'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span>Ongoing</span>
                <span className={`text-sm font-normal ${activeTab === 'On Going' ? 'opacity-90' : 'opacity-60'}`}>
                  {ongoingCount} active
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('Archived')}
              className={`flex-1 px-8 py-4 rounded-xl font-bold text-base transition-all ${
                activeTab === 'Archived'
                  ? 'bg-gradient-to-r from-gray-500 to-gray-700 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span>Archived</span>
                <span className={`text-sm font-normal ${activeTab === 'Archived' ? 'opacity-90' : 'opacity-60'}`}>
                  {archivedCount} archived
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-gray-600 mb-6">No opportunities in {activeTab}</p>
              {activeTab === 'Bucket' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-lg"
                >
                  <Plus className="w-6 h-6" />
                  Create Your First Opportunity
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {opportunities.map((opp) => (
                <div key={opp.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Summary Row */}
                  <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition">
                    <button
                      onClick={() => toggleRow(opp.id)}
                      className="p-4 hover:bg-gray-200 transition"
                    >
                      {expandedRows.has(opp.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <div className="flex-1 grid grid-cols-6 gap-4 py-3 pr-4">
                      <div>
                        <div className="text-xs text-gray-500">ID</div>
                        <div className="font-semibold text-gray-900">{opp.id}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Customer</div>
                        <div className="font-medium text-gray-900">{opp.customer_name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Tender Name</div>
                        <div className="text-gray-900">{opp.tender_name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">OEM</div>
                        <div className="text-gray-900">{opp.oem_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Value</div>
                        <div className="text-gray-900">
                          {opp.estimated_value ? `₹${opp.estimated_value.toLocaleString('en-IN')}` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Due Date</div>
                        <div className="text-gray-900">
                          {opp.due_date ? new Date(opp.due_date).toLocaleDateString('en-IN') : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedRows.has(opp.id) && (
                    <div className="p-6 bg-white border-t border-gray-200">
                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Customer Details */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-bold text-blue-900 mb-3">Customer Details</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-semibold">Name:</span> {opp.customer_name}</div>
                            <div><span className="font-semibold">Alias:</span> {opp.customer_alias || '-'}</div>
                            <div><span className="font-semibold">State:</span> {opp.state || '-'}</div>
                            <div><span className="font-semibold">City:</span> {opp.city || '-'}</div>
                          </div>
                        </div>

                        {/* Tender Details */}
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-bold text-purple-900 mb-3">Tender Details</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-semibold">Number:</span> {opp.tender_number || '-'}</div>
                            <div><span className="font-semibold">Name:</span> {opp.tender_name}</div>
                            <div><span className="font-semibold">Type:</span> {opp.requirement_type || '-'}</div>
                            <div><span className="font-semibold">Eligible:</span> {opp.eligible ? 'Yes' : 'No'}</div>
                            <div><span className="font-semibold">Pre-Bid:</span> {opp.pre_bid_date ? new Date(opp.pre_bid_date).toLocaleDateString('en-IN') : '-'}</div>
                            <div><span className="font-semibold">Due Date:</span> {opp.due_date ? new Date(opp.due_date).toLocaleDateString('en-IN') : '-'}</div>
                            <div><span className="font-semibold">Submission End:</span> {opp.submission_end_date ? new Date(opp.submission_end_date).toLocaleDateString('en-IN') : '-'}</div>
                          </div>
                        </div>

                        {/* Financial Details */}
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-bold text-green-900 mb-3">Financial Details</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-semibold">Value:</span> ₹{opp.estimated_value?.toLocaleString('en-IN') || '0'}</div>
                            <div><span className="font-semibold">Contract:</span> {opp.contract_year || 0}Y {opp.contract_month || 0}M</div>
                            <div><span className="font-semibold">RA:</span> {opp.ra ? 'Yes' : 'No'}</div>
                            <div><span className="font-semibold">EMD:</span> {opp.emd ? 'Yes' : 'No'}</div>
                            <div><span className="font-semibold">EMD Value:</span> {opp.emd_value || '-'}</div>
                          </div>
                        </div>ToOngoing(opp.id, opp.tender_name

                        {/* Requirements */}
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <h4 className="font-bold text-amber-900 mb-3">Requirements</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-semibold">Product:</span> {opp.product_name || '-'}</div>
                            <div><span className="font-semibold">OEM:</span> {opp.oem_name || '-'}</div>
                            <div><span className="font-semibold">Quantity:</span> {opp.quantity || 0}</div>
                            <div><span className="font-semibold">OIC:</span> {opp.oic_name || '-'}</div>
                          </div>
                        </div>

                        {/* Case Owner */}
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <h4 className="font-bold text-indigo-900 mb-3">Case Owner</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-semibold">Name:</span> {opp.case_owner_name || '-'}</div>
                            <div><span className="font-semibold">Email:</span> {opp.case_owner_email || '-'}</div>
                          </div>
                        </div>

                        {/* Remarks */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-bold text-gray-900 mb-3">Remarks</h4>
                          <div className="text-sm text-gray-700">{opp.remarks || 'No remarks'}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleDelete(opp.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                        
                        {activeTab === 'Bucket' && (
                          <>
                            <button
                              onClick={() => handleMoveToOngoing(opp.id, opp.tender_name)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                            >
                              <ArrowRight className="w-4 h-4" />
                              Move to Ongoing
                            </button>
                            <button
                              onClick={() => handleMove(opp.id, 'Archived')}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                            >
                              <Archive className="w-4 h-4" />
                              Move to Archive
                            </button>
                          </>
                        )}
                        
                        {activeTab === 'On Going' && (
                          <>
                            <button
                              onClick={() => handleMove(opp.id, 'Bucket')}
                              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                            >
                              <ArrowRight className="w-4 h-4" />
                              Move to Bucket
                            </button>
                            <button
                              onClick={() => handleMove(opp.id, 'Archived')}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                            >
                              <Archive className="w-4 h-4" />
                              Move to Archive
                            </button>
                          </>
                        )}
                        
                        {activeTab === 'Archived' && (
                          <>
                            <button
                              onClick={() => handleMove(opp.id, 'Bucket')}
                              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                            >
                              <ArrowRight className="w-4 h-4" />
                              Move to Bucket
                            </button>
                            <button
                              onClick={() => handleMove(opp.id, 'On Going')}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                            >
                              <ArrowRight className="w-4 h-4" />
                              Move to Ongoing
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Opportunity Form Modal */}
      {showCreateForm && (
        <OpportunityFormV2 
          onClose={() => setShowCreateForm(false)}
          onSave={handleFormSave}
        />
      )}

      {/* Owner Assignment Modal */}
      {ownerAssignment.show && (
        <OwnerAssignmentModal
          opportunityId={ownerAssignment.opportunityId || 0}
          opportunityName={ownerAssignment.opportunityName}
          onAssign={handleOwnerAssigned}
          onCancel={() => setOwnerAssignment({ show: false, opportunityId: null, opportunityName: '' })}
        />
      )}
    </div>
  );
}
