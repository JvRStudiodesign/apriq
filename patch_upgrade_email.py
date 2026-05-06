#!/usr/bin/env python3
"""
Patches Layout.jsx and UpgradeModal.jsx to fix missing email on PayFast sign request.
Run from repo root: python3 patch_upgrade_email.py
"""

import sys

# ── 1. Layout.jsx — pass profile to UpgradeModal ────────────────────────────
layout_path = 'src/components/Layout.jsx'
with open(layout_path, 'r') as f:
    layout = f.read()

old = '<UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} user={user} />'
new = '<UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} user={user} profile={profile} />'

if old not in layout:
    print(f'ERROR: Could not find UpgradeModal line in {layout_path}')
    print('Current line may differ — search manually for UpgradeModal in Layout.jsx')
    sys.exit(1)

layout = layout.replace(old, new)

# Also make sure profile is destructured from useAuth in Layout
old_auth = 'const { user } = useAuth();'
new_auth = 'const { user, profile } = useAuth();'
if old_auth in layout:
    layout = layout.replace(old_auth, new_auth)

with open(layout_path, 'w') as f:
    f.write(layout)
print(f'  ✓  {layout_path}')

# ── 2. UpgradeModal.jsx — accept profile prop, use profile.email as fallback ─
modal_path = 'src/components/UpgradeModal.jsx'
with open(modal_path, 'r') as f:
    modal = f.read()

old_sig = 'export default function UpgradeModal({ isOpen, onClose, user }) {'
new_sig = 'export default function UpgradeModal({ isOpen, onClose, user, profile }) {'
if old_sig not in modal:
    print(f'ERROR: Could not find function signature in {modal_path}')
    sys.exit(1)
modal = modal.replace(old_sig, new_sig)

old_check = """  async function handleUpgrade() {
    if (!user?.id || !user?.email) {
      setError('You must be logged in to upgrade.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Get signed params from server
      const res = await fetch('/api/payfast-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:    user.id,
          email:     user.email,
          firstName: user.user_metadata?.full_name?.split(' ')[0] || '',
          lastName:  user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        }),
      });"""

new_check = """  async function handleUpgrade() {
    // Resolve email and name — profile is more reliable than auth user object
    const userId    = user?.id;
    const email     = user?.email || profile?.email;
    const fullName  = profile?.full_name || user?.user_metadata?.full_name || '';

    if (!userId || !email) {
      setError('You must be logged in to upgrade.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Get signed params from server
      const res = await fetch('/api/payfast-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          firstName: fullName.split(' ')[0] || '',
          lastName:  fullName.split(' ').slice(1).join(' ') || '',
        }),
      });"""

if old_check not in modal:
    print(f'ERROR: Could not find handleUpgrade body in {modal_path}')
    print('The function body may have changed — check manually.')
    sys.exit(1)

modal = modal.replace(old_check, new_check)

with open(modal_path, 'w') as f:
    f.write(modal)
print(f'  ✓  {modal_path}')

print('\nDone. Deploy with: git add . && git commit -m "fix: use profile email fallback in UpgradeModal" && git push')

