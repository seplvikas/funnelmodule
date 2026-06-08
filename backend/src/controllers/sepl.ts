import { Response } from 'express';
import { executeQuery } from '../config/database';
import { executeFunnelQuery, isFunnelConnected } from '../config/funnelDatabase';
import { AuthenticatedRequest } from '../middleware/auth';

function getNumericUserId(req: AuthenticatedRequest): number | null {
  const userId = Number(req.user?.id);
  return Number.isNaN(userId) ? null : userId;
}

function checkFunnelDatabase(res: Response): boolean {
  if (!isFunnelConnected()) {
    res.status(503).json({ error: 'Funnel database is not available. Please contact administrator.' });
    return false;
  }
  return true;
}

// Check if user can view SEPL
export async function canViewSEPL(userId: number): Promise<boolean> {
  try {
    const result: any = await executeQuery(
      'SELECT can_view_sepl, is_admin FROM user_permissions WHERE user_id = ?',
      [userId]
    );
    return result[0]?.is_admin || result[0]?.can_view_sepl || false;
  } catch (err) {
    console.error('Error checking SEPL view permission:', err);
    return false;
  }
}

// Check if user can create SEPL opportunities
export async function canCreateSEPL(userId: number): Promise<boolean> {
  try {
    const result: any = await executeQuery(
      'SELECT can_create_sepl, can_view_sepl, is_admin FROM user_permissions WHERE user_id = ?',
      [userId]
    );
    return result[0]?.is_admin || result[0]?.can_create_sepl || result[0]?.can_view_sepl || false;
  } catch (err) {
    console.error('Error checking SEPL create permission:', err);
    return false;
  }
}

// Check if user can delete SEPL opportunities
export async function canDeleteSEPL(userId: number): Promise<boolean> {
  try {
    const result: any = await executeQuery(
      'SELECT can_delete_sepl, can_view_sepl, is_admin FROM user_permissions WHERE user_id = ?',
      [userId]
    );
    return result[0]?.is_admin || result[0]?.can_delete_sepl || result[0]?.can_view_sepl || false;
  } catch (err) {
    console.error('Error checking SEPL delete permission:', err);
    return false;
  }
}

