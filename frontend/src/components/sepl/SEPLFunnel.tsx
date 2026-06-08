import React, { useState, useEffect, useContext } from 'react';
import {
  TrendingUp,
  Plus,
  Download,
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
  Snowflake,
  UserPlus,
} from 'lucide-react';
import { seplApi, usersApi } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { OpportunityForm } from './OpportunityForm';

type SectionKey = 'Bucket' | 'Ongoing' | 'Archived';
type StatusKey = 'Bucket-Active' | 'Bucket-Cold' | 'Ongoing-Active' | 'Submitted' | 'Won' | 'Lost' | 'Drop' | 'Archived';
type StatusActionType = 'remark' | 'assign-owner' | 'submission' | 'simple';

interface Opportunity {
  id: number;
  customer_name: string;
  customer_alias?: string;
  state?: string;
  city?: string;
  tender_number?: string;
  tender_name?: string;
  requirement_type?: string;
  estimated_value: number;
  currency?: string;
  created_date: string;
  due_date?: string;
  assigned_owner_name?: string;
  assigned_owner_email?: string;
  assigned_owner_id?: number;
  current_stage: string;
  status: StatusKey;
  loss_reason?: string;
  remarks?: string;
  quotation_amount?: number;
  pricing_model?: string;
  gst_inclusive?: number | boolean;
  submission_date?: string;
  ra?: number;
  ra_type?: string;
  emd?: number;
  emd_value?: string;
  epbg?: number;
  epbg_value?: string;
  tender_fees?: string;
  product_name?: string;
  oem_name?: string;
  quantity?: number;
  oic_name?: string;
  l1_cost?: number;
  l1_company_name?: string;
  archived_reason?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface StatusActionState {
  opportunity: Opportunity;
  targetStatus: StatusKey;
  title: string;
  description?: string;
  type: StatusActionType;
}

const STAGES = [
  'New / Identified',
  'Bid Submitted',
  'Under Evaluation',
  'Negotiation',
  'Won',
  'Lost',
];

const SECTION_TABS: Record<SectionKey, Array<{ key: StatusKey; label: string }>> = {
  Bucket: [
    { key: 'Bucket-Active', label: 'Active Opportunity' },
    { key: 'Bucket-Cold', label: 'Cold Opportunity' },
  ],
  Ongoing: [
    { key: 'Ongoing-Active', label: 'Active' },
    { key: 'Submitted', label: 'Submitted' },
    { key: 'Won', label: 'Won' },
    { key: 'Lost', label: 'Lost' },
    { key: 'Drop', label: 'Drop' },
  ],
  Archived: [{ key: 'Archived', label: 'Archived' }],
};

export function SEPLFunnel() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const { getPortalState, setPortalState } = useNavigation();
  
