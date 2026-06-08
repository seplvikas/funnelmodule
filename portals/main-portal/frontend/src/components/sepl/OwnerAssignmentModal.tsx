import React, { useState, useEffect } from 'react';
import { X, Search, Loader } from 'lucide-react';
import { usersApi } from '../../services/api';

interface ADUser {
  id?: number | string;
  email: string;
  name: string;
  upn?: string;
}

interface OwnerAssignmentModalProps {
  opportunityId: number;
  opportunityName: string;
  onAssign: (owner: ADUser) => Promise<void>;
  onCancel: () => void;
}

export function OwnerAssignmentModal({
  opportunityId,
  opportunityName,
  onAssign,
  onCancel
}: OwnerAssignmentModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [adUsers, setAdUsers] = useState<ADUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<ADUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchUsers();
    } else {
      setAdUsers([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setSearching(true);
      setError('');
      console.log('Fetching all users from Active Directory...');
      
      // Search users by email or name
      const response = await usersApi.listAll();
      console.log('AD Users response:', response);
      
      const allUsers = response?.data || [];
      console.log('Total users received:', allUsers.length);
      
      const filtered = allUsers.filter((user: any) =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      console.log('Filtered users:', filtered.length, 'for query:', searchQuery);
      setAdUsers(filtered);
      setShowDropdown(filtered.length > 0);
    } catch (err: any) {
      console.error('Error searching users:', err);
      setError(`Failed to search users: ${err.message || 'Unknown error'}`);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectOwner = (user: ADUser) => {
    setSelectedOwner(user);
    setSearchQuery(''); // Clear search after selection
    setShowDropdown(false);
    setAdUsers([]); // Clear dropdown list
  };

  const handleAssign = async () => {
    if (!selectedOwner) {
      setError('Please select an owner');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onAssign(selectedOwner);
      onCancel(); // Close modal after successful assignment
    } catch (err: any) {
      console.error('Error assigning owner:', err);
      setError(err.response?.data?.error || 'Failed to assign owner and move opportunity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Assign Bid Owner</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold">Opportunity:</span> {opportunityName}
            </p>
            <p className="text-sm text-gray-700 mb-4">
              To move this opportunity to Ongoing, you must assign a Bid Owner. Search and select an owner from Active Directory.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Search Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search Owner by Email or Name *
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length > 0 && setShowDropdown(true)}
                  placeholder="Type email or name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {searching && (
                  <Loader className="absolute right-3 top-3 w-5 h-5 text-indigo-600 animate-spin" />
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {adUsers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No users found
                    </div>
                  ) : (
                    adUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectOwner(user)}
                        className="w-full px-4 py-3 hover:bg-indigo-50 cursor-pointer text-left border-b border-gray-100 last:border-b-0 transition"
                      >
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Owner */}
          {selectedOwner && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm">
                <div className="font-semibold text-green-900">✓ Selected Owner:</div>
                <div className="text-green-700 mt-1 font-medium">{selectedOwner.name}</div>
                <div className="text-xs text-green-600 mt-1">{selectedOwner.email}</div>
              </div>
            </div>
          )}

          {!selectedOwner && searchQuery && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Select an owner from the dropdown to proceed
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedOwner}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? 'Moving...' : 'Move to Ongoing'}
          </button>
        </div>
      </div>
    </div>
  );
}