// List all opportunities
export async function listOpportunities(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canViewSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { stage, status } = req.query;
    
    let query = `SELECT id, customer_name, customer_alias, state, city,
                 tender_number, tender_name, requirement_type, eligible, submission_end_date, submission_date,
                 tender_publish_date, pre_bid_date, due_date, estimated_value, contract_year, contract_month,
                 ra, ra_type, emd, emd_value, emd_exemption, epbg, epbg_value, tender_fees,
                 product_name, oem_name, quantity, oic_name,
                 remarks, current_stage, status, created_date, created_at, updated_at,
                 created_by_id, created_by_email, assigned_owner_id, assigned_owner_name, assigned_owner_email,
                 loss_reason, archived_reason, pricing_model, quotation_amount, gst_inclusive, l1_cost, l1_company_name
                 FROM sepl_opportunities WHERE 1=1`;
    const params: any[] = [];
    
    if (stage) {
      query += ' AND current_stage = ?';
      params.push(stage);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at ASC';
    
    const opportunities = await executeQuery(query, params);
    res.json(opportunities);
  } catch (err) {
    console.error('Error listing opportunities:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get single opportunity
export async function getOpportunity(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canViewSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    
    const opportunities: any = await executeQuery(
      `SELECT id, customer_name, customer_alias, state, city, 
      tender_number, tender_name, requirement_type, eligible,
      tender_publish_date, pre_bid_date, due_date, submission_end_date, submission_date, estimated_value,
       contract_year, contract_month, ra, ra_type, emd, emd_value, emd_exemption, epbg, epbg_value, tender_fees,
       product_name, oem_name, quantity, oic_name,
       current_stage, status, remarks, created_date, created_at, updated_at,
       created_by_id, created_by_email, assigned_owner_id, assigned_owner_name, assigned_owner_email,
       loss_reason, archived_reason, pricing_model, quotation_amount, gst_inclusive, l1_cost, l1_company_name
       FROM sepl_opportunities WHERE id = ?`,
      [id]
    );
    
    if (!opportunities.length) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    // Get stage history
    const history: any = await executeQuery(
      'SELECT * FROM sepl_stage_history WHERE opportunity_id = ? ORDER BY moved_at DESC',
      [id]
    );
    
    res.json({ ...opportunities[0], history });
  } catch (err) {
    console.error('Error getting opportunity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Create new opportunity
export async function createOpportunity(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      customer_name,
      customer_alias,
      state,
      city,
      tender_name,
      tender_number,
      requirement_type,
      eligible,
      tender_publish_date,
      pre_bid_date,
      due_date,
      submission_end_date,
      estimated_value,
      contract_year,
      contract_month,
      ra,
      ra_type,
      emd,
      emd_value,
      emd_exemption,
      epbg,
      epbg_value,
      tender_fees,
      product_name,
      oem_name,
      quantity,
      oic_name,
      current_stage = 'New / Identified',
      remarks,
      created_date
    } = req.body;

    // Convert undefined to null for optional fields
    const safeCustomerName = customer_name || null;
    const safeCustomerAlias = customer_alias || null;
    const safeState = state || null;
    const safeCity = city || null;
    const safeTenderName = tender_name || null;
    const safeTenderNumber = tender_number || null;
    const safeRequirementType = requirement_type || null;
    const safeTenderPublishDate = tender_publish_date || null;
    const safePreBidDate = pre_bid_date || null;
    const safeDueDate = due_date || null;
    const safeSubmissionEndDate = submission_end_date || null;
    const safeContractYear = contract_year || null;
    const safeContractMonth = contract_month || null;
    const safeRa = ra ?? null;
    const safeRaType = ra_type || null;
    const safeEmd = emd ?? null;
    const safeEmdValue = emd_value || null;
    const safeEmdExemption = emd_exemption || null;
    const safeEpbg = epbg ?? null;
    const safeEpbgValue = epbg_value || null;
    const safeTenderFees = tender_fees ?? null;
    const safeProductName = product_name || null;
    const safeOemName = oem_name || null;
    const safeQuantity = quantity || null;
    const safeOicName = oic_name || null;
    const safeRemarks = remarks || null;
    const safeCreatedDate = created_date || new Date().toISOString().split('T')[0];

    const result: any = await executeQuery(
      `INSERT INTO sepl_opportunities 
      (customer_name, customer_alias, state, city, tender_name, tender_number,
       requirement_type, eligible, tender_publish_date, pre_bid_date, due_date, submission_end_date,
       estimated_value, contract_year, contract_month, ra, ra_type, emd, emd_value, emd_exemption, epbg, epbg_value, tender_fees,
       product_name, oem_name, quantity, oic_name,
       current_stage, status, remarks, created_date, created_by_id, created_by_email, submission_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safeCustomerName, safeCustomerAlias, safeState, safeCity, safeTenderName, safeTenderNumber,
        safeRequirementType, eligible ? 1 : 0, safeTenderPublishDate, safePreBidDate, safeDueDate, safeSubmissionEndDate,
        estimated_value, safeContractYear, safeContractMonth, safeRa, safeRaType, safeEmd, safeEmdValue, safeEmdExemption, safeEpbg, safeEpbgValue, safeTenderFees,
        safeProductName, safeOemName, safeQuantity, safeOicName,
        current_stage, 'Bucket-Active', safeRemarks, safeCreatedDate, userId, req.user.email, new Date().toISOString().split('T')[0]
      ]
    );

    // Record initial stage
    await executeQuery(
      `INSERT INTO sepl_stage_history 
       (opportunity_id, to_stage, moved_by_id, moved_by_email, moved_by_name, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [result.insertId, current_stage, userId, req.user.email, req.user.name, 'Opportunity created']
    );

    res.status(201).json({ id: result.insertId, message: 'Opportunity created successfully' });
  } catch (err: any) {
    console.error('Error creating opportunity:', err);
    const rawMessage = err?.sqlMessage || err?.message || '';
    const fieldMatch = rawMessage.match(/for column '([^']+)'/i);
    const field = fieldMatch?.[1] || undefined;

    if (err.code === 'ER_DUP_ENTRY') {
      const raw = err.sqlMessage || '';
      const columnMatch = raw.match(/for key '([^']+)'/);
      const column = columnMatch ? columnMatch[1] : '';
      const friendly = column
        ? `Duplicate entry for unique field: ${column}. Please change that value and try again.`
        : 'This opportunity already exists in the system.';
      return res.status(400).json({ error: friendly, field });
    }
    if (err.code === 'ER_WRONG_VALUE_COUNT_ON_ROW') {
      return res.status(400).json({ error: 'Invalid request data - column/value mismatch', field });
    }
    if (err.message?.includes('Column count')) {
      return res.status(400).json({ error: 'Invalid request data structure', field });
    }
    if (err.code === 'ER_TRUNCATED_WRONG_VALUE' || err.code === 'ER_WRONG_VALUE') {
      return res.status(400).json({ error: rawMessage || 'Invalid value provided for one of the fields.', field });
    }
    if (err.code === 'ER_BAD_NULL_ERROR' || err.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ error: rawMessage || 'Invalid input data.', field });
    }
    res.status(500).json({ error: rawMessage || 'Failed to create opportunity. Please check your input data.', field });
  }
}

