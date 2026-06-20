import React, { useState, useEffect, useContext, useRef } from 'react';
import { X, Save, Loader, Plus } from 'lucide-react';
import { seplApi, usersApi } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { INDIA_STATE_NAMES, getCitiesForState } from '../../data/indiaStatesCities';

// Format date to YYYY-MM-DD for date input
const formatDateForInput = (dateValue: any): string => {
  if (!dateValue) return '';
  if (typeof dateValue === 'string') {
    // If it's already in YYYY-MM-DD format, return as is
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) return dateValue;
    // Try to parse and format
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  return '';
};

const REQUIREMENT_TYPES = ['Cloud', 'Software', 'License', 'Hardware', 'Turnkey', 'Manpower/Consulting', 'Hardware with Licenses'];
const TENDER_PRODUCT_OPTIONS = ['Cloud', 'Hardware', 'Licenses', 'Development', 'Security'];

const getTenderProductOptionValue = (value?: string): string => {
  const trimmedValue = `${value || ''}`.trim();
  return TENDER_PRODUCT_OPTIONS.find((option) => option.toLowerCase() === trimmedValue.toLowerCase()) || '';
};

const splitTenderProductNames = (value?: string): string[] =>
  `${value || ''}`
    .split(',')
    .map(getTenderProductOptionValue)
    .filter(Boolean);

// Keep numeric inputs clean (digits and a single dot)
const sanitizeNumberInput = (value: string): string => {
  const cleaned = (value || '').replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  const [first, ...rest] = parts;
  return `${first}.${rest.join('').replace(/\./g, '')}`;
};

interface Product {
  id: number;
  name: string;
}

interface OEM {
  id: number;
  name: string;
}

interface TenderRequirementItem {
  id: string;
  productName: string;
  oemName: string;
  quantity: number;
}

interface OIC {
  id: number;
  name: string;
  customer_id?: number;
  customer_name?: string;
  contact_no?: string;
  email?: string;
}

interface Customer {
  id: number;
  name: string;
  alias?: string;
}

interface Opportunity {
  id?: number;
  customer_name: string;
  customer_alias?: string;
  state?: string;
  city?: string;
  tender_number?: string;
  tender_name?: string;
  requirement_type?: string;
  eligible?: boolean | number;
  tender_publish_date?: string;
  pre_bid_date?: string;
  due_date?: string;
  submission_end_date?: string;
  estimated_value: number;
  contract_year?: number;
  contract_month?: number;
  ra?: number;
  ra_type?: string;
  emd?: number;
  emd_value?: string;
  emd_exemption?: string;
  epbg?: number;
  epbg_value?: string;
  tender_fees?: string;
  product_id?: number;
  product_name?: string;
  oem_id?: number;
  oem_name?: string;
  quantity?: number;
  oic_id?: number;
  oic_name?: string;
  remarks?: string;
  created_date: string;
  current_stage?: string;
  status?: string;
}

interface OpportunityFormProps {
  opportunity: Opportunity | null;
  onSave: () => void;
  onClose: () => void;
}

