const app = require('./app');
const { PORT } = require('./config/env');
const supabase = require('./lib/supabase');

// Khi server khởi động lại, các job đang running trong RAM sẽ bị mất.
// Tự động mark các records "running" không có end_time là "failed".
async function cleanupStuckJobs() {
  const { data, error } = await supabase
    .from('test_reports')
    .update({ status: 'failed', end_time: new Date().toISOString() })
    .eq('status', 'running')
    .is('end_time', null)
    .select('id');
  if (error) {
    console.warn('[startup] Could not cleanup stuck jobs:', error.message);
  } else if (data?.length > 0) {
    console.log(`[startup] Marked ${data.length} stuck job(s) as failed (server was restarted)`);
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`TestPilot backend running at http://0.0.0.0:${PORT}`);
  await cleanupStuckJobs();
});

module.exports = app;