// Update opportunity
export async function updateOpportunity(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { status, assigned_owner_id, assigned_owner_name, assigned_owner_email } = req.body;

    // Validate status transitions based on new workflow
    if (status) {
      const currentOpp: any = await executeQuery(
        'SELECT status, assigned_owner_id FROM sepl_opportunities WHERE id = ?',
        [id]
      );

      if (currentOpp.length > 0) {
        const currentStatus = currentOpp[0].status;

        // Validate transition requirements
        // Only validate owner when TRANSITIONING TO Ongoing-Active (not when already Ongoing-Active)
        if (status === 'Ongoing-Active' && currentStatus !== 'Ongoing-Active') {
          const hasOwner = !!(assigned_owner_id || currentOpp[0].assigned_owner_id || assigned_owner_email);
          if (!hasOwner) {
            return res.status(400).json({
              error: 'Assign an owner before moving this opportunity to Ongoing.'
            });
          }
        }

        if (status === 'Bucket-Cold' || status === 'Drop') {
          if (!req.body.remarks || !`${req.body.remarks}`.trim()) {
            return res.status(400).json({ error: 'Remarks are required for this transition.' });
          }
        }

        if (status === 'Submitted') {
          // Only validate these fields if TRANSITIONING to Submitted, not if already Submitted
          if (currentStatus !== 'Submitted') {
            const { quotation_amount, submission_date, pricing_model, gst_inclusive } = req.body;
            const allowedPricing = ['Monthly', 'Yearly', 'Lumpsum'];
            if (quotation_amount === undefined || quotation_amount === null || submission_date === undefined || submission_date === null || !pricing_model || !allowedPricing.includes(pricing_model)) {
              return res.status(400).json({ error: 'Quoted price, submission date, and pricing model are required to submit.' });
            }
            if (gst_inclusive === undefined || gst_inclusive === null) {
              return res.status(400).json({ error: 'Please specify if the price is GST inclusive.' });
            }
          }
        }

        // Validate allowed transitions
        const validTransitions: { [key: string]: string[] } = {
          'Bucket-Active': ['Bucket-Cold', 'Ongoing-Active', 'Archived'],
          'Bucket-Cold': ['Bucket-Active', 'Ongoing-Active', 'Archived'],
          'Ongoing-Active': ['Submitted', 'Drop', 'Archived'],
          'Submitted': ['Won', 'Lost', 'Drop', 'Archived'],
          'Drop': ['Ongoing-Active', 'Archived'],
          'Won': ['Archived'],
          'Lost': ['Archived'],
          'Archived': ['Bucket-Active', 'Ongoing-Active']
        };

        if (status !== currentStatus && !validTransitions[currentStatus]?.includes(status)) {
          return res.status(400).json({
            error: `Invalid status transition from ${currentStatus} to ${status}`
          });
        }
      }
    }

    // Build dynamic update query only for provided fields
    const updateFields: string[] = [];
    const params: any[] = [];

    // Only add fields if they are provided in request body
    if (req.body.customer_name !== undefined) {
      updateFields.push('customer_name = ?');
      params.push(req.body.customer_name || null);
    }
    if (req.body.customer_alias !== undefined) {
      updateFields.push('customer_alias = ?');
      params.push(req.body.customer_alias || null);
    }
    if (req.body.state !== undefined) {
      updateFields.push('state = ?');
      params.push(req.body.state || null);
    }
    if (req.body.city !== undefined) {
      updateFields.push('city = ?');
      params.push(req.body.city || null);
    }
    if (req.body.tender_name !== undefined) {
      updateFields.push('tender_name = ?');
      params.push(req.body.tender_name || null);
    }
    if (req.body.tender_number !== undefined) {
      updateFields.push('tender_number = ?');
      params.push(req.body.tender_number || null);
    }
    if (req.body.requirement_type !== undefined) {
      updateFields.push('requirement_type = ?');
      params.push(req.body.requirement_type || null);
    }
    if (req.body.eligible !== undefined) {
      updateFields.push('eligible = ?');
      params.push(req.body.eligible ? 1 : 0);
    }
    if (req.body.tender_publish_date !== undefined) {
      updateFields.push('tender_publish_date = ?');
      params.push(req.body.tender_publish_date || null);
    }
    if (req.body.pre_bid_date !== undefined) {
      updateFields.push('pre_bid_date = ?');
      params.push(req.body.pre_bid_date || null);
    }
    if (req.body.due_date !== undefined) {
      updateFields.push('due_date = ?');
      params.push(req.body.due_date || null);
    }
    if (req.body.submission_end_date !== undefined) {
      updateFields.push('submission_end_date = ?');
      params.push(req.body.submission_end_date || null);
    }
    if (req.body.estimated_value !== undefined) {
      updateFields.push('estimated_value = ?');
      params.push(req.body.estimated_value || 0);
    }
    if (req.body.contract_year !== undefined) {
      updateFields.push('contract_year = ?');
      params.push(req.body.contract_year || null);
    }
    if (req.body.contract_month !== undefined) {
      updateFields.push('contract_month = ?');
      params.push(req.body.contract_month || null);
    }
    if (req.body.ra !== undefined) {
      updateFields.push('ra = ?');
      params.push(req.body.ra ?? null);
    }
    if (req.body.ra_type !== undefined) {
      updateFields.push('ra_type = ?');
      params.push(req.body.ra_type || null);
    }
    if (req.body.emd !== undefined) {
      updateFields.push('emd = ?');
      params.push(req.body.emd ?? null);
    }
    if (req.body.emd_value !== undefined) {
      updateFields.push('emd_value = ?');
      params.push(req.body.emd_value || null);
    }
    if (req.body.emd_exemption !== undefined) {
      updateFields.push('emd_exemption = ?');
      params.push(req.body.emd_exemption || null);
    }
    if (req.body.epbg !== undefined) {
      updateFields.push('epbg = ?');
      params.push(req.body.epbg ?? null);
    }
    if (req.body.epbg_value !== undefined) {
      updateFields.push('epbg_value = ?');
      params.push(req.body.epbg_value ?? null);
    }
    if (req.body.tender_fees !== undefined) {
      updateFields.push('tender_fees = ?');
      params.push(req.body.tender_fees ?? null);
    }
    if (req.body.product_name !== undefined) {
      updateFields.push('product_name = ?');
      params.push(req.body.product_name || null);
    }
    if (req.body.oem_name !== undefined) {
      updateFields.push('oem_name = ?');
      params.push(req.body.oem_name || null);
    }
    if (req.body.quantity !== undefined) {
      updateFields.push('quantity = ?');
      params.push(req.body.quantity || null);
    }
    if (req.body.oic_name !== undefined) {
      updateFields.push('oic_name = ?');
      params.push(req.body.oic_name || null);
    }
    if (req.body.remarks !== undefined) {
      updateFields.push('remarks = ?');
      params.push(req.body.remarks || null);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status || 'Bucket-Active');
    }
    if (req.body.loss_reason !== undefined) {
      updateFields.push('loss_reason = ?');
      params.push(req.body.loss_reason || null);
    }
    if (req.body.archived_reason !== undefined) {
      updateFields.push('archived_reason = ?');
      params.push(req.body.archived_reason || null);
    }
    if (assigned_owner_id !== undefined) {
      updateFields.push('assigned_owner_id = ?');
      params.push(assigned_owner_id || null);
    }
    if (assigned_owner_name !== undefined) {
      updateFields.push('assigned_owner_name = ?');
      params.push(assigned_owner_name || null);
    }
    if (assigned_owner_email !== undefined) {
      updateFields.push('assigned_owner_email = ?');
      params.push(assigned_owner_email || null);
    }
    if (req.body.current_stage !== undefined) {
      updateFields.push('current_stage = ?');
      params.push(req.body.current_stage || null);
    }
    if (req.body.pricing_model !== undefined) {
      updateFields.push('pricing_model = ?');
      params.push(req.body.pricing_model || null);
    }
    if (req.body.quotation_amount !== undefined) {
      updateFields.push('quotation_amount = ?');
      params.push(req.body.quotation_amount || null);
    }
    if (req.body.gst_inclusive !== undefined) {
      updateFields.push('gst_inclusive = ?');
      params.push(req.body.gst_inclusive ? 1 : 0);
    }

    if (req.body.submission_date !== undefined) {
      updateFields.push('submission_date = ?');
      params.push(req.body.submission_date || null);
    }

    if (req.body.l1_cost !== undefined) {
      updateFields.push('l1_cost = ?');
      params.push(req.body.l1_cost || null);
    }

    if (req.body.l1_company_name !== undefined) {
      updateFields.push('l1_company_name = ?');
      params.push(req.body.l1_company_name || null);
    }

    // If no fields to update, return error
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add ID to params array for WHERE clause
    params.push(id);

    const query = `UPDATE sepl_opportunities SET ${updateFields.join(', ')} WHERE id = ?`;
    
    console.log('Update query:', query);
    console.log('Update params:', params);

    await executeQuery(query, params);

    res.json({ message: 'Opportunity updated successfully' });
  } catch (err) {
    console.error('Error updating opportunity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Move opportunity to different stage
export async function moveStage(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { to_stage, remarks, loss_reason } = req.body;

    if (!to_stage) {
      return res.status(400).json({ error: 'Missing to_stage' });
    }

    // Validate: Owner is required when moving to "On Going" stage
    if (to_stage === 'On Going') {
      const opportunity: any = await executeQuery(
        'SELECT assigned_owner_id FROM sepl_opportunities WHERE id = ?',
        [id]
      );
      
      if (!opportunity.length) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }

      if (!opportunity[0].assigned_owner_id) {
        return res.status(400).json({ error: 'An owner must be assigned before moving to "On Going" stage' });
      }
    }

    // Get current stage
    const opportunity: any = await executeQuery(
      'SELECT current_stage, status FROM sepl_opportunities WHERE id = ?',
      [id]
    );

    if (!opportunity.length) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const from_stage = opportunity[0].current_stage;

    // Update opportunity stage and status
    let status = opportunity[0].status || 'Ongoing-Active';
    if (to_stage === 'On Going') status = 'Ongoing-Active';
    if (to_stage === 'Won') status = 'Won';
    if (to_stage === 'Lost') status = 'Lost';

    const updateParams: any[] = [to_stage, status];
    let updateQuery = 'UPDATE sepl_opportunities SET current_stage = ?, status = ?';

    if (to_stage === 'Lost' && loss_reason) {
      updateQuery += ', loss_reason = ?';
      updateParams.push(loss_reason);
    }

    if (remarks) {
      updateQuery += ', remarks = ?';
      updateParams.push(remarks);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await executeQuery(updateQuery, updateParams);

    // Record stage movement
    await executeQuery(
      `INSERT INTO sepl_stage_history 
       (opportunity_id, from_stage, to_stage, moved_by_id, moved_by_email, moved_by_name, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, from_stage, to_stage, userId, req.user.email, req.user.name, remarks || '']
    );

    res.json({ message: 'Stage moved successfully' });
  } catch (err) {
    console.error('Error moving stage:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete opportunity
export async function deleteOpportunity(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canDeleteSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    await executeQuery('DELETE FROM sepl_opportunities WHERE id = ?', [id]);
    res.json({ message: 'Opportunity deleted successfully' });
  } catch (err) {
    console.error('Error deleting opportunity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Dashboard - Overall stats
export async function getDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canViewSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get filter parameters
    const { year, startDate, endDate } = req.query;
    
    // Build WHERE clause for date filtering
    let dateFilter = '';
    const dateParams: any[] = [];
    
    if (year) {
      dateFilter = 'WHERE YEAR(created_date) = ?';
      dateParams.push(parseInt(year as string));
    } else if (startDate && endDate) {
      dateFilter = 'WHERE DATE(created_date) >= ? AND DATE(created_date) <= ?';
      dateParams.push(startDate);
      dateParams.push(endDate);
    }

    // Total opportunities
    const total: any = await executeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(estimated_value), 0) as total_value 
       FROM sepl_opportunities ${dateFilter}`,
      dateParams
    );

    // Stage-wise breakdown
    const byStage: any = await executeQuery(
      `SELECT current_stage, COUNT(*) as count, COALESCE(SUM(estimated_value), 0) as total_value 
       FROM sepl_opportunities 
       ${dateFilter}
       GROUP BY current_stage`,
      dateParams
    );

    // Active opportunities (Ongoing + Submitted)
    const active: any = await executeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(estimated_value), 0) as total_value 
       FROM sepl_opportunities 
       ${dateFilter ? dateFilter + ' AND' : 'WHERE'} status IN ('Ongoing-Active', 'Submitted')`,
      dateParams
    );

    // Won stats
    const won: any = await executeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(estimated_value), 0) as total_value 
       FROM sepl_opportunities 
       ${dateFilter ? dateFilter + ' AND' : 'WHERE'} status = 'Won'`,
      dateParams
    );

    // Lost stats
    const lost: any = await executeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(estimated_value), 0) as total_value 
       FROM sepl_opportunities 
       ${dateFilter ? dateFilter + ' AND' : 'WHERE'} status = 'Lost'`,
      dateParams
    );

    // Archived stats
    const archived: any = await executeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(estimated_value), 0) as total_value 
       FROM sepl_opportunities 
       ${dateFilter ? dateFilter + ' AND' : 'WHERE'} status = 'Archived'`,
      dateParams
    );

    // Conversion ratio (Won / Total)
    const conversionRatio = total[0].count > 0 
      ? ((won[0].count / total[0].count) * 100).toFixed(2) 
      : 0;

    res.json({
      total: total[0],
      byStage,
      active: active[0],
      won: won[0],
      lost: lost[0],
      archived: archived[0],
      conversionRatio
    });
  } catch (err) {
    console.error('Error getting dashboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get owner-wise statistics
export async function getOwnerStats(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canViewSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { ownerId, startDate, endDate } = req.query;
    
    // Build WHERE clause
    let whereClause = 'WHERE assigned_owner_id IS NOT NULL';
    const params: any[] = [];
    
    if (ownerId) {
      whereClause += ' AND assigned_owner_id = ?';
      params.push(parseInt(ownerId as string));
    }
    
    if (startDate && endDate) {
      whereClause += ' AND DATE(created_date) >= ? AND DATE(created_date) <= ?';
      params.push(startDate);
      params.push(endDate);
    }

    // Get stats by owner
    const stats: any = await executeQuery(
      `SELECT 
        assigned_owner_id,
        assigned_owner_name,
        assigned_owner_email,
        COUNT(*) as total_bids,
        SUM(CASE WHEN status = 'Won' THEN 1 ELSE 0 END) as won_count,
        SUM(CASE WHEN status = 'Lost' THEN 1 ELSE 0 END) as lost_count,
        SUM(CASE WHEN status IN ('Ongoing-Active', 'Submitted') THEN 1 ELSE 0 END) as active_count,
        COALESCE(SUM(estimated_value), 0) as total_value,
        COALESCE(SUM(CASE WHEN status = 'Won' THEN estimated_value ELSE 0 END), 0) as won_value
       FROM sepl_opportunities
       ${whereClause}
       GROUP BY assigned_owner_id, assigned_owner_name, assigned_owner_email
       ORDER BY total_bids DESC`,
      params
    );

    res.json(stats);
  } catch (err) {
    console.error('Error getting owner stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export opportunities to CSV
export async function exportOpportunities(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canViewSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { stage, status, start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM sepl_opportunities WHERE 1=1';
    const params: any[] = [];
    
    if (stage) {
      query += ' AND current_stage = ?';
      params.push(stage);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (start_date) {
      query += ' AND created_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND created_date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const opportunities: any = await executeQuery(query, params);
    
    res.json(opportunities);
  } catch (err) {
    console.error('Error exporting opportunities:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== OEM Management ====================

export async function listOEMs(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canViewSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const oems: any = await executeFunnelQuery(
      'SELECT id, name, is_active, created_on FROM oem ORDER BY name ASC'
    );
    res.json(oems);
  } catch (err) {
    console.error('Error listing OEMs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createOEM(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'OEM name is required' });
    }

    const result: any = await executeFunnelQuery(
      'INSERT INTO oem (name, is_active, created_on) VALUES (?, 1, NOW())',
      [name.trim()]
    );

    res.status(201).json({ id: result.insertId, message: 'OEM created successfully' });
  } catch (err: any) {
    console.error('Error creating OEM:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'OEM name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateOEM(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { id } = req.params;
    const { name, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'OEM name is required' });
    }

    const isActive = is_active !== undefined ? (is_active ? 1 : 0) : undefined;

    const updateQuery = isActive !== undefined
      ? 'UPDATE oem SET name = ?, is_active = ? WHERE id = ?'
      : 'UPDATE oem SET name = ? WHERE id = ?';

    const params = isActive !== undefined
      ? [name.trim(), isActive, id]
      : [name.trim(), id];

    await executeFunnelQuery(updateQuery, params);

    res.json({ message: 'OEM updated successfully' });
  } catch (err) {
    console.error('Error updating OEM:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteOEM(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canDeleteSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { id } = req.params;
    await executeFunnelQuery('DELETE FROM oem WHERE id = ?', [id]);
    res.json({ message: 'OEM deleted successfully' });
  } catch (err) {
    console.error('Error deleting OEM:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== Product Management ====================

export async function listProducts(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canViewSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const products: any = await executeFunnelQuery(
      'SELECT id, hash, name, is_active, created_on FROM product ORDER BY name ASC'
    );
    res.json(products);
  } catch (err) {
    console.error('Error listing products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const hash = Buffer.from(name.trim()).toString('base64');

    const result: any = await executeFunnelQuery(
      'INSERT INTO product (hash, name, is_active, created_on) VALUES (?, ?, 1, NOW())',
      [hash, name.trim()]
    );

    res.status(201).json({ id: result.insertId, message: 'Product created successfully' });
  } catch (err: any) {
    console.error('Error creating product:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Product name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProduct(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { id } = req.params;
    const { name, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const hash = Buffer.from(name.trim()).toString('base64');
    const isActive = is_active !== undefined ? (is_active ? 1 : 0) : undefined;

    const updateQuery = isActive !== undefined
      ? 'UPDATE product SET hash = ?, name = ?, is_active = ? WHERE id = ?'
      : 'UPDATE product SET hash = ?, name = ? WHERE id = ?';

    const params = isActive !== undefined
      ? [hash, name.trim(), isActive, id]
      : [hash, name.trim(), id];

    await executeFunnelQuery(updateQuery, params);

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canDeleteSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { id } = req.params;
    await executeFunnelQuery('DELETE FROM product WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== Customer Management ====================

export async function listCustomers(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canViewSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const customers: any = await executeFunnelQuery(
      'SELECT id, hash, name, is_active, created_on FROM customer ORDER BY name ASC'
    );
    res.json(customers);
  } catch (err) {
    console.error('Error listing customers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const hash = Buffer.from(name.trim()).toString('base64');

    const result: any = await executeFunnelQuery(
      'INSERT INTO customer (hash, name, is_active, created_on) VALUES (?, ?, 1, NOW())',
      [hash, name.trim()]
    );

    res.status(201).json({ id: result.insertId, message: 'Customer created successfully' });
  } catch (err: any) {
    console.error('Error creating customer:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Customer name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { id } = req.params;
    const { name, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const hash = Buffer.from(name.trim()).toString('base64');
    const isActive = is_active !== undefined ? (is_active ? 1 : 0) : undefined;

    const updateQuery = isActive !== undefined
      ? 'UPDATE customer SET hash = ?, name = ?, is_active = ? WHERE id = ?'
      : 'UPDATE customer SET hash = ?, name = ? WHERE id = ?';

    const params = isActive !== undefined
      ? [hash, name.trim(), isActive, id]
      : [hash, name.trim(), id];

    await executeFunnelQuery(updateQuery, params);

    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canDeleteSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { id } = req.params;
    await executeFunnelQuery('DELETE FROM customer WHERE id = ?', [id]);
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// OIC Management Functions
export async function listOICs(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canViewSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const query = `
      SELECT 
        co.id,
        co.name,
        co.contact_no,
        co.email,
        co.customer_id,
        c.name as customer_name,
        co.created_on
      FROM customer_oic co
      LEFT JOIN customer c ON co.customer_id = c.id
      ORDER BY co.created_on DESC
    `;

    const results = await executeFunnelQuery(query, []);
    res.json(results);
  } catch (err) {
    console.error('Error fetching OICs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createOIC(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { name, contact_no, email, customer_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'OIC name is required' });
    }

    if (!customer_id) {
      return res.status(400).json({ error: 'Customer is required' });
    }

    const insertQuery = `
      INSERT INTO customer_oic (name, contact_no, email, customer_id, created_on)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const result = await executeFunnelQuery(insertQuery, [
      name.trim(),
      contact_no || null,
      email || null,
      customer_id
    ]);

    res.status(201).json({
      message: 'OIC created successfully',
      id: (result as any).insertId
    });
  } catch (err) {
    console.error('Error creating OIC:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateOIC(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canCreateSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { id } = req.params;
    const { name, contact_no, email, customer_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'OIC name is required' });
    }

    if (!customer_id) {
      return res.status(400).json({ error: 'Customer is required' });
    }

    const updateQuery = `
      UPDATE customer_oic 
      SET name = ?, contact_no = ?, email = ?, customer_id = ?
      WHERE id = ?
    `;

    await executeFunnelQuery(updateQuery, [
      name.trim(),
      contact_no || null,
      email || null,
      customer_id,
      id
    ]);

    res.json({ message: 'OIC updated successfully' });
  } catch (err) {
    console.error('Error updating OIC:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteOIC(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = getNumericUserId(req);
    if (userId === null) return res.status(400).json({ error: 'Invalid user id' });

    if (!(await canDeleteSEPL(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkFunnelDatabase(res)) return;

    const { id } = req.params;
    await executeFunnelQuery('DELETE FROM customer_oic WHERE id = ?', [id]);
    res.json({ message: 'OIC deleted successfully' });
  } catch (err) {
    console.error('Error deleting OIC:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