export function OpportunityForm({ opportunity, onSave, onClose }: OpportunityFormProps) {
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.user;

  const [formData, setFormData] = useState<Opportunity>({
    customer_name: '',
    customer_alias: '',
    state: '',
    city: '',
    tender_number: '',
    tender_name: '',
    requirement_type: '',
    eligible: false,
    tender_publish_date: '',
    pre_bid_date: '',
    due_date: '',
    submission_end_date: '',
    estimated_value: 0,
    contract_year: 0,
    contract_month: 0,
    ra: 0,
    ra_type: '',
    emd: 0,
    emd_value: '',
    emd_exemption: 'no',
    epbg: 0,
    epbg_value: '',
    tender_fees: '',
    product_id: undefined,
    product_name: '',
    oem_id: undefined,
    oem_name: '',
    quantity: 0,
    oic_id: undefined,
    oic_name: '',
    remarks: '',
    created_date: new Date().toISOString().split('T')[0],
    current_stage: 'New / Identified',
    status: 'Bucket-Active',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [oems, setOEMs] = useState<OEM[]>([]);
  const [oics, setOICs] = useState<OIC[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewOIC, setShowNewOIC] = useState(false);
  const [tenderRequirementItems, setTenderRequirementItems] = useState<TenderRequirementItem[]>([]);
  const [tenderRequirementsTouched, setTenderRequirementsTouched] = useState(false);
  const [newOICName, setNewOICName] = useState('');
  const [newOICCustomerId, setNewOICCustomerId] = useState(0);
  const [newOICCustomerQuery, setNewOICCustomerQuery] = useState('');
  const [showOICCustomerDropdown, setShowOICCustomerDropdown] = useState(false);
  const [newOICContact, setNewOICContact] = useState('');
  const [newOICEmail, setNewOICEmail] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerAlias, setNewCustomerAlias] = useState('');
  const [currentRemarkInput, setCurrentRemarkInput] = useState('');
  const [originalRemarks, setOriginalRemarks] = useState('');
  const customerDropdownRef = useRef<HTMLDivElement | null>(null);
  const oicCustomerDropdownRef = useRef<HTMLDivElement | null>(null);

  const buildTenderRequirementItems = (source: Opportunity): TenderRequirementItem[] => {
    const productNames = splitTenderProductNames(source.product_name);

    return productNames.map((productName, index) => ({
      id: `existing-${index}`,
      productName,
      oemName: '',
      quantity: 0,
    })).filter((item) => item.productName);
  };

  const serializeTenderRequirementItems = (items: TenderRequirementItem[]) => ({
    product_name: items.map((item) => item.productName).filter(Boolean).join(', '),
    oem_name: '',
    quantity: 0,
  });

  useEffect(() => {
    loadMasters();
    if (opportunity) {
      // Format dates properly for date inputs
      const formattedData = {
        ...opportunity,
        tender_publish_date: formatDateForInput((opportunity as any).tender_publish_date),
        pre_bid_date: formatDateForInput(opportunity.pre_bid_date),
        due_date: formatDateForInput(opportunity.due_date),
        submission_end_date: formatDateForInput(opportunity.submission_end_date),
        created_date: formatDateForInput(opportunity.created_date),
      };
      setFormData(formattedData);
      setTenderRequirementItems(buildTenderRequirementItems(formattedData));
      setTenderRequirementsTouched(false);
      setOriginalRemarks(opportunity.remarks || '');
      setCurrentRemarkInput('');
    } else {
      setTenderRequirementItems([]);
      setTenderRequirementsTouched(false);
      setOriginalRemarks('');
      setCurrentRemarkInput('');
    }
  }, [opportunity, currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }

      if (
        oicCustomerDropdownRef.current &&
        !oicCustomerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowOICCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadMasters = async () => {
    try {
      const [productsRes, oemsRes, oicsRes, customersRes] = await Promise.all([
        seplApi.listProducts(),
        seplApi.listOEMs(),
        seplApi.listOICs(),
        seplApi.listCustomers(),
      ]);
      setProducts(productsRes?.data || []);
      setOEMs(oemsRes?.data || []);
      // Fetch OICs from Project OIC
      const oicsList = oicsRes?.data || [];
      setOICs(oicsList);
      setCustomers(customersRes?.data || []);
    } catch (err) {
      console.error('Error loading masters:', err);
      setProducts([]);
      setOEMs([]);
      setOICs([]);
      setCustomers([]);
    }
  };

  const handleAddProduct = () => {
    const selectedProductName = getTenderProductOptionValue(formData.product_name);
    if (!selectedProductName) return;

    const newTenderRequirementItem: TenderRequirementItem = {
      id: `${Date.now()}-${selectedProductName}`,
      productName: selectedProductName,
      oemName: '',
      quantity: 0,
    };

    setTenderRequirementItems((currentItems) => {
      const alreadyAdded = currentItems.some((item) => item.productName.toLowerCase() === selectedProductName.toLowerCase());
      return alreadyAdded ? currentItems : [...currentItems, newTenderRequirementItem];
    });
    setTenderRequirementsTouched(true);
    setFormData((currentFormData) => ({ ...currentFormData, product_name: '', oem_name: '' }));
  };

  const handleAddOIC = async () => {
    if (!newOICName.trim()) {
      alert('OIC name is required');
      return;
    }
    let customerId = newOICCustomerId;
    let customerName = customers.find((c) => c.id === customerId)?.name || '';

    if (!customerId && newOICCustomerQuery.trim()) {
      const exactMatch = customers.find(
        (c) => c.name.trim().toLowerCase() === newOICCustomerQuery.trim().toLowerCase()
      );
      if (exactMatch) {
        customerId = exactMatch.id;
        customerName = exactMatch.name;
      } else {
        try {
          const createdCustomerResp = await seplApi.createCustomer({
            name: newOICCustomerQuery.trim(),
            alias: '',
          });
          const createdCustomerPayload = createdCustomerResp?.data?.data || createdCustomerResp?.data || {};
          const createdCustomer: Customer = {
            id: Number(createdCustomerPayload.id) || Date.now(),
            name: `${createdCustomerPayload.name || createdCustomerPayload.customer_name || newOICCustomerQuery.trim()}`.trim(),
            alias: `${createdCustomerPayload.alias || ''}`.trim(),
          };
          setCustomers((current) => [createdCustomer, ...(Array.isArray(current) ? current : [])]);
          customerId = createdCustomer.id;
          customerName = createdCustomer.name;
        } catch (createCustomerErr) {
          console.error('Error adding customer for OIC:', createCustomerErr);
          alert('Failed to add customer. Please try again.');
          return;
        }
      }
    }

    if (!customerId) {
      alert('Please select or add a customer for the OIC');
      return;
    }
    
    try {
      // Save to database
      const response = await seplApi.createOIC({
        name: newOICName,
        customer_id: customerId,
        contact_no: newOICContact || '',
        email: newOICEmail || ''
      });
      
      const newOIC: OIC = {
        id: response.data.id,
        name: newOICName,
        customer_id: customerId,
        customer_name: customerName,
        contact_no: newOICContact,
        email: newOICEmail
      };
      
      setOICs([...safeOics, newOIC]);
      setFormData({ ...formData, oic_name: newOICName });
      setShowNewOIC(false);
      setNewOICName('');
      setNewOICCustomerId(0);
      setNewOICCustomerQuery('');
      setShowOICCustomerDropdown(false);
      setNewOICContact('');
      setNewOICEmail('');
      
      alert('OIC added successfully');
    } catch (err) {
      console.error('Error adding OIC:', err);
      alert('Failed to add OIC. Please try again.');
    }
  };

  const handleAddRemark = () => {
    if (!currentRemarkInput.trim()) return;
    
    const dateFormatter = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    });
    const userName = currentUser?.name || 'Unknown User';
    
    const newRemarkEntry = `[${dateFormatter} - User: ${userName}] ${currentRemarkInput.trim()}`;
    const updatedRemarks = originalRemarks 
      ? `${originalRemarks}\n${newRemarkEntry}` 
      : newRemarkEntry;
    
    setFormData({ ...formData, remarks: updatedRemarks });
    setOriginalRemarks(updatedRemarks);
    setCurrentRemarkInput('');
  };

  const focusFieldError = (field: string) => {
    if (!field) return;
    const fieldContainer = document.querySelector(`[data-field="${field}"]`) as HTMLElement | null;
    if (!fieldContainer) return;

    fieldContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = fieldContainer.querySelector('input, select, textarea') as HTMLElement | null;
    focusable?.focus();
  };

  const mapServerErrorToFieldErrors = (errorMessage: string, backendField?: string): Record<string, string> => {
    const message = (errorMessage || '').toLowerCase();
    const mapped: Record<string, string> = {};

    if (backendField) {
      mapped[backendField] = errorMessage || 'Invalid value';
      return mapped;
    }

    if (message.includes('customer')) mapped.customer_name = errorMessage;
    if (message.includes('tender number')) mapped.tender_number = errorMessage;
    if (message.includes('tender name')) mapped.tender_name = errorMessage;
    if (message.includes('pre-bid')) mapped.pre_bid_date = errorMessage;
    if (message.includes('due date')) mapped.due_date = errorMessage;
    if (message.includes('submission end')) mapped.submission_end_date = errorMessage;
    if (message.includes('estimated value')) mapped.estimated_value = errorMessage;
    if (message.includes('ra option') || message.includes('ra type')) mapped.ra_type = errorMessage;
    if (message.includes('emd value')) mapped.emd_value = errorMessage;
    if (message.includes('epbg value') || message.includes('e-pbg value')) mapped.epbg_value = errorMessage;
    if (message.includes('tender fees')) mapped.tender_fees = errorMessage;
    if (message.includes('state')) mapped.state = errorMessage;
    if (message.includes('city')) mapped.city = errorMessage;
    if (message.includes('product')) mapped.product_name = errorMessage;
    if (message.includes('oem')) mapped.oem_name = errorMessage;
    if (message.includes('oic')) mapped.oic_name = errorMessage;

    return mapped;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setErrors({});
      
      // Validate only format/consistency (no mandatory fields)
      const newErrors: Record<string, string> = {};

      const publishDate = formData.tender_publish_date ? new Date(formData.tender_publish_date) : null;
      const dateBeforePublish = (value?: string) => publishDate && value ? new Date(value) < publishDate : false;

      if (dateBeforePublish(formData.pre_bid_date)) {
        newErrors.pre_bid_date = 'Pre-Bid Date cannot be earlier than Tender Publish Date';
      }
      if (dateBeforePublish(formData.due_date)) {
        newErrors.due_date = 'SEPL Due Date cannot be earlier than Tender Publish Date';
      }
      if (dateBeforePublish(formData.submission_end_date)) {
        newErrors.submission_end_date = 'Submission End Date cannot be earlier than Tender Publish Date';
      }

      const ensureNumeric = (value: any) => value === undefined || value === null || value === '' || !isNaN(Number(value));
      if (!ensureNumeric(formData.estimated_value)) {
        newErrors.estimated_value = 'Estimated Value must be a number';
      }
      if (formData.emd_value && !ensureNumeric(formData.emd_value)) {
        newErrors.emd_value = 'EMD Value must be a number';
      }
      if (formData.epbg_value && !ensureNumeric(formData.epbg_value)) {
        newErrors.epbg_value = 'ePBG Value must be a number';
      }
      if (formData.tender_fees && !ensureNumeric(formData.tender_fees)) {
        newErrors.tender_fees = 'Tender Fees / Other Cost must be a number';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        focusFieldError(Object.keys(newErrors)[0]);
        setSaving(false);
        return;
      }

      const serializedTenderRequirements = tenderRequirementItems.length > 0 || tenderRequirementsTouched
        ? serializeTenderRequirementItems(tenderRequirementItems)
        : null;
      
      // Build clean object without title, reference_number, client_name
      const cleanData: any = {
        id: formData.id,
        customer_name: formData.customer_name,
        customer_alias: formData.customer_alias,
        state: formData.state,
        city: formData.city,
        tender_number: formData.tender_number,
        tender_name: formData.tender_name,
        requirement_type: formData.requirement_type,
        eligible: formData.eligible,
        tender_publish_date: formData.tender_publish_date,
        pre_bid_date: formData.pre_bid_date,
        due_date: formData.due_date,
        submission_end_date: formData.submission_end_date,
        estimated_value: formData.estimated_value,
        contract_year: formData.contract_year,
        contract_month: formData.contract_month,
        ra: formData.ra,
        ra_type: formData.ra_type,
        emd: formData.emd,
        emd_value: formData.emd_value,
        emd_exemption: formData.emd_exemption === 'exemption' ? 1 : 0,
        epbg: formData.epbg,
        epbg_value: formData.epbg_value,
        tender_fees: formData.tender_fees,
        product_name: serializedTenderRequirements?.product_name ?? splitTenderProductNames(formData.product_name).join(', '),
        oem_name: serializedTenderRequirements?.oem_name ?? '',
        quantity: Number(formData.quantity) || 0,
        oic_name: formData.oic_name,
        remarks: formData.remarks,
        created_date: formData.created_date,
        current_stage: formData.current_stage,
        status: formData.status,
      };
      
      if (formData.id) {
        await seplApi.updateOpportunity(formData.id, cleanData);
      } else {
        await seplApi.createOpportunity(cleanData);
      }
      onSave();
    } catch (err) {
      console.error('Error saving opportunity:', err);
      const serverError = (err as any)?.response?.data?.error || 'Failed to save opportunity';
      const serverField = (err as any)?.response?.data?.field;
      const fieldErrors = mapServerErrorToFieldErrors(serverError, serverField);

      if (Object.keys(fieldErrors).length > 0) {
        setErrors({ ...fieldErrors, form: serverError });
        focusFieldError(Object.keys(fieldErrors)[0]);
      } else {
        setErrors({ form: serverError });
      }
    } finally {
      setSaving(false);
    }
  };

  const stateOptions = INDIA_STATE_NAMES;
  const cityOptions = getCitiesForState(formData?.state);

  // Ensure arrays are never undefined
  const safeProducts = products || [];
  const safeOems = oems || [];
  const safeOics = oics || [];
  const safeRequirementTypes = REQUIREMENT_TYPES || [];
  const safeStateOptions = (formData?.state && !stateOptions.includes(formData.state))
    ? [formData.state, ...stateOptions]
    : stateOptions;
  const safeCityOptions = (formData?.city && !cityOptions.includes(formData.city))
    ? [formData.city, ...cityOptions]
    : cityOptions;
  const filteredOICCustomers = (customers || []).filter((customer) =>
    `${customer?.name || ''}`.toLowerCase().includes(newOICCustomerQuery.toLowerCase()) ||
    `${customer?.alias || ''}`.toLowerCase().includes(newOICCustomerQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[95vh]">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {formData.id ? 'Edit Opportunity' : 'Create New Opportunity'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto flex-1">
          {errors.form && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
              {errors.form}
            </div>
          )}
          {/* 1. Customer Details */}
          <section className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-bold text-blue-900 mb-4">1. Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div data-field="customer_name">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
                <div className="relative" ref={customerDropdownRef}>
                  <input
                    type="text"
                    value={formData.customer_name || customerQuery}
                    onChange={(e) => {
                      setCustomerQuery(e.target.value);
                      setShowCustomerDropdown(true);
                      setFormData({ ...formData, customer_name: e.target.value });
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Type to search customers..."
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 border-gray-300 focus:ring-blue-500 ${errors.customer_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {(customers || [])
                        .filter((c) => (customerQuery || '').trim() === '' ||
                          c.name?.toLowerCase().includes((customerQuery || '').toLowerCase()) ||
                          (c.alias || '').toLowerCase().includes((customerQuery || '').toLowerCase()))
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, customer_name: c.name, customer_alias: c.alias || '' });
                              setCustomerQuery(c.name);
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                          >
                            <div className="font-medium text-gray-900">{c.name}</div>
                            {c.alias && <div className="text-xs text-gray-500">{c.alias}</div>}
                          </button>
                        ))}
                      {(customers || []).length === 0 && (
                        <div className="px-4 py-2 text-gray-500 text-sm">No customers found</div>
                      )}
                    </div>
                  )}
                </div>
                {errors.customer_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Alias</label>
                <input
                  type="text"
                  value={formData.customer_alias || ''}
                  onChange={(e) => setFormData({ ...formData, customer_alias: e.target.value })}
                  placeholder="e.g., DoIT"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div data-field="state">
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <select
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select State</option>
                  {(safeStateOptions || []).map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                )}
              </div>
              <div data-field="city">
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <select
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!formData.state}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${errors.city ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select City</option>
                  {(safeCityOptions || []).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>
            </div>
          </section>

          {/* 2. Tender Details */}
          <section className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
            <h3 className="text-lg font-bold text-purple-900 mb-4">2. Tender Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div data-field="tender_number">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tender Number</label>
                <input
                  type="text"
                  value={formData.tender_number || ''}
                  onChange={(e) => setFormData({ ...formData, tender_number: e.target.value })}
                  placeholder="e.g., GEM/2024/B/5141486"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.tender_number ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.tender_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.tender_number}</p>
                )}
              </div>
              <div data-field="tender_name">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tender Name</label>
                <input
                  type="text"
                  value={formData.tender_name || ''}
                  onChange={(e) => setFormData({ ...formData, tender_name: e.target.value })}
                  placeholder="e.g., Cloud Infrastructure Services"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.tender_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.tender_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.tender_name}</p>
                )}
              </div>
              <div data-field="requirement_type">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Requirement Type</label>
                <select
                  value={formData.requirement_type || ''}
                  onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.requirement_type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Type</option>
                  {(safeRequirementTypes || []).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.requirement_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.requirement_type}</p>
                )}
              </div>
              <div data-field="tender_publish_date">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tender Publish Date</label>
                <input
                  type="date"
                  max="9999-12-31"
                  value={formData.tender_publish_date || ''}
                  onChange={(e) => setFormData({ ...formData, tender_publish_date: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.tender_publish_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.tender_publish_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.tender_publish_date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Eligible</label>
                <select
                  value={formData.eligible ? 'yes' : 'no'}
                  onChange={(e) => setFormData({ ...formData, eligible: e.target.value === 'yes' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div data-field="pre_bid_date">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pre-Bid Date</label>
                <input
                  type="date"
                  max="9999-12-31"
                  value={formData.pre_bid_date || ''}
                  onChange={(e) => setFormData({ ...formData, pre_bid_date: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.pre_bid_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.pre_bid_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.pre_bid_date}</p>
                )}
              </div>
              <div data-field="due_date">
                <label className="block text-sm font-semibold text-gray-700 mb-2">SEPL Due Date</label>
                <input
                  type="date"
                  max="9999-12-31"
                  value={formData.due_date || ''}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.due_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.due_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>
                )}
              </div>
              <div data-field="submission_end_date">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Submission End Date</label>
                <input
                  type="date"
                  max="9999-12-31"
                  value={formData.submission_end_date || ''}
                  onChange={(e) => setFormData({ ...formData, submission_end_date: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.submission_end_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.submission_end_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.submission_end_date}</p>
                )}
              </div>
              <div data-field="estimated_value">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Value</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.estimated_value || ''}
                  onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(sanitizeNumberInput(e.target.value)) || 0 })}
                  onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                  placeholder="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.estimated_value ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.estimated_value && (
                  <p className="text-red-500 text-sm mt-1">{errors.estimated_value}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contract Period (Years)</label>
                <input
                  type="number"
                  value={formData.contract_year || 0}
                  onChange={(e) => setFormData({ ...formData, contract_year: parseInt(e.target.value) || 0 })}
                  onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                {formData.ra === 1 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">RA Option</label>
                    <select
                      value={formData.ra_type || ''}
                      onChange={(e) => setFormData({ ...formData, ra_type: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.ra_type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select an option</option>
                      <option value="50% Lowest Price">50% Lowest Price</option>
                      <option value="H1 – Highest Price Elimination">H1 – Highest Price Elimination</option>
                    </select>
                    {errors.ra_type && (
                      <p className="text-red-500 text-sm mt-1">{errors.ra_type}</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contract Period (Months)</label>
                <input
                  type="number"
                  value={formData.contract_month || 0}
                  onChange={(e) => setFormData({ ...formData, contract_month: parseInt(e.target.value) || 0 })}
                  onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                  min="0"
                  max="11"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">RA (Yes / No)</label>
                <select
                  value={formData.ra ? 'yes' : 'no'}
                  onChange={(e) => setFormData({ ...formData, ra: e.target.value === 'yes' ? 1 : 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">EMD (Yes / No / Exemption)</label>
                <select
                  value={formData.emd_exemption === 'exemption' ? 'exemption' : formData.emd ? 'yes' : 'no'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'yes') {
                      setFormData({ ...formData, emd: 1, emd_exemption: 'no' });
                    } else if (val === 'exemption') {
                      setFormData({ ...formData, emd: 0, emd_exemption: 'exemption' });
                    } else {
                      setFormData({ ...formData, emd: 0, emd_exemption: 'no' });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                  <option value="exemption">Exemption</option>
                </select>
              </div>
              <div data-field="emd_value">
                <label className="block text-sm font-semibold text-gray-700 mb-2">EMD Value</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.emd_value || ''}
                  onChange={(e) => setFormData({ ...formData, emd_value: sanitizeNumberInput(e.target.value) })}
                  onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                  placeholder="e.g., 50000"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.emd_value ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.emd_value && (
                  <p className="text-red-500 text-sm mt-1">{errors.emd_value}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ePBG (Yes / No)</label>
                <select
                  value={formData.epbg ? 'yes' : 'no'}
                  onChange={(e) => setFormData({ ...formData, epbg: e.target.value === 'yes' ? 1 : 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div data-field="epbg_value">
                <label className="block text-sm font-semibold text-gray-700 mb-2">ePBG Value (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.epbg_value || ''}
                  onChange={(e) => setFormData({ ...formData, epbg_value: sanitizeNumberInput(e.target.value) })}
                  onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                  placeholder="e.g., 2.5"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.epbg_value ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.epbg_value && (
                  <p className="text-red-500 text-sm mt-1">{errors.epbg_value}</p>
                )}
              </div>
              <div data-field="tender_fees">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tender Fees / Other Cost (INR)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.tender_fees || ''}
                  onChange={(e) => setFormData({ ...formData, tender_fees: sanitizeNumberInput(e.target.value) })}
                  onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                  placeholder="e.g., 5000 (Tender fees, Registration fees, etc.)"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.tender_fees ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.tender_fees && (
                  <p className="text-red-500 text-sm mt-1">{errors.tender_fees}</p>
                )}
              </div>
            </div>
          </section>

          {/* 3. Tender Requirements */}
          <section className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
            <h3 className="text-lg font-bold text-green-900 mb-4">3. Tender Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div data-field="product_name">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product / Service</label>
                <select
                  value={formData.product_name || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, product_name: e.target.value, oem_name: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.product_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Product</option>
                  {TENDER_PRODUCT_OPTIONS.map((productName) => (
                    <option key={productName} value={productName}>{productName}</option>
                  ))}
                </select>
                {errors.product_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.product_name}</p>
                )}
              </div>
              <div data-field="quantity">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity || 0}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add New Product
            </button>

            {tenderRequirementItems.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-lg border border-green-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-green-50 text-green-900">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Product / Service</th>
                      <th className="px-3 py-2 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenderRequirementItems.map((item) => (
                      <tr key={item.id} className="border-t border-green-100">
                        <td className="px-3 py-2 text-gray-900">{item.productName}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setTenderRequirementItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
                              setTenderRequirementsTouched(true);
                            }}
                            className="px-3 py-1 text-xs font-semibold text-red-700 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {/* 4. OIC Details */}
          <section className="border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
            <h3 className="text-lg font-bold text-indigo-900 mb-2">4. OIC Details (Optional)</h3>
            <p className="text-sm text-indigo-700 mb-4">You can leave OIC details blank and still save the opportunity.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div data-field="oic_name">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select OIC</label>
                <select
                  value={formData.oic_name || ''}
                  onChange={(e) => setFormData({ ...formData, oic_name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.oic_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select OIC</option>
                  {(safeOics || []).map((oic) => (
                    <option key={oic.id} value={oic.name}>
                      {oic.name}{oic.customer_name ? ` (${oic.customer_name})` : ''}
                    </option>
                  ))}
                </select>
                {errors.oic_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.oic_name}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNewOIC(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add New OIC
            </button>
          </section>

          {/* Add New OIC Modal */}
          {showNewOIC && (
            <div className="border-2 border-indigo-300 rounded-lg p-4 bg-indigo-100 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Add New OIC</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
                  <div className="relative" ref={oicCustomerDropdownRef}>
                    <input
                      type="text"
                      value={newOICCustomerQuery}
                      onChange={(e) => {
                        setNewOICCustomerQuery(e.target.value);
                        setNewOICCustomerId(0);
                        setShowOICCustomerDropdown(true);
                      }}
                      onFocus={() => setShowOICCustomerDropdown(true)}
                      placeholder="Type to search or add customer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    {showOICCustomerDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                        {filteredOICCustomers.map((customer) => (
                          <button
                            key={customer.id || customer.name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewOICCustomerId(customer.id);
                              setNewOICCustomerQuery(customer.name);
                              setShowOICCustomerDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 border-b border-gray-100"
                          >
                            <div className="text-sm font-medium text-gray-900">{customer.name || 'Unnamed Customer'}</div>
                            {customer.alias && <div className="text-xs text-gray-500">{customer.alias}</div>}
                          </button>
                        ))}
                        {filteredOICCustomers.length === 0 && newOICCustomerQuery.trim() && (
                          <div className="px-3 py-2 text-xs text-gray-500">No customer found. Customer will be created when you add OIC.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">OIC Name *</label>
                  <input
                    type="text"
                    value={newOICName}
                    onChange={(e) => setNewOICName(e.target.value)}
                    placeholder="Enter OIC name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number (Optional)</label>
                  <input
                    type="text"
                    value={newOICContact}
                    onChange={(e) => setNewOICContact(e.target.value)}
                    maxLength={12}
                    placeholder="Enter contact number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={newOICEmail}
                    onChange={(e) => setNewOICEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddOIC}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add OIC
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewOIC(false);
                    setNewOICName('');
                    setNewOICCustomerId(0);
                    setNewOICCustomerQuery('');
                    setShowOICCustomerDropdown(false);
                    setNewOICContact('');
                    setNewOICEmail('');
                  }}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* 5. Remarks */}
          <section className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
            <h3 className="text-lg font-bold text-orange-900 mb-4">5. Remarks / Notes</h3>
            <div className="space-y-4">
              {/* Existing remarks display */}
              {formData.remarks && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Previous Remarks</label>
                  <div 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap"
                  >
                    {formData.remarks.replace(/<br>/g, '\n')}
                  </div>
                </div>
              )}
              
              {/* New remark input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Add New Remark (Optional)</label>
                <div className="flex gap-2">
                  <textarea
                    value={currentRemarkInput}
                    onChange={(e) => setCurrentRemarkInput(e.target.value)}
                    placeholder="Type your remark here..."
                    rows={3}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRemark}
                    disabled={!currentRemarkInput.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed h-fit"
                  >
                    Add Remark
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Your user ID and timestamp will be automatically added to the remark.</p>
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 bg-white pb-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Opportunity
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
