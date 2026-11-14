import React, { useState, useEffect } from 'react';
import { contentService } from '../services/contentService';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Film,
  MapPin,
  MessageCircle,
  HelpCircle,
  FileText,
  Save,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';

export function ContentStudioPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'store' | 'support' | 'faq' | 'legal'

  // 1. Hero Video State
  const [heroVideo, setHeroVideo] = useState({
    title: '',
    subtitle: '',
    videoUrl: '',
    posterUrl: '',
    autoPlay: true,
    loop: true,
    isActive: true,
  });

  // 2. STORE State
  const [storeAddress, setStoreAddress] = useState({
    name: '',
    tagline: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    timings: '',
    latitude: 17.4326,
    longitude: 78.4071,
    mapsQuery: '',
    contactPhone: '',
    conciergeEmail: '',
  });

  // 3. Support Channels State
  const [supportChannels, setSupportChannels] = useState([]);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [channelForm, setChannelForm] = useState({
    platform: '',
    value: '',
    label: '',
    defaultMessage: '',
    color: '#25D366',
    isActive: true,
  });

  // 4. FAQ State
  const [faqs, setFaqs] = useState([]);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'Authenticity' });
  const [deleteFaqId, setDeleteFaqId] = useState(null);

  // 5. Legal Pages State
  const [legalType, setLegalType] = useState('terms'); // 'terms' | 'policy'
  const [legalSections, setLegalSections] = useState([]);
  const [previewMarkdown, setPreviewMarkdown] = useState(false);

  // Load active tab data
  useEffect(() => {
    async function loadData() {
      if (activeTab === 'hero') {
        const res = await contentService.getHeroVideo();
        if (res.success) setHeroVideo(res.data);
      } else if (activeTab === 'store') {
        const res = await contentService.getStoreAddress();
        if (res.success) setStoreAddress(res.data);
      } else if (activeTab === 'support') {
        const res = await contentService.getSupportChannels();
        if (res.success) setSupportChannels(res.data);
      } else if (activeTab === 'faq') {
        const res = await contentService.getFaqs();
        if (res.success) setFaqs(res.data);
      } else if (activeTab === 'legal') {
        const res = await contentService.getLegal(legalType);
        if (res.success) {
          const payload = res.data;
          const sections = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.sections)
              ? payload.sections
              : [];
          setLegalSections(sections);
        }
      }
    }
    loadData();
  }, [activeTab, legalType]);

  // Save Hero Video
  const handleSaveHero = async (e) => {
    e.preventDefault();
    const res = await contentService.updateHeroVideo(heroVideo);
    if (res.success) showToast('Hero video reel updated successfully', 'success');
  };

  // Save Store Address
  const handleSaveStore = async (e) => {
    e.preventDefault();
    const res = await contentService.updateStoreAddress(storeAddress);
    if (res.success) showToast('store studio address updated', 'success');
  };

  // Channel Save & Reorder
  const handleSaveChannel = async (e) => {
    e.preventDefault();
    const newChan = {
      ...channelForm,
      id: `ch-${Date.now()}`,
      order: supportChannels.length + 1,
    };
    const updated = [...supportChannels, newChan];
    const res = await contentService.updateSupportChannels(updated);
    if (res.success) {
      setSupportChannels(res.data);
      setIsChannelModalOpen(false);
      showToast('Support channel added', 'success');
    }
  };

  const handleReorderChannels = async (idx, dir) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= supportChannels.length) return;
    const list = [...supportChannels];
    const [moved] = list.splice(idx, 1);
    list.splice(targetIdx, 0, moved);
    list.forEach((c, i) => (c.order = i + 1));
    const res = await contentService.updateSupportChannels(list);
    if (res.success) {
      setSupportChannels(res.data);
      showToast('Reordered support channels', 'info');
    }
  };

  // FAQ CRUD & Reorder
  const handleOpenFaqCreate = () => {
    setEditingFaq(null);
    setFaqForm({ question: '', answer: '', category: 'Authenticity' });
    setIsFaqModalOpen(true);
  };

  const handleOpenFaqEdit = (faq) => {
    setEditingFaq(faq);
    setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category || '' });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (editingFaq) {
      const res = await contentService.updateFaq(editingFaq.id, faqForm);
      if (res.success) {
        showToast('FAQ updated', 'success');
        setIsFaqModalOpen(false);
        const ref = await contentService.getFaqs();
        if (ref.success) setFaqs(ref.data);
      }
    } else {
      const res = await contentService.createFaq(faqForm);
      if (res.success) {
        showToast('New FAQ created', 'success');
        setIsFaqModalOpen(false);
        const ref = await contentService.getFaqs();
        if (ref.success) setFaqs(ref.data);
      }
    }
  };

  const handleReorderFaqs = async (idx, dir) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;
    const list = [...faqs];
    const [moved] = list.splice(idx, 1);
    list.splice(targetIdx, 0, moved);
    const orderedIds = list.map((f) => f.id);
    const res = await contentService.reorderFaqs(orderedIds);
    if (res.success) {
      setFaqs(res.data);
      showToast('FAQ order updated', 'info');
    }
  };

  const confirmDeleteFaq = async () => {
    if (!deleteFaqId) return;
    const res = await contentService.deleteFaq(deleteFaqId);
    if (res.success) {
      showToast('FAQ deleted', 'success');
      setDeleteFaqId(null);
      const ref = await contentService.getFaqs();
      if (ref.success) setFaqs(ref.data);
    }
  };

  // Legal Sections Save
  const handleSaveLegal = async () => {
    const res = await contentService.updateLegal(legalType, legalSections);
    if (res.success) showToast(`Published revised ${legalType.toUpperCase()}`, 'success');
  };

  const handleLegalSectionChange = (idx, field, value) => {
    const updated = [...legalSections];
    updated[idx] = { ...updated[idx], [field]: value };
    setLegalSections(updated);
  };

  const handleAddLegalSection = () => {
    const newSection = {
      id: `sec-${Date.now()}`,
      title: `${legalSections.length + 1}. New Legal Clause`,
      content: 'Provide detailed compliance terms regarding artisanal handloom provenance and policy...',
    };
    setLegalSections([...legalSections, newSection]);
  };

  const handleRemoveLegalSection = (idx) => {
    const updated = legalSections.filter((_, i) => i !== idx);
    setLegalSections(updated);
  };

  const tabs = [
    { id: 'hero', label: 'Hero Video Reel', icon: Film },
    { id: 'store', label: 'Store Address', icon: MapPin },
    { id: 'support', label: 'Support Concierge Channels', icon: MessageCircle },
    { id: 'faq', label: 'FAQ Manager', icon: HelpCircle },
    { id: 'legal', label: 'Legal Terms & Policy', icon: FileText },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-sand-300 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">
            Publishing & Communications
          </span>
          <h1 className="font-serif text-2xl font-bold text-charcoal-900 mt-0.5">
            Content Studio
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Dynamic content control: hero reels, flagship studio coordinates, client support dialers, FAQs, and legal policies.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-sand-300 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gold-600 text-white shadow-sm'
                  : 'text-charcoal-600 hover:bg-sand-100 hover:text-charcoal-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Hero Video Reel */}
      {activeTab === 'hero' && (
        <form onSubmit={handleSaveHero} className="bg-white p-6 rounded-2xl border border-sand-300 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-sand-200 pb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Mobile Home Showcase Video
              </h3>
              <p className="text-xs text-charcoal-500">
                Streamed directly on mobile Home screen backdrop underneath the interactive sheet.
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" /> Save Hero Changes
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Showcase Title
                </label>
                <input
                  type="text"
                  value={heroVideo.title}
                  onChange={(e) => setHeroVideo({ ...heroVideo, title: e.target.value })}
                  placeholder="Kausalya Edit by Adhvaria Silks"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Subtitle / Event Attribution
                </label>
                <input
                  type="text"
                  value={heroVideo.subtitle}
                  onChange={(e) => setHeroVideo({ ...heroVideo, subtitle: e.target.value })}
                  placeholder="Hyderabad Times Fashion Week — Vintage Kanchipuram"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  MP4 / HLS Video URL
                </label>
                <input
                  type="url"
                  value={heroVideo.videoUrl}
                  onChange={(e) => setHeroVideo({ ...heroVideo, videoUrl: e.target.value })}
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Fallback Poster Image URL
                </label>
                <input
                  type="url"
                  value={heroVideo.posterUrl}
                  onChange={(e) => setHeroVideo({ ...heroVideo, posterUrl: e.target.value })}
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroVideo.autoPlay}
                    onChange={(e) => setHeroVideo({ ...heroVideo, autoPlay: e.target.checked })}
                    className="rounded border-sand-400 text-gold-600 focus:ring-gold-500"
                  />
                  <span className="text-xs font-medium text-charcoal-800">Autoplay on Load</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroVideo.isActive}
                    onChange={(e) => setHeroVideo({ ...heroVideo, isActive: e.target.checked })}
                    className="rounded border-sand-400 text-gold-600 focus:ring-gold-500"
                  />
                  <span className="text-xs font-medium text-charcoal-800">Active on Mobile App</span>
                </label>
              </div>
            </div>

            {/* Live Video Preview Box */}
            <div className="rounded-xl overflow-hidden border border-sand-300 bg-black flex flex-col justify-center items-center relative aspect-video">
              {heroVideo.videoUrl ? (
                <video
                  src={heroVideo.videoUrl}
                  poster={heroVideo.posterUrl}
                  autoPlay={heroVideo.autoPlay}
                  muted
                  loop={heroVideo.loop}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sand-400 text-xs">No video URL provided</span>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Store Address */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStore} className="bg-white p-6 rounded-2xl border border-sand-300 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-sand-200 pb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Flagship Studio Information
              </h3>
              <p className="text-xs text-charcoal-500">
                Shown in the mobile "Store Address" bottom sheet and Google Maps navigation modal.
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" /> Save Address
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Studio Name
              </label>
              <input
                type="text"
                value={storeAddress.name}
                onChange={(e) => setStoreAddress({ ...storeAddress, name: e.target.value })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Tagline / Subheading
              </label>
              <input
                type="text"
                value={storeAddress.tagline}
                onChange={(e) => setStoreAddress({ ...storeAddress, tagline: e.target.value })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={storeAddress.addressLine1}
                onChange={(e) => setStoreAddress({ ...storeAddress, addressLine1: e.target.value })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Address Line 2 (City, State, PIN)
              </label>
              <input
                type="text"
                value={storeAddress.addressLine2}
                onChange={(e) => setStoreAddress({ ...storeAddress, addressLine2: e.target.value })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Prominent Landmark
              </label>
              <input
                type="text"
                value={storeAddress.landmark}
                onChange={(e) => setStoreAddress({ ...storeAddress, landmark: e.target.value })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Operating Timings
              </label>
              <input
                type="text"
                value={storeAddress.timings}
                onChange={(e) => setStoreAddress({ ...storeAddress, timings: e.target.value })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Latitude Coordinates
              </label>
              <input
                type="number"
                step="any"
                value={storeAddress.latitude}
                onChange={(e) => setStoreAddress({ ...storeAddress, latitude: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Longitude Coordinates
              </label>
              <input
                type="number"
                step="any"
                value={storeAddress.longitude}
                onChange={(e) => setStoreAddress({ ...storeAddress, longitude: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Google Maps Intent Query
              </label>
              <input
                type="text"
                value={storeAddress.mapsQuery}
                onChange={(e) => setStoreAddress({ ...storeAddress, mapsQuery: e.target.value })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:border-gold-500"
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Support Channels */}
      {activeTab === 'support' && (
        <div className="bg-white p-6 rounded-2xl border border-sand-300 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-sand-200 pb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Client Support Channels
              </h3>
              <p className="text-xs text-charcoal-500">
                Shown in the mobile Client Support bottom sheet (WhatsApp, Instagram, Helpline phone).
              </p>
            </div>
            <button
              onClick={() => {
                setChannelForm({
                  platform: '',
                  value: '',
                  label: '',
                  defaultMessage: '',
                  color: '#25D366',
                  isActive: true,
                });
                setIsChannelModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Channel
            </button>
          </div>

          <div className="space-y-3">
            {supportChannels.map((channel, idx) => (
              <div
                key={channel.id}
                className="p-4 rounded-xl border border-sand-300 bg-sand-50/50 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleReorderChannels(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-charcoal-400 hover:text-charcoal-700 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleReorderChannels(idx, 1)}
                      disabled={idx === supportChannels.length - 1}
                      className="p-1 text-charcoal-400 hover:text-charcoal-700 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: channel.color || '#BF5B21' }}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs text-charcoal-900">
                        {channel.platform}
                      </h4>
                      <Badge variant={channel.isActive ? 'gold' : 'default'} size="xs">
                        {channel.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-charcoal-500 font-mono block">
                      Value: {channel.value} &bull; Label: {channel.label}
                    </span>
                    {channel.defaultMessage && (
                      <span className="text-[10px] text-gold-800 italic block">
                        Prefilled text: "{channel.defaultMessage}"
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const filtered = supportChannels.filter((c) => c.id !== channel.id);
                    setSupportChannels(filtered);
                    contentService.updateSupportChannels(filtered);
                    showToast('Channel removed', 'info');
                  }}
                  className="p-1.5 rounded-lg text-charcoal-400 hover:text-maroon-600 hover:bg-maroon-50"
                  title="Remove Channel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: FAQ Manager */}
      {activeTab === 'faq' && (
        <div className="bg-white p-6 rounded-2xl border border-sand-300 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-sand-200 pb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Frequently Asked Questions (FAQ)
              </h3>
              <p className="text-xs text-charcoal-500">
                Reorderable questions and answers displayed in the mobile Account FAQ screen.
              </p>
            </div>
            <button
              onClick={handleOpenFaqCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="p-4 rounded-xl border border-sand-300 bg-sand-50/40 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-0.5">
                    <button
                      onClick={() => handleReorderFaqs(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-charcoal-400 hover:text-charcoal-700 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleReorderFaqs(idx, 1)}
                      disabled={idx === faqs.length - 1}
                      className="p-1 text-charcoal-400 hover:text-charcoal-700 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-charcoal-900">
                        {faq.order}. {faq.question}
                      </span>
                      <Badge variant="gold" size="xs">
                        {faq.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-charcoal-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenFaqEdit(faq)}
                    className="p-1.5 rounded-lg text-charcoal-500 hover:text-gold-700 hover:bg-gold-50"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteFaqId(faq.id)}
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-maroon-600 hover:bg-maroon-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Legal Terms & Policy Editor */}
      {activeTab === 'legal' && (
        <div className="bg-white p-6 rounded-2xl border border-sand-300 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand-200 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLegalType('terms')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  legalType === 'terms'
                    ? 'bg-gold-600 text-white shadow-sm'
                    : 'bg-sand-100 text-charcoal-700'
                }`}
              >
                Terms of Service
              </button>
              <button
                onClick={() => setLegalType('policy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  legalType === 'policy'
                    ? 'bg-gold-600 text-white shadow-sm'
                    : 'bg-sand-100 text-charcoal-700'
                }`}
              >
                Privacy Policy
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMarkdown(!previewMarkdown)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sand-300 text-xs font-medium text-charcoal-700 hover:bg-sand-100"
              >
                <Eye className="w-4 h-4 text-gold-600" />
                <span>{previewMarkdown ? 'Edit Clauses' : 'Live Preview'}</span>
              </button>
              <button
                onClick={handleSaveLegal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" /> Publish Revised Policy
              </button>
            </div>
          </div>

          {previewMarkdown ? (
            /* Live Side-by-Side or Full Markdown Preview */
            <div className="p-6 rounded-xl bg-sand-50/60 border border-sand-200 space-y-6 max-h-[70vh] overflow-y-auto">
              <h2 className="font-serif text-xl font-bold text-charcoal-900 text-center">
                Tripuraa Sangrahah — {legalType === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <div className="space-y-4">
                {legalSections.map((sec, idx) => (
                  <div key={idx} className="space-y-1">
                    <h4 className="font-serif font-bold text-sm text-charcoal-900">{sec.title}</h4>
                    <p className="text-xs text-charcoal-700 leading-relaxed whitespace-pre-line">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Clause Sections Editor */
            <div className="space-y-4">
              {legalSections.map((section, idx) => (
                <div
                  key={section.id || idx}
                  className="p-4 rounded-xl border border-sand-300 bg-sand-50/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleLegalSectionChange(idx, 'title', e.target.value)}
                      className="w-full sm:w-1/2 font-serif font-bold text-xs rounded-lg border border-sand-300 px-3 py-1.5 bg-white text-charcoal-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLegalSection(idx)}
                      className="p-1 rounded text-charcoal-400 hover:text-maroon-600 hover:bg-maroon-50"
                      title="Remove Clause"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={section.content}
                    onChange={(e) => handleLegalSectionChange(idx, 'content', e.target.value)}
                    className="w-full rounded-lg border border-sand-300 p-2 text-xs bg-white text-charcoal-800 leading-relaxed font-sans"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddLegalSection}
                className="w-full py-2.5 rounded-xl border border-dashed border-sand-400 hover:bg-sand-100 text-xs font-semibold text-gold-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Append Additional Clause
              </button>
            </div>
          )}
        </div>
      )}

      {/* FAQ Create / Edit Modal */}
      <Modal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        title={editingFaq ? 'Edit FAQ Item' : 'Create FAQ Item'}
        subtitle="Clarify customer questions regarding silk certification, handloom care, and virtual draping."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveFaq} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Category Tag
            </label>
            <input
              type="text"
              value={faqForm.category}
              onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
              placeholder="e.g. Authenticity, Care, Shipping..."
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Question *
            </label>
            <input
              type="text"
              value={faqForm.question}
              onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
              required
              placeholder="Are all sarees 100% pure silk and certified?"
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Answer *
            </label>
            <textarea
              rows={4}
              value={faqForm.answer}
              onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
              required
              placeholder="Detailed answer explaining Silk Mark accreditation..."
              className="w-full rounded-xl border border-sand-300 p-2.5 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-sand-200">
            <button
              type="button"
              onClick={() => setIsFaqModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border border-sand-300 text-xs text-charcoal-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold"
            >
              {editingFaq ? 'Save FAQ' : 'Create FAQ'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete FAQ Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteFaqId}
        onClose={() => setDeleteFaqId(null)}
        onConfirm={confirmDeleteFaq}
        title="Delete FAQ"
        description="Are you sure you wish to delete this question? It will be removed immediately from the mobile FAQ screen."
        confirmText="Confirm Delete"
      />

      {/* Support Channel Modal */}
      <Modal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        title="Add Support Concierge Channel"
        subtitle="Shown in the mobile client support drawer"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveChannel} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Platform Name *
            </label>
            <input
              type="text"
              value={channelForm.platform}
              onChange={(e) => setChannelForm({ ...channelForm, platform: e.target.value })}
              required
              placeholder="e.g. WhatsApp Concierge"
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Contact Value (Phone / Username) *
            </label>
            <input
              type="text"
              value={channelForm.value}
              onChange={(e) => setChannelForm({ ...channelForm, value: e.target.value })}
              required
              placeholder="+919876543210"
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Display Label
            </label>
            <input
              type="text"
              value={channelForm.label}
              onChange={(e) => setChannelForm({ ...channelForm, label: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Prefilled WhatsApp Message
            </label>
            <input
              type="text"
              value={channelForm.defaultMessage}
              onChange={(e) => setChannelForm({ ...channelForm, defaultMessage: e.target.value })}
              placeholder="Namaste Tripuraa Sangrahah!"
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-sand-200">
            <button
              type="button"
              onClick={() => setIsChannelModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border border-sand-300 text-xs text-charcoal-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold"
            >
              Add Channel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
