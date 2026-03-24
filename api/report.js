const fs = require('fs');
const path = require('path');

const REPORTS_FILE = path.join(process.cwd(), 'public', 'user_reports.json');
const REPORT_STATUS_FILE = path.join(process.cwd(), 'public', 'report_status.json');

function defaultReports() {
  return {
    generated_at: new Date().toISOString(),
    total_reports: 0,
    reports: {},
    hidden_incidents: [],
    report_reasons: {
      false_info: 'False or misleading information',
      wrong_location: 'Wrong location',
      outdated: 'Outdated (already resolved)',
      duplicate: 'Duplicate of another incident',
      wrong_title: 'Misleading headline',
    },
  };
}

function loadReports() {
  try {
    return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
  } catch {
    return defaultReports();
  }
}

function saveReports(data) {
  const next = { ...data, generated_at: new Date().toISOString() };

  fs.mkdirSync(path.dirname(REPORTS_FILE), { recursive: true });
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(next, null, 2));

  const status = {
    generated_at: next.generated_at,
    hidden_incidents: next.hidden_incidents,
    report_counts: Object.fromEntries(
      Object.entries(next.reports).map(([key, value]) => [key, value.length]),
    ),
    report_reasons: next.report_reasons,
  };

  fs.writeFileSync(REPORT_STATUS_FILE, JSON.stringify(status, null, 2));
  return next;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { incident_id, reason, details = '', fingerprint = '' } = req.body || {};

    if (!incident_id || !reason) {
      res.status(400).json({ error: 'Missing incident_id or reason' });
      return;
    }

    const reports = loadReports();

    if (!reports.report_reasons[reason]) {
      res.status(400).json({ error: 'Invalid reason' });
      return;
    }

    if (reports.hidden_incidents.includes(incident_id)) {
      res.status(200).json({
        success: false,
        message: 'This incident is already under review',
        total_reports: 5,
      });
      return;
    }

    if (!reports.reports[incident_id]) {
      reports.reports[incident_id] = [];
    }

    const existingFingerprints = reports.reports[incident_id].map((report) => report.fingerprint);
    if (fingerprint && existingFingerprints.includes(fingerprint)) {
      res.status(200).json({
        success: false,
        message: 'You have already reported this incident',
        total_reports: reports.reports[incident_id].length,
      });
      return;
    }

    reports.reports[incident_id].push({
      timestamp: new Date().toISOString(),
      reason,
      details,
      fingerprint,
    });
    reports.total_reports += 1;

    const total = reports.reports[incident_id].length;
    const isHidden = total >= 5;

    if (isHidden && !reports.hidden_incidents.includes(incident_id)) {
      reports.hidden_incidents.push(incident_id);
    }

    saveReports(reports);

    res.status(200).json({
      success: true,
      message: isHidden
        ? `This incident has been flagged for review (${total} reports).`
        : `Thank you for helping keep Gulf Watch accurate. (${total}/5 reports)`,
      total_reports: total,
      is_hidden: isHidden,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