  // Restore state from localStorage
  const savedFunnelState = getPortalState('sepl-funnel-tabs');
  
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [activeSection, setActiveSection] = useState<SectionKey>(savedFunnelState?.activeSection || 'Bucket');
  const [selectedStatus, setSelectedStatus] = useState<StatusKey>(savedFunnelState?.selectedStatus || 'Bucket-Active');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [statusAction, setStatusAction] = useState<StatusActionState | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionError, setActionError] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [owners, setOwners] = useState<User[]>([]);
  const [ownerQuery, setOwnerQuery] = useState('');
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [submissionPrice, setSubmissionPrice] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [pricingModel, setPricingModel] = useState<'Monthly' | 'Yearly' | 'Lumpsum' | ''>('');
  const [gstInclusive, setGstInclusive] = useState<boolean | null>(null);
  const [showEditQuotedAmount, setShowEditQuotedAmount] = useState(false);
  const [editingQuotedAmountOpp, setEditingQuotedAmountOpp] = useState<Opportunity | null>(null);
  const [editedQuotedAmount, setEditedQuotedAmount] = useState('');
  const [showL1Modal, setShowL1Modal] = useState(false);
  const [l1Opp, setL1Opp] = useState<Opportunity | null>(null);
  const [l1Cost, setL1Cost] = useState('');
  const [l1CompanyName, setL1CompanyName] = useState('');
  const [l1Remarks, setL1Remarks] = useState('');

  // Save state whenever activeSection or selectedStatus changes
  useEffect(() => {
    setPortalState('sepl-funnel-tabs', { activeSection, selectedStatus });
  }, [activeSection, selectedStatus, setPortalState]);

  useEffect(() => {
    loadOpportunities();
    loadOwners();
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [selectedStage]);

  // Live search AD users when assigning owner
  useEffect(() => {
    if (statusAction?.type !== 'assign-owner') return;
    const q = ownerQuery.trim();
    // Load all users initially or when query is empty
    if (q.length === 0) {
      loadOwners('');
    } else if (q.length >= 2) {
      // Search AD when user types 2+ characters
      loadOwners(q);
    }
    // Don't clear owners for 1-char queries, keep showing current list
  }, [ownerQuery, statusAction]);

  useEffect(() => {
    const tabs = SECTION_TABS[activeSection];
    if (tabs.length && !tabs.find((t) => t.key === selectedStatus)) {
      setSelectedStatus(tabs[0].key);
    }
  }, [activeSection, selectedStatus]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const response = await seplApi.listOpportunities(selectedStage, '');
      setAllOpportunities(response.data || []);
    } catch (err) {
      console.error('Error loading opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOwners = async (query = '') => {
    try {
      // If query is empty or too short, fetch all users from admin API
      if (!query || query.trim().length < 2) {
        const res = await usersApi.listAll();
        setOwners(res?.data || []);
      } else {
        // Use AD search for specific queries
        const res = await usersApi.searchAD(query);
        // Backend returns { users: [...] } not { data: [...] }
        const users = res?.data?.users || [];
        // Format to match expected structure
        const formattedUsers = users.map((u: any) => ({
          id: u.email,
          name: u.name,
          email: u.email
        }));
        setOwners(formattedUsers);
      }
    } catch (err) {
      console.error('Error loading owners:', err);
      setOwners([]);
    }
  };

  const handleCreate = () => {
    setEditingOpportunity(null);
    setShowForm(true);
  };

  const handleEdit = async (opp: Opportunity) => {
    try {
      // Fetch complete opportunity details from database
      const response = await seplApi.getOpportunity(opp.id || 0);
      setEditingOpportunity(response.data);
      setShowForm(true);
    } catch (err) {
      console.error('Error fetching opportunity details:', err);
      alert('Failed to load opportunity details');
    }
  };

  const handleEditQuotedAmount = (opp: Opportunity) => {
    setEditingQuotedAmountOpp(opp);
    setEditedQuotedAmount(toNumber(opp.quotation_amount)?.toString() || '');
    setShowEditQuotedAmount(true);
  };

  const handleSaveL1Details = async () => {
    if (!l1Opp) return;
    if (!l1Cost.trim() || !l1CompanyName.trim()) {
      alert('Please enter both L1 Cost and L1 Company Name');
      return;
    }
    
    try {
      const l1CostNum = parseFloat(l1Cost);
      if (isNaN(l1CostNum)) {
        alert('L1 Cost must be a valid number');
        return;
      }
      
      setStatusSaving(true);
      let remarksToAdd = l1Remarks.trim();
      let updatedRemarks = l1Opp.remarks;
      
      // Add remark with timestamp and user if provided
      if (remarksToAdd) {
        const timestamp = new Date().toLocaleDateString('en-GB');
        const remark = `[${timestamp} - User: ${user?.department || 'SEPL'} - ${user?.name || 'System'}] ${remarksToAdd}`;
        updatedRemarks = updatedRemarks ? `${updatedRemarks}\n${remark}` : remark;
      }
      
      const payload: any = formatDatesForBackend({
        ...l1Opp,
        status: 'Lost',
        l1_cost: l1CostNum,
        l1_company_name: l1CompanyName.trim(),
        remarks: updatedRemarks
      });
      
      await seplApi.updateOpportunity(l1Opp.id, payload);
      setShowL1Modal(false);
      setL1Opp(null);
      setL1Cost('');
      setL1CompanyName('');
      setL1Remarks('');
      await loadOpportunities();
    } catch (err) {
      console.error('Error saving L1 details:', err);
      alert('Failed to save L1 details: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setStatusSaving(false);
    }
  };

  // Helper function to convert ISO dates to YYYY-MM-DD format for MySQL
  const formatDatesForBackend = (obj: any): any => {
    const formatted = { ...obj };
    const dateFields = ['pre_bid_date', 'due_date', 'submission_end_date', 'created_date', 'expected_closure_date', 'submission_date', 'last_updated_on'];
    
    dateFields.forEach(field => {
      if (formatted[field] && typeof formatted[field] === 'string' && formatted[field].includes('T')) {
        // Convert ISO format to YYYY-MM-DD
        formatted[field] = formatted[field].split('T')[0];
      }
    });
    
    return formatted;
  };

  const handleSaveQuotedAmount = async () => {
    if (!editingQuotedAmountOpp || !editedQuotedAmount.trim()) return;
    
    try {
      const amount = parseFloat(editedQuotedAmount);
      if (isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
      }
      
      const payload = formatDatesForBackend({
        ...editingQuotedAmountOpp,
        quotation_amount: amount
      });
      
      await seplApi.updateOpportunity(editingQuotedAmountOpp.id, payload);
      
      setShowEditQuotedAmount(false);
      setEditingQuotedAmountOpp(null);
      setEditedQuotedAmount('');
      await loadOpportunities();
    } catch (err) {
      console.error('Error updating quoted amount:', err);
      alert('Failed to update quoted amount: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
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

  const openRemarkAction = (opportunity: Opportunity, targetStatus: StatusKey, title: string, description?: string) => {
    setStatusAction({ opportunity, targetStatus, title, description, type: 'remark' });
    setActionRemarks('');
    setActionError('');
  };

  const openOwnerAction = (opportunity: Opportunity) => {
    setStatusAction({
      opportunity,
      targetStatus: 'Ongoing-Active',
      title: 'Assign Owner and Move to Ongoing',
      description: 'Pick an AD user to own this opportunity before it moves to Ongoing > Active.',
      type: 'assign-owner',
    });
    setOwnerQuery('');
    setSelectedOwner(null);
    setOwnerDropdownOpen(false);
    setActionRemarks('');
    setActionError('');
    loadOwners('');
  };

  const openSubmissionAction = (opportunity: Opportunity) => {
    setStatusAction({
      opportunity,
      targetStatus: 'Submitted',
      title: 'Submit Opportunity',
      description: 'Provide quoted price, submission date, pricing model, and GST preference.',
      type: 'submission',
    });
    setSubmissionPrice('');
    setSubmissionDate('');
    setPricingModel('');
    setGstInclusive(null);
    setActionError('');
  };

  const openSimpleAction = (opportunity: Opportunity, targetStatus: StatusKey, title: string, description?: string) => {
    // If moving Submitted to Lost, open L1 modal instead of confirmation dialog
    if (opportunity.status === 'Submitted' && targetStatus === 'Lost') {
      setL1Opp(opportunity);
      setShowL1Modal(true);
      setL1Cost('');
      setL1CompanyName('');
      setL1Remarks('');
    } else {
      setStatusAction({ opportunity, targetStatus, title, description, type: 'simple' });
    }
    setActionError('');
  };

  const closeStatusModal = () => {
    setStatusAction(null);
    setActionRemarks('');
    setSelectedOwner(null);
    setOwnerQuery('');
    setOwnerDropdownOpen(false);
    setSubmissionPrice('');
    setSubmissionDate('');
    setPricingModel('');
    setGstInclusive(null);
    setActionError('');
    setStatusSaving(false);
  };

  const handleStatusSubmit = async () => {
    if (!statusAction) return;

    const { opportunity, targetStatus, type } = statusAction;
    const payload: any = { status: targetStatus };

    if (type === 'remark') {
      if (!actionRemarks.trim()) {
        setActionError('Please add a remark to continue.');
        return;
      }
      payload.remarks = actionRemarks.trim();
      if (targetStatus === 'Drop') {
        payload.loss_reason = actionRemarks.trim();
      }
    }

    if (type === 'assign-owner') {
      if (!selectedOwner) {
        setActionError('Select an owner from suggestions.');
        return;
      }
      // For AD users, id might be email string, so use null for assigned_owner_id
      payload.assigned_owner_id = typeof selectedOwner.id === 'number' ? selectedOwner.id : null;
      payload.assigned_owner_email = selectedOwner.email;
      payload.assigned_owner_name = selectedOwner.name;
    }

    if (type === 'submission') {
      if (!submissionPrice || !submissionDate || !pricingModel || gstInclusive === null) {
        setActionError('Quoted price, submission date, pricing model, and GST choice are required.');
        return;
      }
      payload.quotation_amount = Number(submissionPrice);
      payload.submission_date = submissionDate;
      payload.pricing_model = pricingModel;
      payload.gst_inclusive = gstInclusive;
    }

    setStatusSaving(true);
    setActionError('');

    try {
      await seplApi.updateOpportunity(opportunity.id, payload);
      closeStatusModal();
      await loadOpportunities();
    } catch (err: any) {
      console.error('Error changing status:', err);
      setActionError(err?.response?.data?.error || 'Failed to update status');
    } finally {
      setStatusSaving(false);
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

  const statusCounts = allOpportunities.reduce<Record<StatusKey, number>>((acc, opp) => {
    acc[opp.status] = (acc[opp.status] || 0) + 1;
    return acc;
  }, {} as Record<StatusKey, number>);

  const sectionCounts: Record<SectionKey, number> = {
    Bucket: (statusCounts['Bucket-Active'] || 0) + (statusCounts['Bucket-Cold'] || 0),
    Ongoing:
      (statusCounts['Ongoing-Active'] || 0) +
      (statusCounts['Submitted'] || 0) +
      (statusCounts['Won'] || 0) +
      (statusCounts['Lost'] || 0) +
      (statusCounts['Drop'] || 0),
    Archived: statusCounts['Archived'] || 0,
  };

  const opportunities = allOpportunities.filter((opp) => opp.status === selectedStatus);
  const filteredOpportunities = opportunities.filter((opp) =>
    (opp.tender_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (opp.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (opp.tender_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (opp.state?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (opp.city?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredOwners = owners.filter(
    (u) =>
      u.name?.toLowerCase().includes(ownerQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(ownerQuery.toLowerCase())
  );

  const canEditOpportunity = (opp: Opportunity): boolean => {
    // Cannot edit if in finalized stages
    const finalizingStages = ['Won', 'Lost', 'Drop', 'Submitted', 'Archived'];
    return !finalizingStages.includes(opp.status);
  };

  // Allow delete from any status (Bucket / Ongoing-Active / Submitted / Won / Lost / Drop / Archived).
  // Backend permissions still enforce who can delete.
  const canDeleteOpportunity = (_opp: Opportunity): boolean => true;

  // Convert string or number to valid number, handles string from form inputs
  const toNumber = (value: any): number | null => {
    if (value === undefined || value === null || value === '') return null;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? null : num;
  };

  const formatValueINR = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '-';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatPercent = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '-';
    }
    return `${value}%`;
  };

  const statusColor: Record<StatusKey, string> = {
    'Bucket-Active': 'border-blue-500',
    'Bucket-Cold': 'border-sky-500',
    'Ongoing-Active': 'border-purple-500',
    Submitted: 'border-indigo-500',
    Won: 'border-green-500',
    Lost: 'border-red-500',
    Drop: 'border-orange-500',
    Archived: 'border-gray-500',
  };

  const statusCards = SECTION_TABS[activeSection].map((tab) => {
    const opps = allOpportunities.filter((opp) => opp.status === tab.key);
    const totalValue = opps.reduce((sum, opp) => {
      // For submitted, won, lost statuses, use quotation_amount; otherwise use estimated_value
      if (['Submitted', 'Won', 'Lost'].includes(tab.key)) {
        const quotedVal = toNumber(opp.quotation_amount);
        return sum + (quotedVal || 0);
      } else {
        const val = toNumber(opp.estimated_value);
        return sum + (val || 0);
      }
    }, 0);
    return { ...tab, totalValue, count: opps.length };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-indigo-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-800">SEPL Funnel</h1>
              <p className="text-gray-600 mt-1">Bucket → Ongoing → Archived workflow</p>
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

        <div className="bg-white shadow-md rounded-2xl p-2 inline-flex flex-wrap gap-2">
          {(Object.keys(SECTION_TABS) as SectionKey[]).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 rounded-xl font-semibold transition border ${
                activeSection === section
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-indigo-200 hover:text-indigo-700'
              }`}
            >
              {section} ({sectionCounts[section] || 0})
            </button>
          ))}
        </div>

        {/* Stats per active tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {statusCards.map((card) => (
            <div
              key={card.key}
              className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${statusColor[card.key] || 'border-gray-300'}`}
            >
              <h3 className="text-sm font-semibold text-gray-600 uppercase">{card.label}</h3>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.count}</p>
                  <p className="text-xs text-gray-500 mt-1">Opportunities</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-indigo-600">{formatValueINR(card.totalValue)}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Value</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {SECTION_TABS[activeSection].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedStatus === tab.key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label} ({statusCounts[tab.key] || 0})
            </button>
          ))}
        </div>

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

        {showEditQuotedAmount && editingQuotedAmountOpp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Quoted Amount</h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quoted Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedQuotedAmount}
                  onChange={(e) => setEditedQuotedAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter quoted amount"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowEditQuotedAmount(false);
                    setEditingQuotedAmountOpp(null);
                    setEditedQuotedAmount('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuotedAmount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {showL1Modal && l1Opp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">L1 Bid Details</h2>
              <p className="text-sm text-gray-600 mb-4">Enter the L1 (lowest) bid details to mark this opportunity as Lost.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">L1 Company Name *</label>
                  <input
                    type="text"
                    value={l1CompanyName}
                    onChange={(e) => setL1CompanyName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter L1 company name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">L1 Cost (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={l1Cost}
                    onChange={(e) => setL1Cost(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter L1 cost amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks (Optional)</label>
                  <textarea
                    value={l1Remarks}
                    onChange={(e) => setL1Remarks(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any remarks about the lost bid (e.g., reason for losing, pricing concerns, etc.)"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setShowL1Modal(false);
                    setL1Opp(null);
                    setL1Cost('');
                    setL1CompanyName('');
                    setL1Remarks('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  disabled={statusSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveL1Details}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:bg-gray-400"
                  disabled={statusSaving}
                >
                  {statusSaving ? 'Saving...' : 'Mark as Lost'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0">
                  <tr>
                    <th className="px-3 py-4 text-center text-sm font-semibold w-12">Expand</th>
                    <th className="px-3 py-4 text-center text-sm font-semibold w-16">S. No.</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Customer Name</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Due Date</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">State</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">City</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Requirement Type</th>
                    <th className="px-4 py-4 text-right text-sm font-semibold">Value</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOpportunities.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                        No opportunities found
                      </td>
                    </tr>
                  ) : (
                    filteredOpportunities.map((opp, index) => (
                      <React.Fragment key={opp.id}>
                        <tr className={`hover:bg-indigo-50 transition h-16 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-3 py-4 text-center">
                            <button
                              onClick={() => toggleRow(opp.id)}
                              className="p-1 hover:bg-gray-300 rounded transition inline-flex items-center justify-center"
                            >
                              {expandedRows.has(opp.id) ? (
                                <ChevronDown className="w-5 h-5 text-indigo-600" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-4 text-center font-bold text-indigo-700 bg-indigo-50">
                            {opp.id || index + 1}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 truncate">
                            {opp.customer_name}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 truncate">
                            {opp.due_date ? new Date(opp.due_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 font-semibold truncate max-w-xs">
                            {opp.state}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 truncate">
                            {opp.city}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 truncate">
                            {opp.requirement_type}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right">
                            {formatValueINR(opp.estimated_value || 0)}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                              opp.current_stage === 'Won' ? 'bg-green-100 text-green-800' :
                              opp.current_stage === 'Lost' ? 'bg-red-100 text-red-800' :
                              opp.current_stage === 'Negotiation' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {opp.current_stage}
                            </span>
                          </td>
                        </tr>
                        {expandedRows.has(opp.id) && (
                          <tr className="bg-gray-100 border-t-2 border-indigo-300">
                            <td colSpan={9} className="px-6 py-8">
                              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 space-y-6">
                                
                                {/* Section Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                  {/* Basic Information Section */}
                                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-l-4 border-blue-500 hover:shadow-md transition">
                                    <h4 className="font-bold text-blue-900 text-sm mb-4 flex items-center gap-2">
                                      <span>📋</span> Basic Information
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <span className="text-xs font-semibold text-blue-700 uppercase block">ID</span>
                                        <p className="text-lg font-bold text-blue-900">{opp.id}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs font-semibold text-blue-700 uppercase block">Tender Number</span>
                                        <p className="text-sm text-gray-800">{opp.tender_number || '-'}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs font-semibold text-blue-700 uppercase block">Current Stage</span>
                                        <p className={`text-sm font-semibold px-2 py-1 rounded inline-block ${
                                          opp.current_stage === 'Won' ? 'bg-green-100 text-green-800' :
                                          opp.current_stage === 'Lost' ? 'bg-red-100 text-red-800' :
                                          opp.current_stage === 'Negotiation' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-blue-100 text-blue-800'
                                        }`}>{opp.current_stage}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs font-semibold text-blue-700 uppercase block">Status</span>
                                        <p className="text-sm text-gray-800">{opp.status}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs font-semibold text-blue-700 uppercase block">Created Date</span>
                                        <p className="text-sm text-gray-800">{new Date(opp.created_date).toLocaleDateString('en-IN')}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Customer & Location Information */}
                                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border-l-4 border-green-500 hover:shadow-md transition">
                                    <h4 className="font-bold text-green-900 text-sm mb-4 flex items-center gap-2">
                                      <span>🏢</span> Customer & Location
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <span className="text-xs font-semibold text-green-700 uppercase block">Customer Name</span>
                                        <p className="text-sm font-semibold text-gray-800">{opp.customer_name}</p>
                                      </div>
                                      {opp.customer_alias && (
                                        <div>
                                          <span className="text-xs font-semibold text-green-700 uppercase block">Alias</span>
                                          <p className="text-sm text-gray-800">{opp.customer_alias}</p>
                                        </div>
                                      )}
                                      {opp.state && (
                                        <div>
                                          <span className="text-xs font-semibold text-green-700 uppercase block">State</span>
                                          <p className="text-sm text-gray-800">{opp.state}</p>
                                        </div>
                                      )}
                                      {opp.city && (
                                        <div>
                                          <span className="text-xs font-semibold text-green-700 uppercase block">City</span>
                                          <p className="text-sm text-gray-800">{opp.city}</p>
                                        </div>
                                      )}
                                      {opp.oic_name && (
                                        <div>
                                          <span className="text-xs font-semibold text-green-700 uppercase block">OIC (Officer In-Charge)</span>
                                          <p className="text-sm text-gray-800">{opp.oic_name}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Tender & Project Details */}
                                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border-l-4 border-purple-500 hover:shadow-md transition">
                                    <h4 className="font-bold text-purple-900 text-sm mb-4 flex items-center gap-2">
                                      <span>📑</span> Tender & Project
                                    </h4>
                                    <div className="space-y-3">
                                      {opp.tender_number && (
                                        <div>
                                          <span className="text-xs font-semibold text-purple-700 uppercase block">Tender #</span>
                                          <p className="text-sm text-gray-800">{opp.tender_number}</p>
                                        </div>
                                      )}
                                      {opp.tender_name && (
                                        <div>
                                          <span className="text-xs font-semibold text-purple-700 uppercase block">Tender Name</span>
                                          <p className="text-sm text-gray-800 line-clamp-2">{opp.tender_name}</p>
                                        </div>
                                      )}
                                      {opp.requirement_type && (
                                        <div>
                                          <span className="text-xs font-semibold text-purple-700 uppercase block">Requirement Type</span>
                                          <p className="text-sm text-gray-800">{opp.requirement_type}</p>
                                        </div>
                                      )}
                                      {opp.pre_bid_date && (
                                        <div>
                                          <span className="text-xs font-semibold text-purple-700 uppercase block">Pre-Bid Date</span>
                                          <p className="text-sm text-gray-800">{new Date(opp.pre_bid_date).toLocaleDateString('en-IN')}</p>
                                        </div>
                                      )}
                                      {opp.due_date && (
                                        <div>
                                          <span className="text-xs font-semibold text-purple-700 uppercase block">Due Date</span>
                                          <p className="text-sm text-gray-800">{new Date(opp.due_date).toLocaleDateString('en-IN')}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Financial Details */}
                                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border-l-4 border-amber-500 hover:shadow-md transition">
                                    <h4 className="font-bold text-amber-900 text-sm mb-4 flex items-center gap-2">
                                      <span>💰</span> Financial Details
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <span className="text-xs font-semibold text-amber-700 uppercase block">Estimated Value</span>
                                        <p className="text-lg font-bold text-amber-900">{formatValueINR(opp.estimated_value || 0)}</p>
                                      </div>
                                      {opp.quotation_amount !== undefined && opp.quotation_amount !== null && toNumber(opp.quotation_amount) && (
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <span className="text-xs font-semibold text-amber-700 uppercase block">Quoted Amount</span>
                                            <p className="text-sm font-semibold text-green-700">{formatValueINR(toNumber(opp.quotation_amount))}</p>
                                          </div>
                                          {opp.status === 'Submitted' && opp.ra === 1 && (
                                            <button
                                              onClick={() => handleEditQuotedAmount(opp)}
                                              className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                                              title="Edit Quoted Amount"
                                            >
                                              Edit
                                            </button>
                                          )}
                                        </div>
                                      )}
                                      {opp.pricing_model && (
                                        <div>
                                          <span className="text-xs font-semibold text-amber-700 uppercase block">Pricing Model</span>
                                          <p className="text-sm text-gray-800">{opp.pricing_model}</p>
                                        </div>
                                      )}
                                      {opp.status === 'Submitted' && opp.gst_inclusive !== undefined && opp.gst_inclusive !== null && (
                                        <div>
                                          <span className="text-xs font-semibold text-amber-700 uppercase block">GST Inclusive</span>
                                          <p className="text-sm font-semibold text-gray-800">{opp.gst_inclusive ? '✓ Yes' : '✗ No'}</p>
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-xs font-semibold text-amber-700 uppercase block">RA (Reverse Auction)</span>
                                        <p className="text-sm text-gray-800">{opp.ra ? '✓ Yes' : '✗ No'}</p>
                                        {opp.ra === 1 && opp.ra_type && (
                                          <p className="text-xs text-gray-600 mt-1">Type: {opp.ra_type}</p>
                                        )}
                                      </div>
                                      <div>
                                        <span className="text-xs font-semibold text-amber-700 uppercase block">EMD</span>
                                        <p className="text-sm text-gray-800">{formatValueINR(toNumber(opp.emd_value) || 0)}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs font-semibold text-amber-700 uppercase block">ePBG</span>
                                        <p className="text-sm text-gray-800">{formatPercent(toNumber(opp.epbg_value))}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs font-semibold text-amber-700 uppercase block">Tender Fees</span>
                                        <p className="text-sm text-gray-800">{formatValueINR(toNumber(opp.tender_fees) || 0)}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Product & OEM Details */}
                                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border-l-4 border-indigo-500 hover:shadow-md transition">
                                    <h4 className="font-bold text-indigo-900 text-sm mb-4 flex items-center gap-2">
                                      <span>🔧</span> Product & OEM
                                    </h4>
                                    <div className="space-y-3">
                                      {opp.product_name && (
                                        <div>
                                          <span className="text-xs font-semibold text-indigo-700 uppercase block">Product</span>
                                          <p className="text-sm text-gray-800">{opp.product_name}</p>
                                        </div>
                                      )}
                                      {opp.oem_name && (
                                        <div>
                                          <span className="text-xs font-semibold text-indigo-700 uppercase block">OEM</span>
                                          <p className="text-sm text-gray-800">{opp.oem_name}</p>
                                        </div>
                                      )}
                                      {opp.quantity && (
                                        <div>
                                          <span className="text-xs font-semibold text-indigo-700 uppercase block">Quantity</span>
                                          <p className="text-sm text-gray-800">{opp.quantity}</p>
                                        </div>
                                      )}
                                      {opp.oic_name && (
                                        <div>
                                          <span className="text-xs font-semibold text-indigo-700 uppercase block">OIC</span>
                                          <p className="text-sm text-gray-800">{opp.oic_name}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Owner & Contact Details */}
                                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-5 rounded-xl border-l-4 border-pink-500 hover:shadow-md transition">
                                    <h4 className="font-bold text-pink-900 text-sm mb-4 flex items-center gap-2">
                                      <span>👤</span> Owner & Contact
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <span className="text-xs font-semibold text-pink-700 uppercase block">Assigned Owner</span>
                                        <p className="text-sm font-semibold text-gray-800">{opp.assigned_owner_name || '-'}</p>
                                        <p className="text-xs text-gray-600">{opp.assigned_owner_email || '-'}</p>
                                      </div>
                                      {opp.case_owner_name && (
                                        <div>
                                          <span className="text-xs font-semibold text-pink-700 uppercase block">Case Owner</span>
                                          <p className="text-sm text-gray-800">{opp.case_owner_name}</p>
                                          <p className="text-xs text-gray-600">{opp.case_owner_email}</p>
                                        </div>
                                      )}
                                      {opp.created_by_email && (
                                        <div>
                                          <span className="text-xs font-semibold text-pink-700 uppercase block">Created By</span>
                                          <p className="text-xs text-gray-600">{opp.created_by_email}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Submission & Dates */}
                                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 rounded-xl border-l-4 border-cyan-500 hover:shadow-md transition">
                                    <h4 className="font-bold text-cyan-900 text-sm mb-4 flex items-center gap-2">
                                      <span>📅</span> Submission & Dates
                                    </h4>
                                    <div className="space-y-3">
                                      {opp.submission_end_date && (
                                        <div>
                                          <span className="text-xs font-semibold text-cyan-700 uppercase block">Submission End</span>
                                          <p className="text-sm text-gray-800">{new Date(opp.submission_end_date).toLocaleDateString('en-IN')}</p>
                                        </div>
                                      )}
                                      {opp.submission_date && (
                                        <div>
                                          <span className="text-xs font-semibold text-cyan-700 uppercase block">Submitted On</span>
                                          <p className="text-sm font-semibold text-green-700">{new Date(opp.submission_date).toLocaleDateString('en-IN')}</p>
                                        </div>
                                      )}
                                      {opp.contract_year && (
                                        <div>
                                          <span className="text-xs font-semibold text-cyan-700 uppercase block">Contract Year</span>
                                          <p className="text-sm text-gray-800">{opp.contract_year}</p>
                                        </div>
                                      )}
                                      {opp.contract_month && (
                                        <div>
                                          <span className="text-xs font-semibold text-cyan-700 uppercase block">Contract Month</span>
                                          <p className="text-sm text-gray-800">{opp.contract_month}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Remarks & Additional Info */}
                                {(opp.remarks || opp.loss_reason || opp.archived_reason) && (
                                  <div className="space-y-4 pt-4 border-t-2 border-gray-300">
                                    <h4 className="font-bold text-gray-800 text-sm">📝 Additional Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {opp.remarks && (
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                                          <span className="text-xs font-semibold text-blue-700 uppercase block mb-3 flex items-center gap-1"><span>📝</span> Remarks</span>
                                          <div className="text-sm text-gray-800 whitespace-pre-wrap space-y-2 bg-white p-3 rounded border border-blue-200">
                                            {opp.remarks.replace(/<br>/g, '\n').split('\n').map((line, idx) => {
                                              const isRemarkLine = line.includes('[') && line.includes(']');
                                              return (
                                                <div key={idx} className={isRemarkLine ? 'bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-400' : ''}>
                                                  {line}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                      {opp.loss_reason && (
                                        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                                          <span className="text-xs font-semibold text-red-700 uppercase block mb-2">Loss Reason</span>
                                          <p className="text-sm text-red-900">{opp.loss_reason}</p>
                                        </div>
                                      )}
                                      {opp.status === 'Lost' && opp.l1_company_name && (
                                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border-l-4 border-red-600">
                                          <span className="text-xs font-semibold text-red-700 uppercase block mb-3">L1 Bid Details</span>
                                          <div className="space-y-2">
                                            <div>
                                              <p className="text-xs text-red-600 font-semibold">L1 Company</p>
                                              <p className="text-sm text-gray-800">{opp.l1_company_name}</p>
                                            </div>
                                            {opp.l1_cost && (
                                              <>
                                                <div>
                                                  <p className="text-xs text-red-600 font-semibold">L1 Cost</p>
                                                  <p className="text-sm text-gray-800">{formatValueINR(opp.l1_cost)}</p>
                                                </div>
                                                {opp.quotation_amount && (
                                                  <div className="mt-3 pt-3 border-t border-red-200">
                                                    <p className="text-xs text-red-600 font-semibold">Our Quoted Amount</p>
                                                    <p className="text-sm text-gray-800">{formatValueINR(toNumber(opp.quotation_amount))}</p>
                                                    <p className="text-xs text-red-600 font-semibold mt-2">Difference</p>
                                                    <p className="text-sm font-bold text-red-700">{formatValueINR(toNumber(opp.quotation_amount) - opp.l1_cost)}</p>
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {opp.archived_reason && (
                                        <div className="bg-gray-200 p-4 rounded-lg border-l-4 border-gray-500">
                                          <span className="text-xs font-semibold text-gray-700 uppercase block mb-2">Archived Reason</span>
                                          <p className="text-sm text-gray-900">{opp.archived_reason}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-6 border-t-2 border-gray-300">
                                  <h4 className="font-bold text-gray-800 text-sm mb-4">⚡ Actions</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {opp.status === 'Bucket-Active' && (
                                      <>
                                        <button
                                          onClick={() => openRemarkAction(opp, 'Bucket-Cold', 'Move to Cold Opportunity', 'Add a remark before sending to Cold Opportunity tab.')}
                                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2"
                                          title="Move to Cold"
                                        >
                                          <Snowflake className="w-4 h-4" />
                                          Move to Cold
                                        </button>
                                        <button
                                          onClick={() => openOwnerAction(opp)}
                                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center gap-2"
                                          title="Move to Ongoing"
                                        >
                                          <UserPlus className="w-4 h-4" />
                                          Move to Ongoing
                                        </button>
                                      </>
                                    )}

                                    {opp.status === 'Bucket-Cold' && (
                                      <>
                                        <button
                                          onClick={() => openSimpleAction(opp, 'Bucket-Active', 'Move back to Active Opportunity')}
                                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2"
                                        >
                                          <ArrowRight className="w-4 h-4" />
                                          Back to Active
                                        </button>
                                        <button
                                          onClick={() => openOwnerAction(opp)}
                                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center gap-2"
                                        >
                                          <UserPlus className="w-4 h-4" />
                                          Move to Ongoing
                                        </button>
                                      </>
                                    )}

                                    {opp.status === 'Ongoing-Active' && (
                                      <>
                                        <button
                                          onClick={() => openSubmissionAction(opp)}
                                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition flex items-center gap-2"
                                        >
                                          <Send className="w-4 h-4" />
                                          Submit
                                        </button>
                                        <button
                                          onClick={() => openRemarkAction(opp, 'Drop', 'Move to Drop', 'Add a remark before dropping this opportunity.')}
                                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition flex items-center gap-2"
                                        >
                                          <XCircle className="w-4 h-4" />
                                          Drop
                                        </button>
                                      </>
                                    )}

                                    {opp.status === 'Submitted' && (
                                      <>
                                        <button
                                          onClick={() => openSimpleAction(opp, 'Won', 'Mark as Won')}
                                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
                                        >
                                          <Award className="w-4 h-4" />
                                          Mark Won
                                        </button>
                                        <button
                                          onClick={() => openSimpleAction(opp, 'Lost', 'Mark as Lost')}
                                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2"
                                        >
                                          <XCircle className="w-4 h-4" />
                                          Mark Lost
                                        </button>
                                      </>
                                    )}

                                    {opp.status === 'Drop' && (
                                      <button
                                        onClick={() => openSimpleAction(opp, 'Ongoing-Active', 'Re-activate to Ongoing Active')}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2"
                                      >
                                        <ArrowRight className="w-4 h-4" />
                                        Reactivate
                                      </button>
                                    )}

                                    {opp.status !== 'Archived' && !['Lost', 'Won', 'Drop'].includes(opp.status) && (
                                      <button
                                        onClick={() => openSimpleAction(opp, 'Archived', 'Archive Opportunity', 'Send this opportunity to Archived.')}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition flex items-center gap-2"
                                      >
                                        <Archive className="w-4 h-4" />
                                        Archive
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleEdit(opp)}
                                      disabled={!canEditOpportunity(opp)}
                                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={!canEditOpportunity(opp) ? 'Cannot edit finalized opportunities' : ''}
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(opp.id)}
                                      disabled={!canDeleteOpportunity(opp)}
                                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={!canDeleteOpportunity(opp) ? 'Cannot delete this opportunity' : ''}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
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
      </div>

      {statusAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{statusAction.title}</h3>
            {statusAction.description && <p className="text-gray-600 text-sm mb-4">{statusAction.description}</p>}

            {actionError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {actionError}
              </div>
            )}

            {statusAction.type === 'remark' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Remarks *</label>
                <textarea
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add a remark"
                />
              </div>
            )}

            {statusAction.type === 'assign-owner' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Assign Owner *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={ownerQuery}
                      onFocus={() => setOwnerDropdownOpen(true)}
                      onChange={(e) => {
                        setOwnerQuery(e.target.value);
                        setOwnerDropdownOpen(true);
                      }}
                      placeholder="Search AD users by name or email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {ownerDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                        {filteredOwners.length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500">No matches found</div>
                        )}
                        {filteredOwners.map((owner) => (
                          <div
                            key={owner.id}
                            onClick={() => {
                              setSelectedOwner(owner);
                              setOwnerQuery(`${owner.name} (${owner.email})`);
                              setOwnerDropdownOpen(false);
                            }}
                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm"
                          >
                            <div className="font-semibold text-gray-800">{owner.name}</div>
                            <div className="text-gray-600 text-xs">{owner.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {statusAction.type === 'submission' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Quoted Price *</label>
                  <input
                    type="number"
                    value={submissionPrice}
                    onChange={(e) => setSubmissionPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter quoted price"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Submission Date *</label>
                  <input
                    type="date"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Pricing Model *</label>
                  <select
                    value={pricingModel}
                    onChange={(e) => setPricingModel(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select model</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Lumpsum">Lumpsum</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">GST Inclusive? *</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="radio"
                        checked={gstInclusive === true}
                        onChange={() => setGstInclusive(true)}
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="radio"
                        checked={gstInclusive === false}
                        onChange={() => setGstInclusive(false)}
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            )}

            {statusAction.type === 'simple' && statusAction.targetStatus !== 'Lost' && (
              <p className="text-gray-700 text-sm">Confirm to move this opportunity to {statusAction.targetStatus}.</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeStatusModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusSubmit}
                disabled={statusSaving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold disabled:opacity-60"
              >
                {statusSaving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
