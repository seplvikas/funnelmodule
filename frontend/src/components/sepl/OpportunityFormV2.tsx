import React, { useState, useEffect } from 'react';
import { X, Save, Loader, Plus, Trash2 } from 'lucide-react';
import { seplApi } from '../../services/api';

// Indian States and Cities
const INDIA_STATES: Record<string, string[]> = {
  'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Vijayanagaram', 'Nellore'],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Pasighat', 'Tezu'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Nagaon'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Durg', 'Raigarh'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Hisar', 'Rohtak'],
  'Himachal Pradesh': ['Shimla', 'Kangra', 'Mandi', 'Solan'],
  'Jharkhand': ['Ranchi', 'Dhanbad', 'Giridih', 'Bokaro'],
  'Karnataka': ['Bengaluru', 'Mysore', 'Mangalore', 'Hubballi'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  'Manipur': ['Imphal', 'Thoubal', 'Churachandpur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mon'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Chandigarh', 'Patiala'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur'],
  'Sikkim': ['Gangtok', 'Siliguri', 'Pelling'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
  'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar'],
  'Tripura': ['Agartala', 'Udaipur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi'],
  'Uttarakhand': ['Dehradun', 'Nainital', 'Haridwar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Darjeeling', 'Siliguri'],
  'Delhi': ['New Delhi', 'Delhi'],
  'Chandigarh': ['Chandigarh'],
};

const REQUIREMENT_TYPES = ['Cloud', 'Licenses', 'Hardware', 'Software', 'Turnkey', 'Manpower/Consulting', 'Services'];

// Helper function to format date for HTML date input (YYYY-MM-DD)
const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    // Handle both ISO format and other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

interface FormData {
  // Customer Details
  customer_name: string;
  customer_alias: string;
  state: string;
  city: string;

  // Tender Details
  tender_number: string;
  tender_name: string;
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

  // Tender Requirements
  product_name: string;
  oem_name: string;
  quantity: number;

  // OIC Details
  oic_name: string;

  // Remarks
  remarks: string;
}

interface Customer {
  id: number;
  name: string;
  alias?: string;
}

interface OEM {
  id: number;
  name: string;
}

interface OIC {
  id: number;
  name: string;
  customer_id?: number;
  customer_name?: string;
  contact_no?: string;
  email?: string;
}

interface Product {
  id: number;
  name: string;
}

interface OpportunityFormV2Props {
  onClose: () => void;
  onSave: () => void;
  opportunity?: {
    id: number;
    customer_name: string;
    customer_alias: string;
    state: string;
    city: string;
    tender_number: string;
    tender_name: string;
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
  };
  messageHandler?: {
    showMessage: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
  };
}

