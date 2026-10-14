// server/src/lib/matching.js
//
// Robust, explainable people-matching engine.
//
// Deliberately NOT backed by a standalone graph database (see docs/PLAN.md
// §1 "Decisions" for the reasoning) — the social graph is small enough that
// plain SQL self-joins + in-memory scoring give equivalent results without
// the operational cost of running a second database service.
//
// Score is a weighted blend of:
//   - interest overlap (Jaccard similarity)
//   - skill exchange (what I want to learn vs. what they teach, and vice versa)
//   - language overlap
//   - location proximity (same city > same state > different state)
//   - mutual connections (1-hop graph traversal — "friend of a friend")
//   - mode compatibility (in-person / online / both)
//   - recent activity (lightly rewards people who are actually active)
//
// The result always includes a `reasons` array of short, specific,
// human-readable clauses (not a single vague sentence) so the UI can render
// a transparent "why you matched" breakdown.

/**
 * Returns the set of user IDs directly connected (status = CONNECTED) to the
 * given user. Used both for connection-status lookups and for computing
 * mutual-connection ("friend of a friend") overlap between two users.
 */
export function getConnectedFriendIds(db, userId) {
  const rows = db.prepare(`
    SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END AS friend_id
    FROM connections
    WHERE status = 'CONNECTED' AND (requester_id = ? OR receiver_id = ?)
  `).all(userId, userId, userId);
  return new Set(rows.map(r => r.friend_id));
}

function titleCase(str) {
  return str.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function isRecentlyActive(lastActiveAt) {
  if (!lastActiveAt) return false;
  const last = new Date(lastActiveAt.endsWith('Z') ? lastActiveAt : `${lastActiveAt}Z`).getTime();
  if (Number.isNaN(last)) return false;
  return Date.now() - last < 1000 * 60 * 60 * 24 * 7; // active within 7 days
}

/**
 * @param {object} me
 * @param {{interest_id:string, intention:string}[]} me.interests
 * @param {{skill:string, skill_type:'TEACH'|'LEARN'}[]} me.skills
 * @param {string[]} me.languages
 * @param {string} me.state
 * @param {string} me.city
 * @param {string} me.mode
 * @param {Set<string>} me.friendIds
 *
 * @param {object} them  — same shape as `me`, plus `them.id`
 * @returns {{ score:number, reason:string, reasons:string[], mutualConnections:number }}
 */
export function computeMatch(me, them) {
  const myInterestIds = me.interests.map(i => i.interest_id);
  const theirInterestIds = them.interests.map(i => i.interest_id);
  const mySet = new Set(myInterestIds);
  const theirSet = new Set(theirInterestIds);
  const sharedInterests = [...mySet].filter(x => theirSet.has(x));
  const unionSize = new Set([...mySet, ...theirSet]).size;
  const jaccard = unionSize > 0 ? sharedInterests.length / unionSize : 0;

  let score = 0;
  const reasons = [];

  // ── 1. Interest overlap — up to 42 points ──────────────────────────────
  score += Math.round(jaccard * 42);
  if (sharedInterests.length > 0) {
    const labels = sharedInterests.slice(0, 3).map(titleCase);
    reasons.push(
      sharedInterests.length === 1
        ? `You both care about ${labels[0]}.`
        : `You share ${sharedInterests.length} interests, including ${labels.join(', ')}.`
    );
  }

  // ── 2. Skill exchange — up to 20 points, both directions ───────────────
  const theyTeach = new Set(them.skills.filter(s => s.skill_type === 'TEACH').map(s => s.skill.toLowerCase()));
  const theyLearn = new Set(them.skills.filter(s => s.skill_type === 'LEARN').map(s => s.skill.toLowerCase()));
  const iTeach = new Set(me.skills.filter(s => s.skill_type === 'TEACH').map(s => s.skill.toLowerCase()));
  const iLearn = new Set(me.skills.filter(s => s.skill_type === 'LEARN').map(s => s.skill.toLowerCase()));

  const theyCanTeachMe = [...iLearn].filter(s => theyTeach.has(s));
  const iCanTeachThem = [...theyLearn].filter(s => iTeach.has(s));

  if (theyCanTeachMe.length > 0) {
    score += 14;
    reasons.push(`They can teach you ${theyCanTeachMe.slice(0, 2).map(titleCase).join(' and ')}.`);
  }
  if (iCanTeachThem.length > 0) {
    score += 6;
    reasons.push(`You can teach them ${iCanTeachThem.slice(0, 2).map(titleCase).join(' and ')}.`);
  }

  // ── 3. Language overlap — up to 10 points ──────────────────────────────
  const sharedLanguages = me.languages.filter(l => them.languages.includes(l));
  if (sharedLanguages.length > 0) {
    score += Math.min(sharedLanguages.length * 4, 10);
    reasons.push(`You both speak ${sharedLanguages.slice(0, 2).join(' and ')}.`);
  }

  // ── 4. Location proximity — up to 14 points ────────────────────────────
  const sameCity = me.city && them.city && me.city.trim().toLowerCase() === them.city.trim().toLowerCase();
  const sameState = me.state && them.state && me.state.trim().toLowerCase() === them.state.trim().toLowerCase();
  if (sameCity) {
    score += 14;
    reasons.push(`You're both based in ${them.city}.`);
  } else if (sameState) {
    score += 7;
    reasons.push(`You're both in ${them.state}.`);
  }

  // ── 5. Mutual connections — graph traversal, up to 15 points ───────────
  const mutualConnections = [...me.friendIds].filter(id => them.friendIds.has(id)).length;
  if (mutualConnections > 0) {
    score += Math.min(mutualConnections * 5, 15);
    reasons.push(
      mutualConnections === 1
        ? '1 mutual connection.'
        : `${mutualConnections} mutual connections.`
    );
  }

  // ── 6. Mode compatibility — up to 4 points ─────────────────────────────
  const modeCompatible = me.mode === 'BOTH' || them.mode === 'BOTH' || me.mode === them.mode;
  if (modeCompatible) score += 4;

  // ── 7. Recent activity — up to 3 points ────────────────────────────────
  if (isRecentlyActive(them.lastActiveAt)) {
    score += 3;
    reasons.push('Active on Anvesha recently.');
  }

  score = Math.min(Math.max(Math.round(score), 1), 99);

  if (reasons.length === 0) {
    reasons.push("You're both part of the Anvesha community — say hello!");
  }

  return {
    score,
    reason: reasons.join(' '),
    reasons,
    mutualConnections,
  };
}
