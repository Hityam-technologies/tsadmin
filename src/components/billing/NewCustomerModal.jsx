import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { billingService } from '../../services/billingService';
import { User, Mail } from 'lucide-react';

export function NewCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [gstin, setGstin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide patron name.');
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit WhatsApp phone number.');
      return;
    }

    const created = await billingService.createCustomer({
      name,
      phone: `+91 ${phone.replace(/[^0-9]/g, '')}`,
      email,
      city,
      gstin,
    });

    onCustomerCreated(created);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Patron Profile"
      subtitle="Register customer for digital tax invoices & handloom loyalty privileges"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 font-sans text-charcoal-900">
        {error && (
          <div className="p-2.5 rounded-xl bg-maroon-50 border border-maroon-200 text-maroon-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-charcoal-800 mb-1">
            Patron Full Name *
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smt. Gayatri Devi"
              className="w-full rounded-xl border border-sand-300 pl-8 pr-3 py-2 text-xs text-charcoal-900 focus:border-gold-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-800 mb-1">
            WhatsApp Mobile Number (10 digits) *
          </label>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-2.5 rounded-xl border border-sand-300 bg-sand-100 text-xs font-bold text-charcoal-700">
              🇮🇳 +91
            </span>
            <input
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="9823456789"
              className="flex-1 rounded-xl border border-sand-300 px-3 py-2 text-xs font-mono font-bold text-charcoal-900 focus:border-gold-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-800 mb-1">
            Email Address (Optional)
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patron@tripuraa.in"
              className="w-full rounded-xl border border-sand-300 pl-8 pr-3 py-2 text-xs text-charcoal-900 focus:border-gold-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-charcoal-900 focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              GSTIN (B2B Only)
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="36ABCDE1234F1Z5"
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs font-mono text-charcoal-900 focus:border-gold-500 uppercase"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-sand-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-sand-300 text-xs font-bold text-charcoal-700 hover:bg-sand-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-extrabold shadow-md shadow-gold-600/20"
          >
            Save Patron & Use for Bill
          </button>
        </div>
      </form>
    </Modal>
  );
}
