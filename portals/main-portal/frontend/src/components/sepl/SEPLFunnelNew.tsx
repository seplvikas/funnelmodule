import React, { useState, useEffect } from 'react';
import {
  Plus,
  Download,
  Search,
  Loader,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Archive as ArchiveIcon,
  Briefcase,
  Send,
  Award,
  XCircle,
  User,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { seplApi, usersApi } from '../../services/api';
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
  assigned_owner_id?: number;
  assigned_owner_name?: string;
  assigned_owner_email?: string;
  case_owners?: any;
  case_owner_name?: string;
  current_stage: string;
  status: string;
  loss_reason?: string;
  remarks?: string;
}

interface OwnerStats {
  assigned_owner_id: number;
  assigned_owner_name: string;
  assigned_owner_email: string;
  total_bids: number;
  won_count: number;
  lost_count: number;
  active_count: number;
  total_value: number;
  won_value: number;
}

interface User {
  id: number;
  email: string;
  name: string;
}

export function SEPLFunnel() {
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [activeTab, setActiveTab] = useState<'bucket' | 'ongoing' | 'archived'>('bucket');
  const [ongoingSubTab, setOngoingSubTab] = useState<'all' | 'submitted' | 'won' | 'lost'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  // Move to Ongoing Modal states
  const [showOngoingModal, setShowOngoingModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [ongoingOwner, setOngoingOwner] = useState<{ email: string; name: string } | null>(null);
  const [ongoingSearchTerm, setOngoingSearchTerm] = useState('');
  const [showOngoingDropdown, setShowOngoingDropdown] = useState(false);
  
  // Filter states for On Going tab
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [ownerStats, setOwnerStats] = useState<OwnerStats[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fyFilter, setFyFilter] = useState<string>('');

  // Financial year options
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentFY = currentMonth >= 3 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
  const financialYears = Array.from({ length: currentYear - 2019 }, (_, i) => {
    const year = 2020 + i;
    return `${year}-${year + 1}`;
  }).reverse();

  useEffect(() => {
    loadOpportunities();
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'ongoing') {
      loadOwnerStats();
    }
  }, [activeTab, selectedOwnerId, fyFilter]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const response = await seplApi.listOpportunities('', '');
      setAllOpportunities(response.data || []);
    } catch (err) {
      console.error('Error loading opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersApi.listAll();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadOwnerStats = async () => {
    try {
      const params: any = {};
      if (selectedOwnerId) params.ownerId = selectedOwnerId;
      if (fyFilter) {
        const [startYear, endYear] = fyFilter.split('-').map(Number);
        params.startDate = `${startYear}-04-01`;
        params.endDate = `${endYear}-03-31`;
      }
      
      const response = await seplApi.getOwnerStats(params);
      setOwnerStats(response.data || []);
    } catch (err) {
      console.error('Error loading owner stats:', err);
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
    if (activeTab === 'ongoing') {
      await loadOwnerStats();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await seplApi.deleteOpportunity(id);
      await loadOpportunities();
    } catch (err) {
      console.error('Error deleting opportunity:', err);
      alert('Failed to delete opportunity');
    }
  };

  const handleMoveToOngoing = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setShowOngoingModal(true);
  };

  const handleConfirmMoveToOngoing = async () => {
    if (!selectedOpportunity || !ongoingOwner) {
      alert('Please select a case owner');
      return;
    }

    try {
      // Update opportunity with owner details
      await seplApi.updateOpportunity(selectedOpportunity.id, {
        ...selectedOpportunity,
        case_owner_email: ongoingOwner.email,
        case_owner_name: ongoingOwner.name,
      });

      // Move to On Going status
      await handleStatusChange(selectedOpportunity.id, 'On Going');

      // Close modal and reset
      setShowOngoingModal(false);
      setSelectedOpportunity(null);
      setOngoingOwner(null);
      setOngoingSearchTerm('');
      setShowOngoingDropdown(false);
    } catch (err: any) {
      console.error('Error moving to ongoing:', err);
      alert(err.response?.data?.error || 'Failed to move opportunity to ongoing');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const opp = allOpportunities.find(o => o.id === id);
      if (!opp) return;

      // Validate owner assignment for Bucket → On Going transition
      if (opp.status === 'Bucket' && newStatus === 'On Going') {
        if (!opp.assigned_owner_id) {
          alert('Please assign an Owner before moving to On Going');
          return;
        }
      }

      await seplApi.updateOpportunity(id, { ...opp, status: newStatus });
      await loadOpportunities();
      if (activeTab === 'ongoing') {
        await loadOwnerStats();
      }
    } catch (err: any) {
      console.error('Error changing status:', err);
      alert(err.response?.data?.error || 'Failed to change status');
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

  // Filter opportunities based on active tab
  const getFilteredOpportunities = () => {
    let filtered = allOpportunities;

    // Filter by tab
    if (activeTab === 'bucket') {
      filtered = filtered.filter(o => o.status === 'Bucket');
    } else if (activeTab === 'ongoing') {
      if (ongoingSubTab === 'all') {
        filtered = filtered.filter(o => o.status === 'On Going' || o.status === 'Submitted');
      } else if (ongoingSubTab === 'submitted') {
        filtered = filtered.filter(o => o.status === 'Submitted');
      } else if (ongoingSubTab === 'won') {
        filtered = filtered.filter(o => o.status === 'Won');
      } else if (ongoingSubTab === 'lost') {
        filtered = filtered.filter(o => o.status === 'Lost');
      }
      
      // Apply owner filter for ongoing tab
      if (selectedOwnerId) {
        filtered = filtered.filter(o => o.assigned_owner_id === selectedOwnerId);
      }
    } else if (activeTab === 'archived') {
      filtered = filtered.filter(o => o.status === 'Archived');
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.title.toLowerCase().includes(search) ||
        o.reference_number.toLowerCase().includes(search) ||
        o.client_name.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const filteredOpportunities = getFilteredOpportunities();

  // Get status action buttons for each status
  const getStatusActions = (opp: Opportunity) => {
    const actions = [];
    
    if (opp.status === 'Bucket') {
      actions.push({ label: 'Move to On Going', status: 'On Going', icon: Briefcase, color: 'blue' });
      actions.push({ label: 'Archive', status: 'Archived', icon: ArchiveIcon, color: 'gray' });
    } else if (opp.status === 'On Going') {
      actions.push({ label: 'Submit', status: 'Submitted', icon: Send, color: 'indigo' });
      actions.push({ label: 'Archive', status: 'Archived', icon: ArchiveIcon, color: 'gray' });
    } else if (opp.status === 'Submitted') {
      actions.push({ label: 'Mark Won', status: 'Won', icon: Award, color: 'green' });
      actions.push({ label: 'Mark Lost', status: 'Lost', icon: XCircle, color: 'red' });
      actions.push({ label: 'Archive', status: 'Archived', icon: ArchiveIcon, color: 'gray' });
    } else if (opp.status === 'Won' || opp.status === 'Lost') {
      actions.push({ label: 'Archive', status: 'Archived', icon: ArchiveIcon, color: 'gray' });
    }
    
    return actions;
  };

  const getOwnerDisplay = (opp: Opportunity) => {
    if (opp.case_owners) {
      try {
        const owners = typeof opp.case_owners === 'string' 
          ? JSON.parse(opp.case_owners) 
          : opp.case_owners;
        if (Array.isArray(owners) && owners.length > 0) {
          return owners.map((o: any) => o.name || o.email).join(', ');
        }
      } catch (e) {}
    }
    return opp.case_owner_name || opp.assigned_owner_name || '-';
  };

  // Get current owner stats
  const currentOwnerStats = selectedOwnerId 
    ? ownerStats.find(s => s.assigned_owner_id === selectedOwnerId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sales Funnel</h1>
          <p className="text-gray-600 mt-1">Manage your opportunities pipeline</p>
        </div>
      </div>

      {/* Content removed - Table and Form hidden */}
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <p className="text-gray-500 text-lg">SEPL Funnel interface is being redesigned</p>
      </div>
    </div>
  );
}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Move to Ongoing</h3>
            <p className="text-sm text-gray-600 mb-4">
              Assign a Case Owner to move this opportunity to "On Going" status
            </p>
            
            {/* Selected Owner Display */}
            {ongoingOwner && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{ongoingOwner.name}</div>
                    <div className="text-xs text-gray-600">{ongoingOwner.email}</div>
                  </div>
                  <button
                    onClick={() => setOngoingOwner(null)}
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            {/* User Search Input */}
            <div className="relative mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Case Owner</label>
              <input
                type="text"
                value={ongoingSearchTerm}
                onChange={(e) => {
                  setOngoingSearchTerm(e.target.value);
                  setShowOngoingDropdown(true);
                }}
                onFocus={() => setShowOngoingDropdown(true)}
                placeholder="Type to search users..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* Dropdown */}
              {showOngoingDropdown && ongoingSearchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {users
                    .filter((u) =>
                      u.name.toLowerCase().includes(ongoingSearchTerm.toLowerCase()) ||
                      u.email.toLowerCase().includes(ongoingSearchTerm.toLowerCase())
                    )
                    .map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          setOngoingOwner({ email: user.email, name: user.name });
                          setOngoingSearchTerm('');
                          setShowOngoingDropdown(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                      >
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    ))}
                  {users.filter((u) =>
                    u.name.toLowerCase().includes(ongoingSearchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(ongoingSearchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-2 text-gray-500 text-sm">No users found</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleConfirmMoveToOngoing}
                disabled={!ongoingOwner}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Confirm & Move
              </button>
              <button
                onClick={() => {
                  setShowOngoingModal(false);
                  setSelectedOpportunity(null);
                  setOngoingOwner(null);
                  setOngoingSearchTerm('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
