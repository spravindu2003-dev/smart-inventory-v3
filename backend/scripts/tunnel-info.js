/**
 * Cloudflare Tunnel Info Helper
 * ==============================
 * Run:   node scripts/tunnel-info.js <tunnel-url>
 *
 * Example:
 *   node scripts/tunnel-info.js https://my-tunnel.trycloudflare.com
 *
 * Prints the VITE_API_URL value to set in Vercel Dashboard.
 * If no URL is provided, reads from BACKEND_TUNNEL_URL env or .env.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const tunnelUrl = process.argv[2] || process.env.BACKEND_TUNNEL_URL || process.env.CORS_ORIGIN;

console.log('');
console.log('╔══════════════════════════════════════════════════╗');
console.log('║        CLOUDFLARE TUNNEL — VERCEL SETUP         ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

if (tunnelUrl && !tunnelUrl.startsWith('http')) {
  console.log('  Tunnel URL detected from env. Try passing it as argument:');
  console.log('  node scripts/tunnel-info.js https://your-tunnel.trycloudflare.com');
  console.log('');
  process.exit(0);
}

if (tunnelUrl) {
  const apiUrl = tunnelUrl.replace(/\/+$/, '') + '/api';
  console.log(`  🌐  Tunnel URL: ${tunnelUrl}`);
  console.log(`  🔗  API URL:    ${apiUrl}`);
  console.log('');
  console.log('  ── STEP 1 ──────────────────────────────────────');
  console.log('  Go to Vercel Dashboard → Project → Settings');
  console.log('  → Environment Variables');
  console.log('');
  console.log('  ── STEP 2 ──────────────────────────────────────');
  console.log('  Add or update:');
  console.log(`    Key:   VITE_API_URL`);
  console.log(`    Value: ${apiUrl}`);
  console.log(`    Scope: Production`);
  console.log('');
  console.log('  ── STEP 3 ──────────────────────────────────────');
  console.log('  Redeploy your frontend on Vercel.');
  console.log('');
} else {
  console.log('  No tunnel URL provided.');
  console.log('');
  console.log('  Usage:');
  console.log('  node scripts/tunnel-info.js https://your-tunnel.trycloudflare.com');
  console.log('');
  console.log('  Or set BACKEND_TUNNEL_URL in backend/.env:');
  console.log('  BACKEND_TUNNEL_URL=https://your-tunnel.trycloudflare.com');
  console.log('');
}

if (tunnelUrl && !tunnelUrl.includes('trycloudflare.com')) {
  console.log('  ⚠  NOTE: URL does not look like a Cloudflare tunnel.');
  console.log('     Make sure it is the correct tunnel URL.');
  console.log('');
}
