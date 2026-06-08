import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Download,
  Clock,
  Send,
  Award,
  XCircle,
  Archive,
  Search,
  Loader,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { seplApi } from '../../services/api';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityForm } from './OpportunityForm';

interface Opportunity {
  id: number;
  title: string;
  reference_number: string;
  client_name: string;
  project_domain?: string;
  estimated_value: number;
  currency: string;
  created_date: string;
  expected_closure_date?: string;
  assigned_owner_name?: string;
  assigned_owner_email?: string;
  current_stage: string;
  status: string;
  loss_reason?: string;
  remarks?: string;
}

const STAGES = [
  'New / Identified',
  'Bid Submitted',
  'Under Evaluation',
  'Negotiation',
  'Won',
  'Lost',
];

export function SEPLFunnel() {
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('OnGoing');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [lossReason, setLossReason] = useState('');

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      // Load all opportunities without status filter for client-side filtering
      const response = await seplApi.listOpportunities(selectedStage, '');
      setAllOpportunities(response.data || []);
    } catch (err) {
      console.error('Error loading opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingOpportunity(null);
    setShowForm(true);
  };

  const handleEdit = (opp: Opportunity) => {
    setEditingOpportunity(opp);
    setShowForm(true);
  };

  const handleSave = async () => {
    setShowForm(false);
    setEditingOpportunity(null);
    await loadOpportunities();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await seplApi.deleteOpportunity(id);
      await loadOpportunities();
    } catch (err) {
      console.error('Error deleting opportunity:', err);
    }
  };

  const handleChangeStatus = (id: number, currentStatus: string) => {
    setSelectedOpportunityId(id);
    setNewStatus(currentStatus);
    setStatusRemarks('');
    setLossReason('');
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedOpportunityId || !newStatus) return;
    try {
      // Update the status field directly
      await seplApi.updateOpportunity(selectedOpportunityId, {
        status: newStatus,
        remarks: statusRemarks,
        loss_reason: newStatus === 'Lost' ? lossReason : null,
        archived_reason: newStatus === 'Archived' ? statusRemarks : null
      });
      setShowStatusModal(false);
      await loadOpportunities();
    } catch (err) {
      console.error('Error changing status:', err);
    }
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

  const handleExport = async () => {
    try {
      const response = await seplApi.export({ stage: selectedStage, status: selectedStatus });
      const data = response.data || [];
      
      if (data.length === 0) {
        alert('No data to export');
        return;
      }
      
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row: any) =>
          headers.map((h) => JSON.stringify(row[h] || '')).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sepl-opportunities-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      console.error('Error exporting:', err);
    }
  };

  // Filter by selected status
  const opportunities = allOpportunities.filter((opp) => opp.status === selectedStatus);

  // Further filter by search term
  const filteredOpportunities = opportunities.filter((opp) =>
    opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.reference_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count opportunities by status (from all opportunities, not filtered by selected status)
  const onGoingCount = allOpportunities.filter((opp) => opp.status === 'OnGoing').length;
  const submittedCount = allOpportunities.filter((opp) => opp.status === 'Submitted').length;
  const wonCount = allOpportunities.filter((opp) => opp.status === 'Won').length;
  const lostCount = allOpportunities.filter((opp) => opp.status === 'Lost').length;
  const archivedCount = allOpportunities.filter((opp) => opp.status === 'Archived').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-10 h-10 text-indigo-600" />
              <div>
                <h1 className="text-4xl font-bold text-gray-800">SEPL Funnel</h1>
                <p className="text-gray-600 mt-1">Opportunity & Tender Lifecycle Management</p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              New Opportunity
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedStatus('OnGoing')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedStatus === 'OnGoing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              OnGoing Bids ({onGoingCount})
            </button>
            <button
              onClick={() => setSelectedStatus('Submitted')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedStatus === 'Submitted'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              Submitted Bids ({submittedCount})
            </button>
            <button
              onClick={() => setSelectedStatus('Won')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedStatus === 'Won'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Award className="w-4 h-4 inline mr-2" />
              Won ({wonCount})
            </button>
            <button
              onClick={() => setSelectedStatus('Lost')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedStatus === 'Lost'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <XCircle className="w-4 h-4 inline mr-2" />
              Lost ({lostCount})
            </button>
            <button
              onClick={() => setSelectedStatus('Archived')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedStatus === 'Archived'
                  ? 'bg-gray-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Archive className="w-4 h-4 inline mr-2" />
              Archived ({archivedCount})
            </button>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Stages</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <OpportunityForm
            opportunity={editingOpportunity}
            onSave={handleSave}
            onClose={() => {
              setShowForm(false);
              setEditingOpportunity(null);
            }}
          />
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Expand</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Reference</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Title</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Client</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Value</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Stage</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Owner</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOpportunities.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        No opportunities found
                      </td>
                    </tr>
                  ) : (
                    filteredOpportunities.map((opp, index) => (
                      <React.Fragment key={opp.id}>
                        <tr className={`hover:bg-gray-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => toggleRow(opp.id)}
                              className="p-1 hover:bg-gray-200 rounded transition"
                            >
                              {expandedRows.has(opp.id) ? (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {opp.reference_number}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 font-semibold max-w-xs truncate">
                            {opp.title}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {opp.client_name}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                            ₹{opp.estimated_value?.toLocaleString() || '0'}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              opp.current_stage === 'Won' ? 'bg-green-100 text-green-800' :
                              opp.current_stage === 'Lost' ? 'bg-red-100 text-red-800' :
                              opp.current_stage === 'Negotiation' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {opp.current_stage}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 max-w-xs truncate">
                            {(() => {
                              // Try to parse case_owners JSON if available
                              if (opp.case_owners) {
                                try {
                                  const owners = typeof opp.case_owners === 'string' 
                                    ? JSON.parse(opp.case_owners) 
                                    : opp.case_owners;
                                  if (Array.isArray(owners) && owners.length > 0) {
                                    return owners.map((o: any) => o.name || o.email).join(', ');
                                  }
                                } catch (e) {
                                  // Ignore parse errors
                                }
                              }
                              // Fallback to case_owner_name
                              return opp.case_owner_name || opp.assigned_owner_name || '-';
                            })()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleChangeStatus(opp.id, opp.status)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Change Status"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(opp)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(opp.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedRows.has(opp.id) && (
                          <tr className="bg-indigo-50">
                            <td colSpan={8} className="px-4 py-6">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-semibold text-gray-700">Project Domain:</span>
                                  <p className="text-gray-900 mt-1">{opp.project_domain || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Created Date:</span>
                                  <p className="text-gray-900 mt-1">
                                    {new Date(opp.created_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Expected Closure:</span>
                                  <p className="text-gray-900 mt-1">
                                    {opp.expected_closure_date 
                                      ? new Date(opp.expected_closure_date).toLocaleDateString()
                                      : '-'}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Currency:</span>
                                  <p className="text-gray-900 mt-1">{opp.currency || 'INR'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Status:</span>
                                  <p className="text-gray-900 mt-1">{opp.status}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Owner Email:</span>
                                  <p className="text-gray-900 mt-1">{opp.assigned_owner_email || '-'}</p>
                                </div>
                                {opp.remarks && (
                                  <div className="col-span-2 md:col-span-3">
                                    <span className="font-semibold text-gray-700">Remarks:</span>
                                    <p className="text-gray-900 mt-1">{opp.remarks}</p>
                                  </div>
                                )}
                                {opp.loss_reason && (
                                  <div className="col-span-2 md:col-span-3">
                                    <span className="font-semibold text-gray-700">Loss Reason:</span>
                                    <p className="text-red-700 mt-1">{opp.loss_reason}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Status Change Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Change Status</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="OnGoing">OnGoing</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                {newStatus === 'Lost' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Loss Reason
                    </label>
                    <textarea
                      value={lossReason}
                      onChange={(e) => setLossReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Reason for losing this opportunity..."
                    />
                  </div>
                )}

                {newStatus === 'Archived' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Archive Reason
                    </label>
                    <textarea
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Reason for archiving..."
                    />
                  </div>
                )}

                {newStatus !== 'Archived' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Remarks (Optional)
                    </label>
                    <textarea
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Additional remarks..."
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusSubmit}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
