import React from 'react';
import { CreditCard, Zap, Check } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Credits.css';

const Credits = () => {
  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">Credits & Billing</h1>
          <p className="page-subtitle">Manage your subscription and pay-per-file credits.</p>
        </div>
      </div>

      <div className="dashboard-stats-grid mb-6">
        <Card title="Available Credits" icon={<CreditCard size={24} />} value="4 Uploads" />
        <Card title="Current Plan" icon={<Zap size={24} />} value="Pay-per-file" />
      </div>

      <h2 className="section-title mb-4">Upgrade Your Plan</h2>
      <div className="pricing-grid mb-6">
        <div className="pricing-card">
          <h3>Pay-per-file</h3>
          <div className="price"><span>$5</span>/file</div>
          <ul className="features">
            <li><Check size={16} className="text-success" /> Secure Encryption</li>
            <li><Check size={16} className="text-success" /> File Hosting for 30 Days</li>
            <li><Check size={16} className="text-success" /> Standard Support</li>
          </ul>
          <Button variant="outline" className="w-full mt-4">Current Plan</Button>
        </div>

        <div className="pricing-card popular">
          <div className="popular-badge">Most Popular</div>
          <h3>Pro Unlimited</h3>
          <div className="price"><span>$29</span>/month</div>
          <ul className="features">
            <li><Check size={16} className="text-success" /> Unlimited Secure Uploads</li>
            <li><Check size={16} className="text-success" /> Infinite File Retention</li>
            <li><Check size={16} className="text-success" /> Custom Branding</li>
            <li><Check size={16} className="text-success" /> Priority Support</li>
          </ul>
          <Button variant="primary" className="w-full mt-4">Upgrade to Pro</Button>
        </div>
      </div>
    </div>
  );
};

export default Credits;
