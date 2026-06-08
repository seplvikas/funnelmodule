import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { seplApi } from '../../services/api';

interface Customer {
  id: number;
  name: string;
}

interface OIC {
  id: number;
  name: string;
  contact_no?: string;
  email?: string;
  customer_id: number;
  customer_name?: string;
  created_on?: string;
}

export default function ManageProjectOICs() {
  const [oics, setOICs] = useState<OIC[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingOIC, setIsAddingOIC] = useState(false);
  const [editingOICId, setEditingOICId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_no: '',
    email: '',
    customer_id: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [oicsRes, customersRes] = await Promise.all([
        seplApi.listOICs(),
        seplApi.listCustomers(),
      ]);
      setOICs(oicsRes?.data || []);
      setCustomers(customersRes?.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleAdd = () => {
    setIsAddingOIC(true);
    setFormData({ name: '', contact_no: '', email: '', customer_id: 0 });
  };

  const handleEdit = (oic: OIC) => {
    setEditingOICId(oic.id);
    setFormData({
      name: oic.name,
      contact_no: oic.contact_no || '',
      email: oic.email || '',
      customer_id: oic.customer_id,
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.customer_id) {
        alert('Please fill in OIC name and select a customer');
        return;
      }

      if (editingOICId) {
        await seplApi.updateOIC(editingOICId, formData);
      } else {
        await seplApi.createOIC(formData);
      }

      await loadData();
      handleCancel();
    } catch (err) {
      console.error('Error saving OIC:', err);
      alert('Failed to save OIC');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this OIC?')) return;

    try {
      await seplApi.deleteOIC(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting OIC:', err);
      alert('Failed to delete OIC');
    }
  };

  const handleCancel = () => {
    setIsAddingOIC(false);
    setEditingOICId(null);
    setFormData({ name: '', contact_no: '', email: '', customer_id: 0 });
  };

  const filteredOICs = oics.filter(
    (oic) =>
      oic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      oic.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      oic.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Project OIC Management</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add OIC
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by OIC name, customer name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {(isAddingOIC || editingOICId) && (
        <div className="bg-white border border-gray-300 rounded-lg p-4 md:p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {editingOICId ? 'Edit OIC' : 'Add New OIC'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) =>
                  setFormData({ ...formData, customer_id: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OIC Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter OIC name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                value={formData.contact_no}
                onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter contact number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OIC Name
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Contact Number
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Email
                </th>
                <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOICs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? 'No OICs found matching your search' : 'No OICs found. Add one to get started.'}
                  </td>
                </tr>
              ) : (
                filteredOICs.map((oic) => (
                  <tr key={oic.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="max-w-xs truncate" title={oic.name}>
                        {oic.name}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs truncate" title={oic.customer_name}>
                        {oic.customer_name || '-'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
                      <div className="max-w-xs truncate" title={oic.contact_no}>
                        {oic.contact_no || '-'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                      <div className="max-w-xs truncate" title={oic.email}>
                        {oic.email || '-'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(oic)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(oic.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
