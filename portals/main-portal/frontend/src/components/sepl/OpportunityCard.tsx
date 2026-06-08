import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Folder,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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
  current_stage: string;
  status: string;
  loss_reason?: string;
  remarks?: string;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  onEdit: (opp: Opportunity) => void;
  onDelete: (id: number) => void;
  onMoveStage: (id: number, toStage: string, remarks?: string, lossReason?: string) => void;
  compact?: boolean;
  isArchived?: boolean;
}

const STAGES = [
  'New / Identified',
  'Bid Submitted',
  'Under Evaluation',
  'Negotiation',
  'Won',
  'Lost',
];

export function OpportunityCard({
  opportunity,
  onEdit,
  onDelete,
  onMoveStage,
  compact = false,
  isArchived = false,
}: OpportunityCardProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [moveRemarks, setMoveRemarks] = useState('');
  const [lossReason, setLossReason] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleMove = (toStage: string) => {
    if (toStage === 'Lost') {
      const reason = prompt('Please provide loss reason:');
      if (!reason) return;
      onMoveStage(opportunity.id, toStage, moveRemarks, reason);
    } else {
      onMoveStage(opportunity.id, toStage, moveRemarks);
    }
    setShowMoveMenu(false);
    setMoveRemarks('');
  };

  const availableStages = STAGES.filter((s) => s !== opportunity.current_stage);

  return (
    <div
      className={`bg-white rounded-lg border-2 ${
        opportunity.status === 'Won'
          ? 'border-green-300 bg-green-50'
          : opportunity.status === 'Lost'
          ? 'border-red-300 bg-red-50'
          : 'border-gray-200'
      } p-4 hover:shadow-lg transition ${compact ? '' : 'mb-4'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {!compact && opportunity.project_domain && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Folder className="w-4 h-4" />
              {opportunity.project_domain}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 mb-2">
            <DollarSign className="w-4 h-4" />
            {opportunity.currency} {opportunity.estimated_value.toLocaleString()}
          </div>

          {!compact && opportunity.assigned_owner_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <User className="w-4 h-4" />
              {opportunity.assigned_owner_name}
            </div>
          )}

          {opportunity.expected_closure_date && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              Due: {new Date(opportunity.expected_closure_date).toLocaleDateString()}
            </div>
          )}

          {opportunity.loss_reason && (
            <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
              <strong>Loss Reason:</strong> {opportunity.loss_reason}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!isArchived && (
            <>
              <button
                onClick={() => onEdit(opportunity)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(opportunity.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {!isArchived && opportunity.status !== 'Won' && opportunity.status !== 'Lost' && (
        <div className="mt-4 border-t pt-3">
          <button
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition text-sm font-semibold"
          >
            <span className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Move to Stage
            </span>
            {showMoveMenu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMoveMenu && (
            <div className="mt-2 space-y-2">
              {availableStages.map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleMove(stage)}
                  className={`w-full px-3 py-2 text-left text-sm rounded transition ${
                    stage === 'Won'
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : stage === 'Lost'
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
