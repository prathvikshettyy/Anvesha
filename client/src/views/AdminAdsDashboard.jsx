import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  MousePointer,
  Eye,
  PlusCircle,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  PauseCircle,
  PlayCircle,
  XCircle,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  Search,
  RefreshCw,
  X,
  Check,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import * as api from '../services/api';

const PLACEMENTS = [
  { id: 'ALL', label: 'All Placements' },
  { id: 'HOMEPAGE', label: 'Homepage Feed' },
  { id: 'EVENTS', label: 'Events Directory' },
  { id: 'MAP', label: 'Map & State Discovery' },
  { id: 'EXPERIENCES', label: 'Local Experiences & Food' },
];

const TARGET_STATES = [
  { id: 'all', label: 'All India (National)' },
  { id: 'karnataka', label: 'Karnataka' },
  { id: 'kerala', label: 'Kerala' },
  { id: 'tamil-nadu', label: 'Tamil Nadu' },
  { id: 'maharashtra', label: 'Maharashtra' },
  { id: 'rajasthan', label: 'Rajasthan' },
  { id: 'west-bengal', label: 'West Bengal' },
];

export default function AdminAdsDashboard({
  currentUser,
  events = [],
  onClose = null
}) {
  const [campaigns, setCampaigns] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for New/Edit Campaign
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    advertiserName: '',
    title: '',
    description: '',
    imageUrl: '',
    destinationUrl: '',
    ctaLabel: 'Explore Offer',
    placement: 'HOMEPAGE',
    targetState: 'all',
    targetCity: '',
    category: 'culture',
    eventId: '',
    budgetAmount: '5000',
    paymentStatus: 'UNPAID',
    paymentReference: '',
    paymentNotes: '',
    status: 'ACTIVE',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Check admin authorization
  const isAdmin = Boolean(currentUser?.isAdmin || currentUser?.is_admin);

  // Fetch campaigns and revenue metrics
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!api.token.get()) {
        await api.ensureAdminSession();
      }
      const [camps, rev] = await Promise.all([
        api.ads.admin.listCampaigns({ status: statusFilter, payment_status: paymentFilter, q: searchQuery }),
        api.ads.admin.getRevenue()
      ]);
      setCampaigns(camps || []);
      setRevenueData(rev || null);
    } catch (err) {
      console.error('Error loading admin ads data:', err);
      setError(err.message || 'Failed to load advertising data. Make sure you are signed in as an administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, statusFilter, paymentFilter, searchQuery]);

  const handleOpenCreateModal = () => {
    setEditingCampaign(null);
    setFormData({
      advertiserName: '',
      title: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f443b355?w=800&auto=format&fit=crop&q=80',
      destinationUrl: 'https://',
      ctaLabel: 'Explore Offer',
      placement: 'HOMEPAGE',
      targetState: 'all',
      targetCity: '',
      category: 'culture',
      eventId: '',
      budgetAmount: '5000',
      paymentStatus: 'UNPAID',
      paymentReference: '',
      paymentNotes: '',
      status: 'ACTIVE',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCampaign(c);
    setFormData({
      advertiserName: c.advertiserName || '',
      title: c.title || '',
      description: c.description || '',
      imageUrl: c.imageUrl || '',
      destinationUrl: c.destinationUrl || '',
      ctaLabel: c.ctaLabel || 'Explore Offer',
      placement: c.placement || 'HOMEPAGE',
      targetState: c.targetState || 'all',
      targetCity: c.targetCity || '',
      category: c.category || 'culture',
      eventId: c.eventId || '',
      budgetAmount: String(c.budgetAmount || '0'),
      paymentStatus: c.paymentStatus || 'UNPAID',
      paymentReference: c.paymentReference || '',
      paymentNotes: c.paymentNotes || '',
      status: c.status || 'ACTIVE',
      startDate: c.startDate || new Date().toISOString().slice(0, 10),
      endDate: c.endDate || new Date().toISOString().slice(0, 10)
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (!api.token.get()) {
        await api.ensureAdminSession();
      }

      if (editingCampaign) {
        await api.ads.admin.updateCampaign(editingCampaign.id, formData);
      } else {
        await api.ads.admin.createCampaign(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      if (err.status === 401 || err.message?.toLowerCase().includes('auth')) {
        // Attempt immediate token renewal and retry once
        try {
          await api.ensureAdminSession();
          if (editingCampaign) {
            await api.ads.admin.updateCampaign(editingCampaign.id, formData);
          } else {
            await api.ads.admin.createCampaign(formData);
          }
          setIsModalOpen(false);
          loadData();
          return;
        } catch (retryErr) {
          setFormError(retryErr.message || 'Authentication required. Please authenticate as platform administrator.');
          return;
        }
      }
      setFormError(err.message || 'Failed to save campaign');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick Action: Toggle Status
  const handleToggleStatus = async (c, newStatus) => {
    try {
      await api.ads.admin.updateCampaign(c.id, { status: newStatus });
      loadData();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Quick Action: Verify Payment
  const handleVerifyPayment = async (c) => {
    const ref = prompt(`Enter manual payment transaction / NEFT / UPI reference for "${c.advertiserName}":`, c.paymentReference || 'UPI-MANUAL-VERIFIED');
    if (ref === null) return;
    try {
      await api.ads.admin.updateCampaign(c.id, {
        paymentStatus: 'PAID',
        paymentReference: ref,
        paymentNotes: `Manually verified by admin (${currentUser?.name || 'Administrator'}) on ${new Date().toLocaleDateString('en-IN')}`
      });
      loadData();
    } catch (err) {
      alert(`Failed to verify payment: ${err.message}`);
    }
  };

  // Quick Action: Delete Campaign
  const handleDeleteCampaign = async (c) => {
    if (!confirm(`Are you sure you want to delete campaign "${c.title}"?`)) return;
    try {
      await api.ads.admin.deleteCampaign(c.id);
      loadData();
    } catch (err) {
      alert(`Failed to delete campaign: ${err.message}`);
    }
  };

  // Unauthorised view
  if (!isAdmin) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl bg-surface-container-lowest border-2 border-blush-surface max-w-xl mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-cocoa-text">
          Administrative Privileges Required
        </h3>
        <p className="text-xs sm:text-sm text-cocoa-text/75 leading-relaxed">
          The Advertising & Revenue Dashboard is restricted to verified platform administrators.
          Please sign in with an authorised administrative account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* ── 1. Header Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blush-surface/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary border border-terra-primary/20">
              Admin Control Center
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Manual Audit Verified
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">
            Advertising & Revenue Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-cocoa-text/70 mt-0.5">
            Manage sponsored cultural listings, review audit trails, verify payments, and track impressions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2.5 rounded-full bg-surface-container-lowest border border-blush-surface text-cocoa-text/70 hover:text-terra-primary hover:bg-blush-surface/30 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-terra-primary' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs sm:text-sm font-bold shadow-warm hover:scale-102 transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Sponsored Campaign</span>
          </button>
        </div>
      </div>

      {/* ── 2. Revenue & Performance KPI Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Actual Collected Revenue */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest border-2 border-emerald-500/30 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Collected Revenue</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-950">
            ₹{Number(revenueData?.actualCollectedRevenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manually verified PAID fees only</span>
          </p>
        </div>

        {/* Card 2: Pending Unpaid Fees */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest border-2 border-amber-500/30 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending / Unpaid Fees</span>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-950">
            ₹{Number(revenueData?.pendingUnpaidFees || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-800 font-medium">
            Not counted as revenue until verified
          </p>
        </div>

        {/* Card 3: Total Impressions & Reach */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest border border-blush-surface shadow-xs space-y-2">
          <div className="flex items-center justify-between text-cocoa-text/70">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Impressions</span>
            <div className="w-8 h-8 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">
            {Number(revenueData?.totalImpressions || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-cocoa-text/60">
            Across Homepage, Events & Maps
          </p>
        </div>

        {/* Card 4: Total Clicks & CTR */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest border border-blush-surface shadow-xs space-y-2">
          <div className="flex items-center justify-between text-cocoa-text/70">
            <span className="text-[11px] font-bold uppercase tracking-wider">Clicks & CTR</span>
            <div className="w-8 h-8 rounded-full bg-ochre-accent/15 flex items-center justify-center text-ochre-accent">
              <MousePointer className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">
            {Number(revenueData?.totalClicks || 0).toLocaleString('en-IN')}{' '}
            <span className="text-sm font-sans font-bold text-terra-primary">
              ({revenueData?.averageCtr || 0}%)
            </span>
          </div>
          <p className="text-[11px] text-cocoa-text/60">
            Average Click-Through Rate
          </p>
        </div>
      </div>

      {/* ── 3. Filters & Search Bar ───────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-blush-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cocoa-text/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sponsor, campaign title, or keyword..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full bg-surface-container/50 border border-blush-surface text-xs text-cocoa-text focus:outline-hidden focus:border-terra-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-cocoa-text/60 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-surface-container/60 border border-blush-surface text-xs font-bold text-cocoa-text focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="PAUSED">Paused</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-cocoa-text/60 font-semibold">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-surface-container/60 border border-blush-surface text-xs font-bold text-cocoa-text focus:outline-hidden"
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">Paid (Verified)</option>
              <option value="UNPAID">Unpaid (Pending)</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. Campaigns List Table ───────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-3xl border-2 border-blush-surface shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-blush-surface flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-cocoa-text">
              Active & Scheduled Campaigns ({campaigns.length})
            </h3>
            <p className="text-xs text-cocoa-text/60">
              Only campaigns with status ACTIVE and within scheduling window are served to users.
            </p>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blush-surface/50 flex items-center justify-center text-cocoa-text/50 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-cocoa-text/70">No advertising campaigns match the current filter.</p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-cocoa-text">
              <thead className="bg-surface-container/60 border-b border-blush-surface uppercase text-[10px] tracking-wider text-cocoa-text/60 font-bold">
                <tr>
                  <th className="p-3.5 pl-5">Campaign / Sponsor</th>
                  <th className="p-3.5">Placement & Target</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Fee & Payment</th>
                  <th className="p-3.5 text-center">Impressions</th>
                  <th className="p-3.5 text-center">Clicks (CTR)</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-surface/50 font-medium">
                {campaigns.map((c) => {
                  const isPaid = c.paymentStatus === 'PAID';
                  const isActive = c.status === 'ACTIVE';

                  return (
                    <tr key={c.id} className="hover:bg-blush-surface/20 transition-colors">
                      {/* Campaign / Sponsor */}
                      <td className="p-3.5 pl-5 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.imageUrl || '/images/heritage-tapestry-bg.png'}
                            alt={c.title}
                            className="w-11 h-11 rounded-xl object-cover border border-blush-surface flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/images/heritage-tapestry-bg.png';
                            }}
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-terra-primary block truncate">
                              {c.advertiserName}
                            </span>
                            <div className="font-serif font-bold text-sm text-cocoa-text truncate">
                              {c.title}
                            </div>
                            <span className="text-[10px] text-cocoa-text/60">
                              {c.startDate} to {c.endDate}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Placement & Target */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-cream-canvas border border-blush-surface text-[10px] font-bold text-cocoa-text uppercase mb-1">
                          {c.placement}
                        </span>
                        <div className="text-[11px] text-cocoa-text/70 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-terra-primary" />
                          <span>{c.targetCity ? `${c.targetCity}, ` : ''}{c.targetState?.toUpperCase()}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : c.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : c.status === 'PAUSED'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {c.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {c.status === 'PAUSED' && <PauseCircle className="w-3 h-3 text-blue-600" />}
                          {c.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-600" />}
                          <span>{c.status}</span>
                        </span>
                      </td>

                      {/* Fee & Payment Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-sm text-cocoa-text">
                          ₹{Number(c.budgetAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {isPaid ? 'PAID (Verified)' : 'UNPAID'}
                          </span>
                          {!isPaid && (
                            <button
                              onClick={() => handleVerifyPayment(c)}
                              className="text-[10px] font-bold text-terra-primary hover:underline ml-1 cursor-pointer"
                              title="Manually verify received payment"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Impressions */}
                      <td className="p-3.5 text-center font-bold text-cocoa-text whitespace-nowrap">
                        {c.impressionsCount || 0}
                      </td>

                      {/* Clicks & CTR */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="font-bold text-cocoa-text">{c.clicksCount || 0}</div>
                        <span className="text-[10px] text-terra-primary font-bold">
                          {c.ctr || 0}% CTR
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active / Pause */}
                          {isActive ? (
                            <button
                              onClick={() => handleToggleStatus(c, 'PAUSED')}
                              title="Pause Campaign"
                              className="p-1.5 rounded-full hover:bg-blush-surface text-cocoa-text/70 hover:text-amber-700 transition-colors cursor-pointer"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(c, 'ACTIVE')}
                              title="Activate Campaign"
                              className="p-1.5 rounded-full hover:bg-blush-surface text-cocoa-text/70 hover:text-emerald-700 transition-colors cursor-pointer"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            title="Edit Campaign"
                            className="p-1.5 rounded-full hover:bg-blush-surface text-cocoa-text/70 hover:text-terra-primary transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCampaign(c)}
                            title="Delete Campaign"
                            className="p-1.5 rounded-full hover:bg-red-50 text-cocoa-text/70 hover:text-red-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Campaign Creation / Edit Modal ─────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-cocoa-text/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-cream-canvas w-full max-w-2xl rounded-3xl border-2 border-blush-surface shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-blush-surface flex items-center justify-between bg-surface-container/40">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-cocoa-text">
                  {editingCampaign ? 'Edit Sponsored Campaign' : 'Create Sponsored Campaign'}
                </h3>
                <p className="text-xs text-cocoa-text/70">
                  Configure visual promotion, targeting, fixed budget, and manual payment verification.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-cream-canvas hover:bg-blush-surface text-cocoa-text flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-red-100 border border-red-200 text-xs text-red-800 font-semibold flex items-center justify-between gap-2 animate-shake">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span className="truncate">{formError}</span>
                  </div>
                  {formError.toLowerCase().includes('auth') && (
                    <button
                      type="button"
                      disabled={formSubmitting}
                      onClick={async () => {
                        setFormSubmitting(true);
                        try {
                          await api.ensureAdminSession();
                          setFormError('');
                          if (editingCampaign) {
                            await api.ads.admin.updateCampaign(editingCampaign.id, formData);
                          } else {
                            await api.ads.admin.createCampaign(formData);
                          }
                          setIsModalOpen(false);
                          loadData();
                        } catch (err) {
                          setFormError(err.message || 'Failed to authenticate');
                        } finally {
                          setFormSubmitting(false);
                        }
                      }}
                      className="px-3 py-1 rounded-full bg-terra-primary text-cream-canvas hover:bg-primary-container text-[11px] font-bold shadow-xs whitespace-nowrap cursor-pointer transition-all"
                    >
                      Authenticate Admin & Retry
                    </button>
                  )}
                </div>
              )}

              {/* Row 1: Advertiser & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/70">
                    Advertiser / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.advertiserName}
                    onChange={(e) => setFormData({ ...formData, advertiserName: e.target.value })}
                    placeholder="e.g. Karnataka Tourism & KSTDC"
                    className="w-full px-3.5 py-2 rounded-2xl bg-surface-container-lowest border border-blush-surface text-xs text-cocoa-text focus:outline-hidden focus:border-terra-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/70">
                    Campaign Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Karnataka Golden Chariot Heritage Pass"
                    className="w-full px-3.5 py-2 rounded-2xl bg-surface-container-lowest border border-blush-surface text-xs text-cocoa-text focus:outline-hidden focus:border-terra-primary"
                  />
                </div>
              </div>

              {/* Row 2: Tagline / Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/70">
                  Tagline & Promotion Copy *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the cultural promotion, offer, or experience for users..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-surface-container-lowest border border-blush-surface text-xs text-cocoa-text focus:outline-hidden focus:border-terra-primary resize-none"
                />
              </div>

              {/* Row 3: URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/70">
                    Image Artwork URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-2xl bg-surface-container-lowest border border-blush-surface text-xs text-cocoa-text focus:outline-hidden focus:border-terra-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/70">
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.destinationUrl}
                    onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                    placeholder="https://sponsor.com/offer"
                    className="w-full px-3.5 py-2 rounded-2xl bg-surface-container-lowest border border-blush-surface text-xs text-cocoa-text focus:outline-hidden focus:border-terra-primary"
                  />
                </div>
              </div>

              {/* Row 4: Placement, Location, CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/70">
                    Placement *
                  </label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl bg-surface-container-lowest border border-blush-surface text-xs font-bold text-cocoa-text focus:outline-hidden"
                  >
                    {PLACEMENTS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/70">
                    Target State
                  </label>
                  <select
                    value={formData.targetState}
                    onChange={(e) => setFormData({ ...formData, targetState: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl bg-surface-container-lowest border border-blush-surface text-xs font-bold text-cocoa-text focus:outline-hidden"
                  >
                    {TARGET_STATES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/70">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={formData.ctaLabel}
                    onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                    placeholder="Explore Offer"
                    className="w-full px-3.5 py-2 rounded-2xl bg-surface-container-lowest border border-blush-surface text-xs text-cocoa-text focus:outline-hidden focus:border-terra-primary"
                  />
                </div>
              </div>

              {/* Row 5: Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/70">
                    Campaign Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl bg-surface-container-lowest border border-blush-surface text-xs text-cocoa-text focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/70">
                    Campaign End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl bg-surface-container-lowest border border-blush-surface text-xs text-cocoa-text focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Row 6: Revenue & Payment Status (Manual Audit Verification) */}
              <div className="p-4 rounded-2xl bg-surface-container/60 border border-blush-surface space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-terra-primary" />
                  <span className="text-xs font-bold text-cocoa-text">
                    Revenue & Manual Payment Verification
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-cocoa-text/70">
                      Campaign Fee / Budget (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={formData.budgetAmount}
                      onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-blush-surface text-xs font-bold text-cocoa-text"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-cocoa-text/70">
                      Payment Status *
                    </label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-blush-surface text-xs font-bold text-cocoa-text"
                    >
                      <option value="UNPAID">UNPAID (Pending Verification)</option>
                      <option value="PAID">PAID (Verified In Bank / UPI)</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-cocoa-text/70">
                      Initial Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-blush-surface text-xs font-bold text-cocoa-text"
                    >
                      <option value="ACTIVE">ACTIVE (Display Immediately)</option>
                      <option value="PENDING">PENDING (Awaiting Review)</option>
                      <option value="PAUSED">PAUSED</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-cocoa-text/70">
                    Payment Reference / Bank Audit Note
                  </label>
                  <input
                    type="text"
                    value={formData.paymentReference}
                    onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                    placeholder="e.g. NEFT-8849201 or UPI-TRANSACTION-ID"
                    className="w-full px-3.5 py-1.5 rounded-xl bg-surface-container-lowest border border-blush-surface text-xs text-cocoa-text"
                  />
                  <p className="text-[10px] text-cocoa-text/60">
                    Note: Unpaid campaign fees will NOT be credited to collected revenue.
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-blush-surface flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-blush-surface text-xs font-bold text-cocoa-text hover:bg-blush-surface/30 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs font-bold shadow-warm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{formSubmitting ? 'Saving...' : (editingCampaign ? 'Save Changes' : 'Launch Campaign')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
