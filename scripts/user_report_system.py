#!/usr/bin/env python3
"""
User Report System for Gulf Watch
Tracks user reports and auto-hides content after threshold
"""

import json
import hashlib
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional
from collections import defaultdict

# SECURITY: Admin key must be set via environment variable
# NEVER hardcode secrets in source code
ADMIN_KEY = os.environ.get('GULFWATCH_ADMIN_KEY', '')

class UserReportSystem:
    """
    Manages user reports for false information.
    Auto-hides content after 5 reports.
    Prevents gaming via device fingerprinting.
    """
    
    def __init__(self, reports_file: str = 'public/user_reports.json'):
        self.reports_file = reports_file
        self.reports = self._load_reports()
    
    def _load_reports(self) -> Dict:
        """Load existing reports"""
        try:
            with open(self.reports_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'total_reports': 0,
                'reports': {},  # incident_id -> list of reports
                'hidden_incidents': [],  # incident_ids with 5+ reports
                'report_reasons': {
                    'false_info': 'False or misleading information',
                    'wrong_location': 'Wrong location',
                    'outdated': 'Outdated (already resolved)',
                    'duplicate': 'Duplicate of another incident',
                    'wrong_title': 'Misleading headline'
                }
            }
    
    def _save_reports(self):
        """Save reports to file"""
        self.reports['generated_at'] = datetime.now(timezone.utc).isoformat()
        with open(self.reports_file, 'w') as f:
            json.dump(self.reports, f, indent=2)
    
    def _generate_fingerprint(self, incident_id: str, user_agent: str = '', ip: str = '') -> str:
        """Generate device fingerprint to prevent duplicate reports"""
        # SECURITY: Hash the IP, never store raw IP addresses
        # This protects user privacy while still preventing duplicate reports
        ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:16] if ip else 'no-ip'
        
        # Combine with user agent and incident
        data = f"{incident_id}:{user_agent}:{ip_hash}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def add_report(self, incident_id: str, reason: str, details: str = '', 
                   user_agent: str = '', ip: str = '') -> Dict:
        """
        Add a new report for an incident
        Returns: {'success': bool, 'message': str, 'total_reports': int}
        """
        # Validate reason
        if reason not in self.reports['report_reasons']:
            return {
                'success': False,
                'message': 'Invalid report reason',
                'total_reports': 0
            }
        
        # Check if already hidden
        if incident_id in self.reports['hidden_incidents']:
            return {
                'success': False,
                'message': 'This incident is already under review',
                'total_reports': 5
            }
        
        # Check for duplicate report from same device
        fingerprint = self._generate_fingerprint(incident_id, user_agent, ip)
        
        if incident_id not in self.reports['reports']:
            self.reports['reports'][incident_id] = []
        
        existing_fingerprints = [r.get('fingerprint') for r in self.reports['reports'][incident_id]]
        if fingerprint in existing_fingerprints:
            return {
                'success': False,
                'message': 'You have already reported this incident',
                'total_reports': len(self.reports['reports'][incident_id])
            }
        
        # Add report
        report = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'reason': reason,
            'details': details,
            'fingerprint': fingerprint
        }
        
        self.reports['reports'][incident_id].append(report)
        self.reports['total_reports'] += 1
        
        total = len(self.reports['reports'][incident_id])
        
        # Check if should be hidden (5 reports)
        if total >= 5 and incident_id not in self.reports['hidden_incidents']:
            self.reports['hidden_incidents'].append(incident_id)
            message = f'Report submitted. This incident has been flagged for review ({total} reports).'
        else:
            message = f'Report submitted. Thank you for helping keep Gulf Watch accurate. ({total}/5 reports)'
        
        self._save_reports()
        
        return {
            'success': True,
            'message': message,
            'total_reports': total,
            'is_hidden': total >= 5
        }
    
    def get_incident_reports(self, incident_id: str) -> Dict:
        """Get report count and status for an incident"""
        reports = self.reports['reports'].get(incident_id, [])
        is_hidden = incident_id in self.reports['hidden_incidents']
        
        # Count by reason
        reason_counts = defaultdict(int)
        for r in reports:
            reason_counts[r['reason']] += 1
        
        return {
            'total_reports': len(reports),
            'is_hidden': is_hidden,
            'reports_until_hidden': max(0, 5 - len(reports)),
            'reason_breakdown': dict(reason_counts)
        }
    
    def get_all_hidden(self) -> List[str]:
        """Get list of all hidden incident IDs"""
        return self.reports['hidden_incidents']
    
    def unhide_incident(self, incident_id: str, admin_key: str) -> bool:
        """Admin function to unhide an incident (requires admin key)"""
        # SECURITY: Use constant-time comparison to prevent timing attacks
        import hmac
        
        if not ADMIN_KEY or not admin_key:
            return False
        
        if not hmac.compare_digest(admin_key, ADMIN_KEY):
            return False
        
        if incident_id in self.reports['hidden_incidents']:
            self.reports['hidden_incidents'].remove(incident_id)
            self._save_reports()
            return True
        return False
    
    def get_stats(self) -> Dict:
        """Get reporting statistics"""
        return {
            'total_reports': self.reports['total_reports'],
            'total_hidden': len(self.reports['hidden_incidents']),
            'report_reasons': self.reports['report_reasons'],
            'reports_by_reason': self._get_reports_by_reason()
        }
    
    def _get_reports_by_reason(self) -> Dict:
        """Get breakdown of reports by reason"""
        counts = defaultdict(int)
        for incident_reports in self.reports['reports'].values():
            for r in incident_reports:
                counts[r['reason']] += 1
        return dict(counts)
    
    def export_for_frontend(self, output_file: str = 'public/report_status.json'):
        """Export report status for frontend use"""
        output = {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'hidden_incidents': self.reports['hidden_incidents'],
            'report_counts': {
                incident_id: len(reports)
                for incident_id, reports in self.reports['reports'].items()
            },
            'report_reasons': self.reports['report_reasons']
        }
        
        with open(output_file, 'w') as f:
            json.dump(output, f, indent=2)
        
        print(f"Exported report status to {output_file}")
        print(f"  Hidden incidents: {len(output['hidden_incidents'])}")
        print(f"  Total reported: {len(output['report_counts'])}")
        
        return output


def main():
    """Initialize or test report system"""
    reports = UserReportSystem()
    
    # Show stats
    stats = reports.get_stats()
    print(f"Report System Status:")
    print(f"  Total reports: {stats['total_reports']}")
    print(f"  Hidden incidents: {stats['total_hidden']}")
    print(f"  Report reasons: {list(stats['report_reasons'].keys())}")
    
    # Export for frontend
    reports.export_for_frontend()


if __name__ == '__main__':
    main()
