// server/src/routes/ads.js
// REST endpoints for advertisements, sponsored campaigns, impression/click analytics, and revenue tracking.

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { requireAdmin, optionalAuth } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

// Helper to validate valid web URLs
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// ── 1. GET /api/ads — get active sponsored campaigns for display ─────────────
router.get('/', optionalAuth, (req, res) => {
  const { placement = 'ALL', state = 'ALL', category = 'ALL', limit = 10 } = req.query;

  let sql = `
    SELECT
      id,
      advertiser_name AS advertiserName,
      title,
      description,
      image_url AS imageUrl,
      destination_url AS destinationUrl,
      cta_label AS ctaLabel,
      placement,
      target_state AS targetState,
      target_city AS targetCity,
      category,
      event_id AS eventId,
      status,
      start_date AS startDate,
      end_date AS endDate,
      impressions_count AS impressionsCount,
      clicks_count AS clicksCount,
      created_at AS createdAt
    FROM advertisements
    WHERE status = 'ACTIVE'
      AND (start_date IS NULL OR start_date = '' OR date('now', 'localtime') >= date(start_date) OR date('now') >= date(start_date))
      AND (end_date IS NULL OR end_date = '' OR date('now', 'localtime') <= date(end_date) OR date('now') <= date(end_date))
  `;

  const params = [];

  if (placement && placement !== 'ALL') {
    sql += ` AND (UPPER(placement) = 'ALL' OR UPPER(placement) = UPPER(?))`;
    params.push(placement);
  }

  if (state && state !== 'ALL') {
    sql += ` AND (UPPER(target_state) = 'ALL' OR LOWER(target_state) = LOWER(?))`;
    params.push(state);
  }

  if (category && category !== 'ALL') {
    sql += ` AND (LOWER(category) = 'all' OR LOWER(category) = LOWER(?))`;
    params.push(category);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(Math.min(parseInt(limit, 10) || 10, 20));

  try {
    const ads = db.prepare(sql).all(...params);
    res.json(ads);
  } catch (err) {
    console.error('Error fetching advertisements:', err);
    res.status(500).json({ error: 'Failed to load advertisements' });
  }
});

// ── 2. POST /api/ads/:id/impression — record an ad impression ────────────────
router.post('/:id/impression', optionalAuth, (req, res) => {
  const { id } = req.params;
  const { placement = 'HOMEPAGE', locationContext = '' } = req.body || {};
  const userId = req.user?.id || null;

  try {
    const ad = db.prepare('SELECT id FROM advertisements WHERE id = ?').get(id);
    if (!ad) return res.status(404).json({ error: 'Advertisement not found' });

    // Increment count on ad
    db.prepare('UPDATE advertisements SET impressions_count = impressions_count + 1 WHERE id = ?').run(id);
    const updated = db.prepare('SELECT impressions_count FROM advertisements WHERE id = ?').get(id);

    // Record log entry
    db.prepare(`
      INSERT INTO ad_logs (id, ad_id, event_type, user_id, location_context, placement)
      VALUES (?, ?, 'IMPRESSION', ?, ?, ?)
    `).run(uuid(), id, userId, String(locationContext).slice(0, 100), String(placement).slice(0, 30));

    res.json({ success: true, recorded: 'IMPRESSION', impressions: updated?.impressions_count || 1 });
  } catch (err) {
    console.error('Error tracking impression:', err);
    res.status(500).json({ error: 'Failed to record impression' });
  }
});

// ── 3. POST /api/ads/:id/click — record an ad click ──────────────────────────
router.post('/:id/click', optionalAuth, (req, res) => {
  const { id } = req.params;
  const { placement = 'HOMEPAGE', locationContext = '' } = req.body || {};
  const userId = req.user?.id || null;

  try {
    const ad = db.prepare('SELECT id, destination_url FROM advertisements WHERE id = ?').get(id);
    if (!ad) return res.status(404).json({ error: 'Advertisement not found' });

    // Increment count on ad
    db.prepare('UPDATE advertisements SET clicks_count = clicks_count + 1 WHERE id = ?').run(id);

    // Record log entry
    db.prepare(`
      INSERT INTO ad_logs (id, ad_id, event_type, user_id, location_context, placement)
      VALUES (?, ?, 'CLICK', ?, ?, ?)
    `).run(uuid(), id, userId, String(locationContext).slice(0, 100), String(placement).slice(0, 30));

    res.json({ success: true, destinationUrl: ad.destination_url });
  } catch (err) {
    console.error('Error tracking ad click:', err);
    res.status(500).json({ error: 'Failed to record ad click' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN ROUTES (Guarded by requireAdmin) ────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── 4. GET /api/ads/admin/campaigns — list all campaigns with performance ─────
router.get('/admin/campaigns', requireAdmin, (req, res) => {
  const { status, payment_status, q } = req.query;

  let sql = `
    SELECT
      a.*,
      u.name AS creator_name,
      e.title AS linked_event_title
    FROM advertisements a
    LEFT JOIN users u ON u.id = a.created_by
    LEFT JOIN events e ON e.id = a.event_id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    sql += ` AND a.status = ?`;
    params.push(status);
  }

  if (payment_status && payment_status !== 'ALL') {
    sql += ` AND a.payment_status = ?`;
    params.push(payment_status);
  }

  if (q && q.trim()) {
    sql += ` AND (a.title LIKE ? OR a.advertiser_name LIKE ? OR a.description LIKE ?)`;
    const term = `%${q.trim()}%`;
    params.push(term, term, term);
  }

  sql += ` ORDER BY a.created_at DESC`;

  try {
    const rows = db.prepare(sql).all(...params);
    const result = rows.map(r => {
      const imps = r.impressions_count || 0;
      const clicks = r.clicks_count || 0;
      const ctr = imps > 0 ? Number(((clicks / imps) * 100).toFixed(2)) : 0;
      return {
        id: r.id,
        advertiserName: r.advertiser_name,
        title: r.title,
        description: r.description,
        imageUrl: r.image_url,
        destinationUrl: r.destination_url,
        ctaLabel: r.cta_label,
        placement: r.placement,
        targetState: r.target_state,
        targetCity: r.target_city,
        category: r.category,
        eventId: r.event_id,
        linkedEventTitle: r.linked_event_title,
        status: r.status,
        budgetAmount: r.budget_amount || 0,
        paymentStatus: r.payment_status,
        paymentReference: r.payment_reference || '',
        paymentVerifiedAt: r.payment_verified_at,
        paymentNotes: r.payment_notes || '',
        startDate: r.start_date,
        endDate: r.end_date,
        impressionsCount: imps,
        clicksCount: clicks,
        ctr,
        createdBy: r.created_by,
        creatorName: r.creator_name,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    });
    res.json(result);
  } catch (err) {
    console.error('Error fetching admin campaigns:', err);
    res.status(500).json({ error: 'Failed to load campaigns' });
  }
});

// ── 5. GET /api/ads/admin/revenue — financial breakdown & revenue tracking ────
router.get('/admin/revenue', requireAdmin, (_req, res) => {
  try {
    // 1. Total contracted campaign fee
    const totals = db.prepare(`
      SELECT
        COUNT(*) AS totalCampaigns,
        COALESCE(SUM(budget_amount), 0) AS totalContractedBudget,
        COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN budget_amount ELSE 0 END), 0) AS actualCollectedRevenue,
        COALESCE(SUM(CASE WHEN payment_status = 'UNPAID' THEN budget_amount ELSE 0 END), 0) AS pendingUnpaidFees,
        COALESCE(SUM(CASE WHEN payment_status = 'REFUNDED' THEN budget_amount ELSE 0 END), 0) AS refundedAmount,
        COALESCE(SUM(impressions_count), 0) AS totalImpressions,
        COALESCE(SUM(clicks_count), 0) AS totalClicks
      FROM advertisements
    `).get();

    // 2. Breakdown by status
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) AS count
      FROM advertisements
      GROUP BY status
    `).all();

    // 3. Breakdown by payment status
    const paymentBreakdown = db.prepare(`
      SELECT
        payment_status AS paymentStatus,
        COUNT(*) AS campaignCount,
        COALESCE(SUM(budget_amount), 0) AS amount
      FROM advertisements
      GROUP BY payment_status
    `).all();

    // 4. Breakdown by placement
    const placementBreakdown = db.prepare(`
      SELECT
        placement,
        COUNT(*) AS campaignCount,
        COALESCE(SUM(impressions_count), 0) AS impressions,
        COALESCE(SUM(clicks_count), 0) AS clicks,
        COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN budget_amount ELSE 0 END), 0) AS collectedRevenue
      FROM advertisements
      GROUP BY placement
    `).all();

    const imps = totals.totalImpressions || 0;
    const clicks = totals.totalClicks || 0;
    const averageCtr = imps > 0 ? Number(((clicks / imps) * 100).toFixed(2)) : 0;

    res.json({
      totalCampaigns: totals.totalCampaigns,
      totalContractedBudget: totals.totalContractedBudget,
      actualCollectedRevenue: totals.actualCollectedRevenue, // strictly verified PAID only!
      pendingUnpaidFees: totals.pendingUnpaidFees,
      refundedAmount: totals.refundedAmount,
      totalImpressions: imps,
      totalClicks: clicks,
      averageCtr,
      statusCounts: Object.fromEntries(statusCounts.map(s => [s.status, s.count])),
      paymentBreakdown,
      placementBreakdown,
      currency: 'INR (₹)'
    });
  } catch (err) {
    console.error('Error generating revenue metrics:', err);
    res.status(500).json({ error: 'Failed to compute revenue metrics' });
  }
});

// ── 6. POST /api/ads/admin/campaigns — create advertisement campaign ─────────
router.post('/admin/campaigns',
  requireAdmin,
  requireFields('advertiserName', 'title', 'description', 'imageUrl', 'destinationUrl', 'startDate', 'endDate'),
  (req, res) => {
    const {
      advertiserName,
      title,
      description,
      imageUrl,
      destinationUrl,
      ctaLabel = 'Explore Offer',
      placement = 'HOMEPAGE',
      targetState = 'ALL',
      targetCity = '',
      category = 'culture',
      eventId = null,
      status = 'PENDING',
      budgetAmount = 0,
      paymentStatus = 'UNPAID',
      paymentReference = '',
      paymentNotes = '',
      startDate,
      endDate
    } = req.body;

    // Validate URLs
    if (!isValidUrl(destinationUrl)) {
      return res.status(400).json({ error: 'Invalid destination URL. Must begin with http:// or https://' });
    }
    if (!isValidUrl(imageUrl) && !imageUrl.startsWith('/')) {
      return res.status(400).json({ error: 'Invalid image URL' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid start or end date format' });
    }
    if (end < start) {
      return res.status(400).json({ error: 'End date must be on or after start date' });
    }

    // Validate budget
    const numericBudget = Math.max(0, parseFloat(budgetAmount) || 0);

    const validPlacements = ['HOMEPAGE', 'EVENTS', 'MAP', 'EXPERIENCES', 'ALL'];
    const chosenPlacement = validPlacements.includes(String(placement).toUpperCase()) ? String(placement).toUpperCase() : 'ALL';

    const validStatuses = ['ACTIVE', 'PENDING', 'PAUSED', 'REJECTED', 'EXPIRED'];
    const chosenStatus = validStatuses.includes(String(status).toUpperCase()) ? String(status).toUpperCase() : 'PENDING';

    const validPaymentStatuses = ['UNPAID', 'PAID', 'REFUNDED'];
    const chosenPaymentStatus = validPaymentStatuses.includes(String(paymentStatus).toUpperCase()) ? String(paymentStatus).toUpperCase() : 'UNPAID';

    const paymentVerifiedAt = chosenPaymentStatus === 'PAID' ? new Date().toISOString() : null;

    const id = `ad_${uuid().replace(/-/g, '').slice(0, 16)}`;

    try {
      db.prepare(`
        INSERT INTO advertisements (
          id, advertiser_name, title, description, image_url, destination_url, cta_label,
          placement, target_state, target_city, category, event_id, status, budget_amount,
          payment_status, payment_reference, payment_verified_at, payment_notes,
          start_date, end_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        advertiserName.trim().slice(0, 150),
        title.trim().slice(0, 200),
        description.trim().slice(0, 1000),
        imageUrl.trim(),
        destinationUrl.trim(),
        ctaLabel.trim().slice(0, 50),
        chosenPlacement,
        targetState.trim().toLowerCase(),
        targetCity.trim().slice(0, 100),
        category.trim().toLowerCase(),
        eventId || null,
        chosenStatus,
        numericBudget,
        chosenPaymentStatus,
        paymentReference.trim().slice(0, 150),
        paymentVerifiedAt,
        paymentNotes.trim().slice(0, 500),
        startDate.slice(0, 10),
        endDate.slice(0, 10),
        req.user.id
      );

      const created = db.prepare('SELECT * FROM advertisements WHERE id = ?').get(id);
      res.status(201).json(created);
    } catch (err) {
      console.error('Error creating advertisement:', err);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
);

// ── 7. PATCH /api/ads/admin/campaigns/:id — edit or verify campaign ──────────
router.patch('/admin/campaigns/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM advertisements WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });

  const {
    advertiserName,
    title,
    description,
    imageUrl,
    destinationUrl,
    ctaLabel,
    placement,
    targetState,
    targetCity,
    category,
    eventId,
    status,
    budgetAmount,
    paymentStatus,
    paymentReference,
    paymentNotes,
    startDate,
    endDate
  } = req.body;

  if (destinationUrl !== undefined && !isValidUrl(destinationUrl)) {
    return res.status(400).json({ error: 'Invalid destination URL' });
  }

  // Determine updated payment status & audit timestamp
  let updatedPaymentStatus = existing.payment_status;
  let updatedVerifiedAt = existing.payment_verified_at;

  if (paymentStatus !== undefined) {
    const valid = ['UNPAID', 'PAID', 'REFUNDED'];
    if (!valid.includes(paymentStatus.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }
    updatedPaymentStatus = paymentStatus.toUpperCase();
    if (updatedPaymentStatus === 'PAID' && existing.payment_status !== 'PAID') {
      updatedVerifiedAt = new Date().toISOString();
    } else if (updatedPaymentStatus !== 'PAID') {
      updatedVerifiedAt = null;
    }
  }

  try {
    db.prepare(`
      UPDATE advertisements SET
        advertiser_name = COALESCE(?, advertiser_name),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url),
        destination_url = COALESCE(?, destination_url),
        cta_label = COALESCE(?, cta_label),
        placement = COALESCE(?, placement),
        target_state = COALESCE(?, target_state),
        target_city = COALESCE(?, target_city),
        category = COALESCE(?, category),
        event_id = ?,
        status = COALESCE(?, status),
        budget_amount = COALESCE(?, budget_amount),
        payment_status = ?,
        payment_reference = COALESCE(?, payment_reference),
        payment_verified_at = ?,
        payment_notes = COALESCE(?, payment_notes),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      advertiserName !== undefined ? advertiserName.trim().slice(0, 150) : null,
      title !== undefined ? title.trim().slice(0, 200) : null,
      description !== undefined ? description.trim().slice(0, 1000) : null,
      imageUrl !== undefined ? imageUrl.trim() : null,
      destinationUrl !== undefined ? destinationUrl.trim() : null,
      ctaLabel !== undefined ? ctaLabel.trim().slice(0, 50) : null,
      placement !== undefined ? String(placement).toUpperCase() : null,
      targetState !== undefined ? String(targetState).toLowerCase() : null,
      targetCity !== undefined ? String(targetCity).slice(0, 100) : null,
      category !== undefined ? String(category).toLowerCase() : null,
      eventId !== undefined ? (eventId || null) : existing.event_id,
      status !== undefined ? String(status).toUpperCase() : null,
      budgetAmount !== undefined ? Math.max(0, parseFloat(budgetAmount) || 0) : null,
      updatedPaymentStatus,
      paymentReference !== undefined ? String(paymentReference).slice(0, 150) : null,
      updatedVerifiedAt,
      paymentNotes !== undefined ? String(paymentNotes).slice(0, 500) : null,
      startDate !== undefined ? String(startDate).slice(0, 10) : null,
      endDate !== undefined ? String(endDate).slice(0, 10) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM advertisements WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating campaign:', err);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// ── 8. DELETE /api/ads/admin/campaigns/:id — delete campaign ─────────────────
router.delete('/admin/campaigns/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  try {
    const row = db.prepare('SELECT id FROM advertisements WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Campaign not found' });

    db.prepare('DELETE FROM advertisements WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting campaign:', err);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;
