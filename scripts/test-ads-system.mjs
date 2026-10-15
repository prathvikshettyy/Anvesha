/**
 * Comprehensive verification script for the Advertising and Revenue System in Anvesha
 */

import http from 'node:http';

const BASE_URL = 'http://127.0.0.1:3001';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const req = http.request(url, {
      method,
      headers: reqHeaders,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = data;
        }
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Anvesha Advertising & Revenue System Verification...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test public ads endpoint
    console.log('1. Testing Public Ads Listing (/api/ads)...');
    const pubRes = await request('GET', '/api/ads?placement=HOMEPAGE');
    assert(pubRes.status === 200, 'Public GET /api/ads returns 200 OK');
    assert(Array.isArray(pubRes.data) && pubRes.data.length > 0, 'Returns active campaigns array');
    
    const sampleAd = pubRes.data[0];
    assert(sampleAd.id && sampleAd.title && sampleAd.advertiserName, 'Public ad contains title, id, and advertiser');
    assert(sampleAd.budgetAmount === undefined, 'Public ad does NOT expose advertiser budgetAmount');
    assert(sampleAd.paymentNotes === undefined, 'Public ad does NOT expose private paymentNotes');

    // 2. Test Location-based filtering
    console.log('\n2. Testing Location-based Ad Filtering...');
    const karRes = await request('GET', '/api/ads?state=karnataka');
    assert(karRes.status === 200, 'Location-filtered GET /api/ads?state=karnataka returns 200 OK');
    const hasKarAd = karRes.data.some(a => a.targetState === 'karnataka' || a.targetState === 'all');
    assert(hasKarAd, 'Includes Karnataka-relevant or national campaigns');

    // 3. Test Impression tracking
    console.log('\n3. Testing Impression Tracking (/api/ads/:id/impression)...');
    const targetAdId = sampleAd.id;
    const initialImp = sampleAd.impressions || 0;
    const impRes = await request('POST', `/api/ads/${targetAdId}/impression`, { placement: 'HOMEPAGE', locationContext: 'karnataka' });
    assert(impRes.status === 200, 'Impression tracking returns 200 OK');
    assert(impRes.data.success === true, 'Impression successfully logged');
    assert(impRes.data.impressions >= initialImp + 1, 'Impression count incremented on server');

    // 4. Test Click tracking
    console.log('\n4. Testing Click Tracking (/api/ads/:id/click)...');
    const clickRes = await request('POST', `/api/ads/${targetAdId}/click`, { placement: 'HOMEPAGE', locationContext: 'karnataka' });
    assert(clickRes.status === 200, 'Click tracking returns 200 OK');
    assert(clickRes.data.success === true && clickRes.data.destinationUrl, 'Click returns destinationUrl');

    // 5. Test Access Control: Unauthenticated or Non-Admin access to admin endpoints
    console.log('\n5. Testing Role-Based Security & Access Control...');
    const unauthAdmin = await request('GET', '/api/ads/admin/campaigns');
    assert(unauthAdmin.status === 401 || unauthAdmin.status === 403, 'Unauthenticated access to /api/ads/admin/campaigns is rejected (401/403)');

    // Login as admin (Rohan Shenoy)
    const adminLogin = await request('POST', '/api/auth/login', { username: 'rohan', password: 'demo1234' });
    assert(adminLogin.status === 200, 'Admin login succeeds');
    const adminToken = adminLogin.data.token;
    assert(adminLogin.data.user.is_admin === 1 || adminLogin.data.user.isAdmin === true, 'User payload has is_admin flag');

    // Access admin campaigns with token
    const adminCampaigns = await request('GET', '/api/ads/admin/campaigns', null, { Authorization: `Bearer ${adminToken}` });
    assert(adminCampaigns.status === 200, 'Authorized admin can fetch /api/ads/admin/campaigns');
    assert(Array.isArray(adminCampaigns.data) && adminCampaigns.data.length >= 5, 'Admin sees all campaigns including budget & status');

    // 6. Test Revenue Metrics & Unpaid Fees Isolation
    console.log('\n6. Testing Revenue Calculation & Integrity...');
    const revRes = await request('GET', '/api/ads/admin/revenue', null, { Authorization: `Bearer ${adminToken}` });
    assert(revRes.status === 200, 'Authorized admin can fetch /api/ads/admin/revenue');
    const metrics = revRes.data.summary || revRes.data;
    assert(typeof metrics.actualCollectedRevenue === 'number', 'actualCollectedRevenue is a numeric value');
    assert(typeof metrics.pendingUnpaidFees === 'number', 'pendingUnpaidFees is tracked separately');
    assert(metrics.actualCollectedRevenue !== metrics.totalContractedBudget, 'Unpaid fees are NOT counted as collected revenue');
    console.log(`     📊 Collected Revenue: ₹${metrics.actualCollectedRevenue.toLocaleString('en-IN')}`);
    console.log(`     ⏳ Pending Unpaid Fees: ₹${metrics.pendingUnpaidFees.toLocaleString('en-IN')}`);
    console.log(`     🎯 Total Tracked Impressions: ${metrics.totalImpressions}`);
    console.log(`     🖱️ Total Tracked Clicks: ${metrics.totalClicks}`);
    console.log(`     📈 Average CTR: ${metrics.averageCtr || metrics.overallCtr}%`);

    // 7. Test Campaign Creation and Manual Audit Verification
    console.log('\n7. Testing Admin Campaign Creation & Audit Workflow...');
    const newCampRes = await request('POST', '/api/ads/admin/campaigns', {
      advertiserName: 'Mysore Sandal Heritage Trust',
      title: 'Centenary Sandalwood Oil & Soap Distillation Walk',
      description: 'Exclusive heritage distillation tour through government sandal oil factories with traditional perfumers.',
      imageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f443b355?w=800&auto=format&fit=crop&q=80',
      destinationUrl: 'https://karnatakatourism.org',
      ctaLabel: 'Book Sandal Tour',
      placement: 'HOMEPAGE',
      targetState: 'karnataka',
      targetCity: 'Mysuru',
      category: 'culture',
      budgetAmount: 12500,
      paymentStatus: 'UNPAID',
      paymentNotes: 'Invoice INV-2026-MS98 issued; awaiting cheque clearance',
      startDate: '2026-10-15',
      endDate: '2026-12-31',
      status: 'ACTIVE'
    }, { Authorization: `Bearer ${adminToken}` });

    assert(newCampRes.status === 201, 'Admin can create a new campaign (201 Created)');
    const createdId = newCampRes.data.id || newCampRes.data.campaign?.id;
    assert(createdId, 'New campaign received an ID');

    // Now update payment status to PAID with manual verification audit
    console.log('\n8. Testing Manual Payment Audit Verification Update...');
    const updateRes = await request('PATCH', `/api/ads/admin/campaigns/${createdId}`, {
      paymentStatus: 'PAID',
      paymentReference: 'NEFT-AXIS-20261016-8941',
      paymentNotes: 'NEFT credit verified manually by finance desk',
      verifiedBy: 'usr_rohan'
    }, { Authorization: `Bearer ${adminToken}` });

    assert(updateRes.status === 200, 'Campaign payment status updated to PAID (200 OK)');
    const campData = updateRes.data.campaign || updateRes.data;
    assert(campData.payment_status === 'PAID' || campData.paymentStatus === 'PAID', 'Campaign payment status is now PAID');
    assert((campData.payment_verified_at || campData.verifiedAt) !== null, 'verifiedAt timestamp recorded');

    // Verify revenue metrics updated immediately
    const updatedRev = await request('GET', '/api/ads/admin/revenue', null, { Authorization: `Bearer ${adminToken}` });
    const updatedMetrics = updatedRev.data.summary || updatedRev.data;
    assert(
      updatedMetrics.actualCollectedRevenue === metrics.actualCollectedRevenue + 12500,
      'actualCollectedRevenue immediately reflects newly verified paid campaign'
    );

    // Clean up created test campaign
    await request('DELETE', `/api/ads/admin/campaigns/${createdId}`, null, { Authorization: `Bearer ${adminToken}` });

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runTests();