export function OpportunityFormV2({ onClose, onSave, opportunity, messageHandler }: OpportunityFormV2Props) {
  const isEditing = !!opportunity;
  const nonEditableStatuses = ['submitted', 'won', 'lost', 'drop'];
  const isEditDisabled = isEditing && opportunity && nonEditableStatuses.includes((opportunity.current_stage || '').toLowerCase());
  
  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (messageHandler?.showMessage) {
      messageHandler.showMessage(title, message, type);
    } else {
      alert(`${title}: ${message}`);
    }
  };
  const [formData, setFormData] = useState<FormData>({
    customer_name: opportunity?.customer_name || '',
    customer_alias: opportunity?.customer_alias || '',
    state: opportunity?.state || '',
    city: opportunity?.city || '',
    tender_number: opportunity?.tender_number || '',
    tender_name: opportunity?.tender_name || '',
    requirement_type: opportunity?.requirement_type || '',
    eligible: opportunity?.eligible ?? true,
    pre_bid_date: formatDateForInput(opportunity?.pre_bid_date),
    due_date: formatDateForInput(opportunity?.due_date),
    submission_end_date: formatDateForInput(opportunity?.submission_end_date),
    estimated_value: opportunity?.estimated_value || 0,
    contract_year: opportunity?.contract_year || 0,
    contract_month: opportunity?.contract_month || 0,
    ra: opportunity?.ra ?? false,
    emd: opportunity?.emd ?? false,
    emd_value: opportunity?.emd_value || '',
    product_name: opportunity?.product_name || '',
    oem_name: opportunity?.oem_name || '',
    quantity: opportunity?.quantity || 0,
    oic_name: opportunity?.oic_name || '',
    remarks: opportunity?.remarks || '',
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [oems, setOEMs] = useState<OEM[]>([]);
  const [oics, setOICs] = useState<OIC[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic add states
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerAlias, setNewCustomerAlias] = useState('');

  const [showNewOEM, setShowNewOEM] = useState(false);
  const [newOEMName, setNewOEMName] = useState('');

  const [showNewOIC, setShowNewOIC] = useState(false);
  const [newOICName, setNewOICName] = useState('');
  const [newOICCustomerId, setNewOICCustomerId] = useState(0);
  const [newOICContact, setNewOICContact] = useState('');
  const [newOICEmail, setNewOICEmail] = useState('');

  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');

  // Dropdowns
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showOEMDropdown, setShowOEMDropdown] = useState(false);
  const [oembSearch, setOEMSearch] = useState('');
  const [showOICDropdown, setShowOICDropdown] = useState(false);
  const [oicSearch, setOICSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    loadMasters();
  }, []);

  const loadMasters = async () => {
    try {
      const [customersRes, oemsRes, productsRes, oicsRes] = await Promise.all([
        seplApi.listCustomers(),
        seplApi.listOEMs(),
        seplApi.listProducts(),
        seplApi.listOICs(),
      ]);
      setCustomers(customersRes?.data || []);
      setOEMs(oemsRes?.data || []);
      setProducts(productsRes?.data || []);
      setOICs(oicsRes?.data || []);
    } catch (err) {
      console.error('Error loading masters:', err);
    }
  };

  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) return;
    const newCustomer: Customer = {
      id: Date.now(),
      name: newCustomerName,
      alias: newCustomerAlias,
    };
    setCustomers([...customers, newCustomer]);
    setFormData({ ...formData, customer_name: newCustomerName });
    setNewCustomerName('');
    setNewCustomerAlias('');
    setShowNewCustomer(false);
  };

  const handleAddOEM = async () => {
    if (!newOEMName.trim()) return;
    try {
      // Save to database
      const response = await seplApi.createOEM({ name: newOEMName });
      const newOEM: OEM = {
        id: response.data.id,
        name: newOEMName,
      };
      setOEMs([...oems, newOEM]);
      setFormData({ ...formData, oem_name: newOEMName });
      setNewOEMName('');
      setShowNewOEM(false);
    } catch (err) {
      console.error('Error adding OEM:', err);
      showMessage('Error', 'Failed to add OEM. Please try again.', 'error');
    }
  };

  const handleAddOIC = async () => {
    if (!newOICName.trim()) {
      showMessage('Validation Error', 'OIC name is required', 'error');
      return;
    }
    if (!newOICCustomerId) {
      showMessage('Validation Error', 'Please select a customer for the OIC', 'error');
      return;
    }
    
    try {
      // Save to database
      const response = await seplApi.createOIC({
        name: newOICName,
        customer_id: newOICCustomerId,
        contact_no: newOICContact || null,
        email: newOICEmail || null
      });
      
      const customerName = customers.find(c => c.id === newOICCustomerId)?.name || '';
      
      const newOIC: OIC = {
        id: response.data.id,
        name: newOICName,
        customer_id: newOICCustomerId,
        customer_name: customerName,
        contact_no: newOICContact,
        email: newOICEmail
      };
      
      setOICs([...oics, newOIC]);
      setFormData({ ...formData, oic_name: newOICName });
      setNewOICName('');
      setNewOICCustomerId(0);
      setNewOICContact('');
      setNewOICEmail('');
      setShowNewOIC(false);
      
      showMessage('Success', 'OIC added successfully', 'success');
    } catch (err) {
      console.error('Error adding OIC:', err);
      showMessage('Error', 'Failed to add OIC. Please try again.', 'error');
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) return;
    try {
      // Save to database
      const response = await seplApi.createProduct({ name: newProductName });
      const newProduct: Product = {
        id: response.data.id,
        name: newProductName,
      };
      setProducts([...products, newProduct]);
      setFormData({ ...formData, product_name: newProductName });
      setNewProductName('');
      setShowNewProduct(false);
    } catch (err) {
      console.error('Error adding product:', err);
      showMessage('Error', 'Failed to add product. Please try again.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditDisabled) {
      showMessage('Cannot Edit', `This opportunity is in ${opportunity?.current_stage} status and cannot be edited.`, 'error');
      return;
    }
    
    try {
      setSaving(true);
      setErrors({});

      // Validation
      if (!formData.customer_name.trim()) {
        setErrors({ customer_name: 'Customer name is required' });
        setSaving(false);
        return;
      }
      if (!formData.tender_name.trim()) {
        setErrors({ tender_name: 'Tender name is required' });
        setSaving(false);
        return;
      }

      if (isEditing && opportunity) {
        await seplApi.updateOpportunity(opportunity.id, formData);
        showMessage('Success', 'Opportunity updated successfully!', 'success');
      } else {
        const response = await seplApi.createOpportunity(formData);
        console.log('Opportunity created:', response);
        showMessage('Success', 'Opportunity created successfully!', 'success');
      }
      onSave();
    } catch (err: any) {
      console.error('Error saving opportunity:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save opportunity';
      setErrors({ form: errorMessage });
      showMessage('Error', errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredOEMs = oems.filter(o =>
    o.name.toLowerCase().includes(oembSearch.toLowerCase())
  );
  const filteredOICs = oics.filter(o =>
    o.name.toLowerCase().includes(oicSearch.toLowerCase()) ||
    (o.customer_name && o.customer_name.toLowerCase().includes(oicSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Opportunity' : 'Create New Opportunity'}</h2>
            {isEditDisabled && <p className="text-xs text-red-600 mt-1">This opportunity cannot be edited (Status: {opportunity?.current_stage})</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {errors.form && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
              {errors.form}
            </div>
          )}

          {/* 1. Customer Details Section */}
          <section className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-bold text-blue-900 mb-4">1. Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => {
                      setFormData({ ...formData, customer_name: e.target.value });
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Search or type customer name"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-300"
                  />
                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, customer_name: c.name, customer_alias: c.alias || '' });
                            setShowCustomerDropdown(false);
                          }}
                          className="w-full px-4 py-2 hover:bg-blue-50 cursor-pointer text-left border-b border-gray-100 hover:border-blue-200"
                        >
                          <div className="font-medium text-gray-900">{c.name}</div>
                          {c.alias && <div className="text-xs text-gray-500">{c.alias}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Alias */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Alias</label>
                <input
                  type="text"
                  value={formData.customer_alias}
                  onChange={(e) => setFormData({ ...formData, customer_alias: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select State</option>
                  {Object.keys(INDIA_STATES).sort().map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!formData.state}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select City</option>
                  {formData.state && INDIA_STATES[formData.state]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

          </section>

          {/* 2. Tender Details Section */}
          <section className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
            <h3 className="text-lg font-bold text-purple-900 mb-4">2. Tender Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tender Number</label>
                <input type="text" placeholder="Enter tender number" value={formData.tender_number} onChange={(e) => setFormData({ ...formData, tender_number: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tender Name *</label>
                <input type="text" placeholder="Enter tender name" value={formData.tender_name} onChange={(e) => setFormData({ ...formData, tender_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Requirement Type</label>
                <select value={formData.requirement_type} onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">Select Requirement Type</option>
                  {REQUIREMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Eligibility</label>
                <div className="flex items-center gap-4 h-[42px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.eligible} onChange={(e) => setFormData({ ...formData, eligible: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">Eligible for Tender</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pre-Bid Date</label>
                <input type="date" value={formData.pre_bid_date} onChange={(e) => setFormData({ ...formData, pre_bid_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SEPL Due Date</label>
                <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Submission End Date</label>
                <input type="date" value={formData.submission_end_date} onChange={(e) => setFormData({ ...formData, submission_end_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Value (INR)</label>
                <input type="number" placeholder="0" value={formData.estimated_value} onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contract Period (Years)</label>
                <input type="number" placeholder="0" value={formData.contract_year} onChange={(e) => setFormData({ ...formData, contract_year: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contract Period (Months)</label>
                <input type="number" placeholder="0" value={formData.contract_month} onChange={(e) => setFormData({ ...formData, contract_month: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">RA (Running Account)</label>
                <div className="flex items-center gap-4 h-[42px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.ra} onChange={(e) => setFormData({ ...formData, ra: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">RA Required</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">EMD (Earnest Money Deposit)</label>
                <div className="flex items-center gap-4 h-[42px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.emd} onChange={(e) => setFormData({ ...formData, emd: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">EMD Required</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">EMD Value (INR)</label>
                <input type="text" placeholder="Enter EMD amount" value={formData.emd_value} onChange={(e) => setFormData({ ...formData, emd_value: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
          </section>

          {/* 3. Tender Requirements Section */}
          <section className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
            <h3 className="text-lg font-bold text-green-900 mb-4">3. Tender Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Product/Service */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product / Service</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => {
                      setFormData({ ...formData, product_name: e.target.value });
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="Search or add product"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  {showProductDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, product_name: p.name });
                            setShowProductDropdown(false);
                          }}
                          className="w-full px-4 py-2 hover:bg-green-50 cursor-pointer text-left border-b border-gray-100"
                        >
                          {p.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowNewProduct(true)}
                        className="w-full px-4 py-2 text-green-600 hover:bg-green-50 flex items-center gap-2 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Product
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* OEM */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">OEM *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.oem_name}
                    onChange={(e) => {
                      setFormData({ ...formData, oem_name: e.target.value });
                      setOEMSearch(e.target.value);
                      setShowOEMDropdown(true);
                    }}
                    onFocus={() => setShowOEMDropdown(true)}
                    placeholder="Search or add OEM"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  {showOEMDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredOEMs.map(o => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, oem_name: o.name });
                            setShowOEMDropdown(false);
                          }}
                          className="w-full px-4 py-2 hover:bg-green-50 cursor-pointer text-left border-b border-gray-100"
                        >
                          {o.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowNewOEM(true)}
                        className="w-full px-4 py-2 text-green-600 hover:bg-green-50 flex items-center gap-2 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add New OEM
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <input type="number" placeholder="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            {/* New Product Form */}
            {showNewProduct && (
              <div className="mt-4 p-4 bg-white border border-green-300 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Add New Product</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Product Name *"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewProduct(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* New OEM Form */}
            {showNewOEM && (
              <div className="mt-4 p-4 bg-white border border-green-300 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Add New OEM</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newOEMName}
                    onChange={(e) => setNewOEMName(e.target.value)}
                    placeholder="OEM Name *"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddOEM}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewOEM(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 4. OIC Details Section */}
          <section className="border-2 border-amber-200 rounded-lg p-6 bg-amber-50">
            <h3 className="text-lg font-bold text-amber-900 mb-4">4. OIC Details (Optional)</h3>
            <div className="max-w-2xl">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Officer In-Charge (OIC)</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.oic_name}
                  onChange={(e) => {
                    setFormData({ ...formData, oic_name: e.target.value });
                    setOICSearch(e.target.value);
                    setShowOICDropdown(true);
                  }}
                  onFocus={() => setShowOICDropdown(true)}
                  placeholder="Search by OIC name or customer name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              {showOICDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {filteredOICs.length > 0 ? (
                    filteredOICs.map(o => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, oic_name: o.name });
                          setShowOICDropdown(false);
                        }}
                        className="w-full px-4 py-3 hover:bg-amber-50 cursor-pointer text-left border-b border-gray-100"
                      >
                        <div className="font-medium text-gray-900">{o.name}</div>
                        {o.customer_name && (
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-semibold">Customer:</span> {o.customer_name}
                          </div>
                        )}
                        {(o.contact_no || o.email) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {o.contact_no && <span className="mr-3">📞 {o.contact_no}</span>}
                            {o.email && <span>✉️ {o.email}</span>}
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      No OICs found. Add a new one below.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewOIC(true)}
                    className="w-full px-4 py-2 text-amber-600 hover:bg-amber-50 flex items-center gap-2 font-medium border-t border-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add New OIC
                  </button>
                </div>
              )}
            </div>
            </div>

            {/* New OIC Form */}
            {showNewOIC && (
              <div className="mt-4 p-4 bg-white border border-amber-300 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Add New OIC</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
                    <select
                      value={newOICCustomerId}
                      onChange={(e) => setNewOICCustomerId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">OIC Name *</label>
                    <input
                      type="text"
                      value={newOICName}
                      onChange={(e) => setNewOICName(e.target.value)}
                      placeholder="Enter OIC name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={newOICContact}
                      onChange={(e) => setNewOICContact(e.target.value)}
                      placeholder="Enter contact number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newOICEmail}
                      onChange={(e) => setNewOICEmail(e.target.value)}
                      placeholder="Enter email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddOIC}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Add OIC
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewOIC(false);
                      setNewOICName('');
                      setNewOICCustomerId(0);
                      setNewOICContact('');
                      setNewOICEmail('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 5. Remarks Section */}
          <section className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">5. Remarks / Notes (Optional)</h3>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Add any remarks or notes..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </section>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isEditDisabled}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:bg-gray-400"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : isEditing ? 'Update Opportunity' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
