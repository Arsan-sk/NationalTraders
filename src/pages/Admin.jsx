import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../store.jsx';
import { priceText } from '../lib.js';
import {
  loginAdmin,
  logoutAdmin,
  checkSession,
  uploadProductImage
} from '../supabase.js';

const BLANK_PRODUCT = {
  id: '',
  name: '',
  cat: '',
  price: '',
  note: '',
  e: '🛍️',
  img: '',
  fallback_url: '',
  image_path: '',
  q: ''
};

// Client-side image resize helper before upload
const resizeImage = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, 800 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Check existing session on load
  useEffect(() => {
    let mounted = true;
    checkSession()
      .then(auth => {
        if (mounted) {
          setIsAuthenticated(auth);
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        if (mounted) setCheckingAuth(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleLogin = async e => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await loginAdmin(usernameInput.trim(), passwordInput);
      setIsAuthenticated(true);
      setPasswordInput('');
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
  };

  if (checkingAuth) {
    return (
      <section className="adm narrow" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p className="lead">Verifying admin credentials...</p>
      </section>
    );
  }

  // Admin Login Page with Back Button
  if (!isAuthenticated) {
    return (
      <section className="adm narrow" style={{ maxWidth: '440px', margin: '3rem auto', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '.4rem' }}>🔐</div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 .3rem' }}>Admin Portal</h1>
          <p className="small">National Trader Management Dashboard</p>
        </div>

        <form className="form box" onSubmit={handleLogin} style={{ padding: '1.8rem', borderRadius: '14px', background: '#fff' }}>
          <label>
            Username
            <input
              required
              autoFocus
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              autoComplete="username"
              placeholder="e.g. admin"
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>
          {loginError && <p role="alert" className="err">{loginError}</p>}
          <button className="btn red" type="submit" disabled={loginLoading} style={{ marginTop: '.8rem', width: '100%' }}>
            {loginLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Back Button for User-Friendly Return to Store */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link
            to="/"
            className="btn"
            style={{
              background: 'var(--steel)',
              color: 'var(--ink)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.4rem',
              fontSize: '.95rem',
              padding: '.6rem 1.2rem',
              borderRadius: '8px'
            }}
          >
            ← Back to National Trader Store
          </Link>
        </div>
      </section>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

function AdminDashboard({ onLogout }) {
  const {
    shop,
    categories,
    products,
    featuredSections,
    productFeaturedMap,
    isSupabaseLive,
    refresh,
    saveProduct,
    deleteProduct,
    toggleSection,
    saveShop,
    saveCategories,
    deleteCategory,
    reset
  } = useCatalog();

  // Redirects directly to Dashboard (overview) on login as requested
  const [activeTab, setActiveTab] = useState('overview'); // overview | products | featured | settings
  const [viewMode, setViewMode] = useState('cards'); // cards | table
  const [feedback, setFeedback] = useState({ text: '', type: 'ok' });
  const [modalOpen, setModalOpen] = useState(false);
  const [formProduct, setFormProduct] = useState(BLANK_PRODUCT);
  const [formSections, setFormSections] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Filter & search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterSection, setFilterSection] = useState('all');

  // Active section inside the featured sections tab
  const [activeSectionId, setActiveSectionId] = useState(featuredSections[0]?.id || 'hero_deals');
  const [productToAdd, setProductToAdd] = useState('');

  // Settings tab states
  const [shopForm, setShopForm] = useState({
    wa: shop.wa,
    instagram: shop.instagram,
    wholesaleIg: shop.wholesaleIg,
    youtube: shop.youtube,
    branchesText: shop.branches.map(b => `${b.name} | ${b.phone}`).join('\n')
  });

  const notify = (text, type = 'ok') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback({ text: '', type: 'ok' }), 4000);
  };

  // Open Create Product Modal
  const openCreateModal = () => {
    setFormProduct(BLANK_PRODUCT);
    setFormSections([]);
    setModalOpen(true);
  };

  // Open Edit Product Modal (Emoji fallback completely removed from user inputs)
  const openEditModal = p => {
    setFormProduct({
      ...BLANK_PRODUCT,
      ...p,
      fallback_url: p.fallback_url || p.fallbackUrl || '',
      price: p.price ?? ''
    });
    const assignedSecs = Array.from(productFeaturedMap[p.id] || []);
    setFormSections(assignedSecs);
    setModalOpen(true);
  };

  // Handle image upload to Supabase Storage
  const handleImageFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const resizedBase64 = await resizeImage(file);
      try {
        const uploadRes = await uploadProductImage(resizedBase64, file.name);
        if (uploadRes && uploadRes.url) {
          setFormProduct(prev => ({
            ...prev,
            img: uploadRes.url,
            image_path: uploadRes.path
          }));
          notify('Primary image uploaded to Supabase Storage!');
        } else {
          setFormProduct(prev => ({ ...prev, img: resizedBase64, image_path: '' }));
          notify('Primary image stored locally.');
        }
      } catch (uploadErr) {
        console.warn('Storage upload notice:', uploadErr.message);
        setFormProduct(prev => ({ ...prev, img: resizedBase64, image_path: '' }));
        notify('Primary image stored locally (fallback).');
      }
    } catch {
      notify('Could not process that image file.', 'err');
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Product Form
  const handleProductSubmit = async e => {
    e.preventDefault();
    if (!formProduct.name.trim()) {
      notify('Please enter a product name.', 'err');
      return;
    }
    if (!formProduct.cat) {
      notify('Please pick a category.', 'err');
      return;
    }

    const isEdit = Boolean(formProduct.id);
    const productId = formProduct.id || `p${Date.now()}`;
    const cleanProduct = {
      ...formProduct,
      id: productId,
      name: formProduct.name.trim(),
      fallback_url: formProduct.fallback_url ? formProduct.fallback_url.trim() : '',
      price: formProduct.price !== '' && !isNaN(Number(formProduct.price)) ? Number(formProduct.price) : null
    };

    const oldProduct = products.find(x => x.id === productId);
    const oldImagePath = oldProduct?.image_path;

    await saveProduct(cleanProduct, formSections, oldImagePath);
    setModalOpen(false);
    notify(isEdit ? `Updated "${cleanProduct.name}" successfully!` : `Created product "${cleanProduct.name}"!`);
  };

  // Delete product with confirmation
  const handleDeleteProduct = async p => {
    if (window.confirm(`Delete "${p.name}"?\n\nThis will remove the product, all its featured section associations, and any uploaded image.`)) {
      await deleteProduct(p.id, p.image_path);
      notify(`Deleted "${p.name}".`);
    }
  };

  // Toggle single section membership
  const handleSectionCheckboxToggle = async (productId, sectionId, checked) => {
    await toggleSection(productId, sectionId, checked);
    const sec = featuredSections.find(s => s.id === sectionId);
    notify(`${checked ? 'Added to' : 'Removed from'} ${sec?.title || sectionId}`);
  };

  // Save Shop details
  const handleSaveShop = async e => {
    e.preventDefault();
    const branches = shopForm.branchesText
      .split('\n')
      .map(line => line.split('|').map(s => s.trim()))
      .filter(([n, p]) => n && p)
      .map(([name, phone]) => ({ name, phone }));

    const updatedShop = {
      ...shop,
      wa: shopForm.wa.replace(/\D/g, ''),
      instagram: shopForm.instagram.trim(),
      wholesaleIg: shopForm.wholesaleIg.trim(),
      youtube: shopForm.youtube.trim(),
      branches
    };

    await saveShop(updatedShop);
    notify('Shop details saved and updated!');
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.note && p.note.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = filterCat === 'all' || p.cat === filterCat;

      const matchesSec = filterSection === 'all' ||
        Boolean(productFeaturedMap[p.id]?.has(filterSection));

      return matchesSearch && matchesCat && matchesSec;
    });
  }, [products, searchTerm, filterCat, filterSection, productFeaturedMap]);

  // Current active section
  const currentSection = featuredSections.find(s => s.id === activeSectionId) || featuredSections[0];
  const productsInSection = useMemo(() => {
    if (!currentSection) return [];
    return products.filter(p => productFeaturedMap[p.id]?.has(currentSection.id));
  }, [products, currentSection, productFeaturedMap]);

  const productsNotInSection = useMemo(() => {
    if (!currentSection) return [];
    return products.filter(p => !productFeaturedMap[p.id]?.has(currentSection.id));
  }, [products, currentSection, productFeaturedMap]);

  return (
    <>
      {/* Top Sticky Red App Bar (Landing-page style) */}
      <header className="adm-head">
        <div className="wrap adm-bar">
          <div className="adm-brand-group">
            <Link to="/" className="logo">
              National<b>Trader</b>
            </Link>
            <span className="tag" style={{ fontSize: '.75rem', padding: '0 .4rem', background: 'var(--tag)', color: 'var(--ink)' }}>
              Admin
            </span>
            <span
              className={`sync-pill ${isSupabaseLive ? 'live' : 'offline'}`}
              style={{ fontSize: '.72rem', padding: '.15rem .5rem', marginLeft: '.3rem' }}
              title={isSupabaseLive ? 'Connected to live Supabase DB & Storage' : 'Operating in local cache mode'}
            >
              ● {isSupabaseLive ? 'Live' : 'Cache'}
            </span>
          </div>

          {/* Top Navbar Tabs in exact requested order */}
          <nav className="adm-nav-links">
            {[
              ['overview', '📊 Dashboard'],
              ['products', `📦 All Products (${products.length})`],
              ['featured', `🌟 Featured Sections (${featuredSections.length})`],
              ['settings', '⚙️ Settings']
            ].map(([tabKey, tabLabel]) => (
              <button
                key={tabKey}
                type="button"
                className={`adm-nav-btn ${activeTab === tabKey ? 'active' : ''}`}
                onClick={() => setActiveTab(tabKey)}
              >
                {tabLabel}
              </button>
            ))}
          </nav>

          <div className="adm-head-actions">
            <Link
              to="/"
              className="btn"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '.85rem', padding: '.4rem .75rem' }}
            >
              🌐 Store ↗
            </Link>
            <button
              type="button"
              className="btn"
              style={{ background: 'var(--tag)', color: 'var(--ink)', fontSize: '.85rem', fontWeight: 800, padding: '.4rem .75rem' }}
              onClick={onLogout}
            >
              🚪 Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Page Container */}
      <main className="adm" style={{ maxWidth: '1140px', padding: '1.5rem 1rem 4rem' }}>
        {feedback.text && (
          <p role="status" className={feedback.type === 'err' ? 'err' : 'ok'} style={{ animation: 'drop .25s ease', margin: '0 0 1.2rem' }}>
            {feedback.text}
          </p>
        )}

        {/* TAB 1: DASHBOARD OVERVIEW (Default Landing Tab) */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '2rem', margin: '0 0 .3rem' }}>Dashboard Overview</h1>
              <p className="small">Welcome back to Jafar Bhai's National Trader management center.</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card tag-bg">
                <span className="num">{products.length}</span>
                <span className="lbl">Total Catalog Products</span>
              </div>
              <div className="stat-card">
                <span className="num">{featuredSections.length}</span>
                <span className="lbl">Active Featured Sections</span>
              </div>
              <div className="stat-card">
                <span className="num">{categories.length}</span>
                <span className="lbl">Categories</span>
              </div>
              <div className="stat-card">
                <span className="num" style={{ fontSize: '1.35rem' }}>{isSupabaseLive ? 'Connected' : 'Offline Cache'}</span>
                <span className="lbl">Storage: nt_products</span>
              </div>
            </div>

            <h2>Quick Shortcuts</h2>
            <div className="quick-actions">
              <button className="quick-btn primary" onClick={openCreateModal}>
                ➕ Add New Product
              </button>
              <button className="quick-btn" onClick={() => setActiveTab('products')}>
                📦 Browse All Products
              </button>
              <button className="quick-btn" onClick={() => setActiveTab('featured')}>
                🌟 Manage Featured Sections
              </button>
              <button className="quick-btn" onClick={() => setActiveTab('settings')}>
                ⚙️ Shop Details & Categories
              </button>
            </div>

            <h2 style={{ marginTop: '2.5rem' }}>Featured Sections Quick Status</h2>
            <div className="fs-container">
              {featuredSections.map(sec => {
                const count = products.filter(p => productFeaturedMap[p.id]?.has(sec.id)).length;
                return (
                  <div key={sec.id} className="fs-card">
                    <div className="fs-card-h">
                      <div>
                        <h3 style={{ margin: 0 }}>{sec.title}</h3>
                        <p className="small" style={{ margin: '.2rem 0 0' }}>{sec.description}</p>
                      </div>
                      <span className="fs-badge">{count} Products</span>
                    </div>
                    <button
                      className="btn"
                      style={{ background: 'var(--steel)', color: 'var(--ink)', fontSize: '.9rem' }}
                      onClick={() => {
                        setActiveSectionId(sec.id);
                        setActiveTab('featured');
                      }}
                    >
                      Manage Assigned Products →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CENTRALIZED ALL PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div>
            {/* Action Toolbar */}
            <div className="tbl-toolbar" style={{ background: '#fafafa', border: '2px solid var(--ink)', borderRadius: '12px', padding: '1rem', marginBottom: '1.2rem' }}>
              <div className="tbl-filters" style={{ width: '100%', gap: '.6rem' }}>
                <input
                  type="search"
                  style={{ flex: 1, minWidth: '200px' }}
                  placeholder="🔍 Search product name, note, or tag..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ flex: '0 1 180px' }}>
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.e} {c.label}</option>
                  ))}
                </select>
                <select value={filterSection} onChange={e => setFilterSection(e.target.value)} style={{ flex: '0 1 180px' }}>
                  <option value="all">All Featured Sections</option>
                  {featuredSections.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '.4rem', marginLeft: 'auto' }}>
                  <button
                    type="button"
                    className="btn"
                    title="Toggle Mobile Cards / Desktop Table View"
                    style={{ background: 'var(--steel)', color: 'var(--ink)', padding: '.45rem .8rem', fontSize: '.9rem' }}
                    onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                  >
                    {viewMode === 'cards' ? '📋 Table View' : '🗂️ Card View'}
                  </button>
                  <button
                    className="btn wa"
                    onClick={openCreateModal}
                    style={{ fontWeight: 800, padding: '.45rem 1.1rem', fontSize: '.95rem' }}
                  >
                    ➕ Add Product
                  </button>
                </div>
              </div>
            </div>

            {/* VIEW MODE: CARDS (Mobile-friendly) */}
            {viewMode === 'cards' ? (
              <div className="adm-card-grid">
                {filteredProducts.length === 0 ? (
                  <div className="box" style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                    <p className="lead">No products found matching your filters.</p>
                    <button className="btn wa" onClick={openCreateModal} style={{ marginTop: '.8rem' }}>
                      ➕ Add First Product
                    </button>
                  </div>
                ) : (
                  filteredProducts.map(p => {
                    const assignedSet = productFeaturedMap[p.id] || new Set();
                    const catObj = categories.find(c => c.id === p.cat);
                    const hasUpload = Boolean(p.img);
                    const hasFallback = Boolean(p.fallback_url || p.fallbackUrl);

                    return (
                      <article key={p.id} className="adm-prod-card">
                        <div className="adm-prod-card-top">
                          <div className="adm-prod-card-thumb">
                            {p.img ? (
                              <img src={p.img} alt={p.name} loading="lazy" onError={e => { e.target.style.display = 'none'; }} />
                            ) : p.fallback_url ? (
                              <img src={p.fallback_url} alt={p.name} loading="lazy" onError={e => { e.target.style.display = 'none'; }} />
                            ) : (
                              <span>{p.e || '🛍️'}</span>
                            )}
                          </div>
                          <div className="adm-prod-card-info">
                            <h3 className="adm-prod-card-title">{p.name}</h3>
                            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span className="adm-prod-card-cat">{catObj ? `${catObj.e} ${catObj.label}` : p.cat}</span>
                              <span className="adm-prod-card-price">{priceText(p)}</span>
                            </div>
                            {p.note && <small style={{ color: '#555', display: 'block', marginTop: '.2rem' }}>{p.note}</small>}
                            <div style={{ display: 'flex', gap: '.3rem', marginTop: '.3rem' }}>
                              {hasUpload && <span className="img-tag storage">📁 Uploaded</span>}
                              {hasFallback && <span className="img-tag url">🔗 Fallback URL</span>}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Section Assignment Pills */}
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '.5rem' }}>
                          <small style={{ fontWeight: 700, color: '#555', display: 'block', marginBottom: '.3rem' }}>
                            Featured In Sections (Tap to toggle):
                          </small>
                          <div className="adm-prod-sec-pills">
                            {featuredSections.map(sec => {
                              const isChecked = assignedSet.has(sec.id);
                              return (
                                <button
                                  key={sec.id}
                                  type="button"
                                  className={`sec-pill-btn ${isChecked ? 'active' : ''}`}
                                  onClick={() => handleSectionCheckboxToggle(p.id, sec.id, !isChecked)}
                                >
                                  {isChecked ? '✓' : '+'} {sec.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="adm-card-footer">
                          <button
                            type="button"
                            className="btn"
                            style={{ background: 'var(--steel)', color: 'var(--ink)', padding: '.35rem .75rem', fontSize: '.85rem' }}
                            onClick={() => openEditModal(p)}
                          >
                            ✏️ Edit Details
                          </button>
                          <button
                            type="button"
                            className="btn red"
                            style={{ padding: '.35rem .75rem', fontSize: '.85rem' }}
                            onClick={() => handleDeleteProduct(p)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            ) : (
              /* VIEW MODE: TABLE (Desktop View) */
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Product</th>
                      <th style={{ width: '15%' }}>Price</th>
                      <th style={{ width: '30%' }}>Featured Sections</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem' }}>
                          No products match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(p => {
                        const assignedSet = productFeaturedMap[p.id] || new Set();
                        const catObj = categories.find(c => c.id === p.cat);
                        return (
                          <tr key={p.id}>
                            <td>
                              <div className="prod-meta">
                                <div className="tbl-thumb">
                                  {p.img ? (
                                    <img src={p.img} alt={p.name} loading="lazy" onError={e => { e.target.style.display = 'none'; }} />
                                  ) : p.fallback_url ? (
                                    <img src={p.fallback_url} alt={p.name} loading="lazy" onError={e => { e.target.style.display = 'none'; }} />
                                  ) : (
                                    <span>{p.e || '🛍️'}</span>
                                  )}
                                </div>
                                <div className="prod-info-block">
                                  <strong>{p.name}</strong>
                                  <small>
                                    <span style={{ fontWeight: 600 }}>{catObj ? `${catObj.e} ${catObj.label}` : p.cat}</span>
                                    {p.note && ` · ${p.note}`}
                                  </small>
                                  <div style={{ display: 'flex', gap: '.3rem', marginTop: '.2rem' }}>
                                    {p.img && <span className="img-tag storage" style={{ fontSize: '.68rem' }}>📁 Upload</span>}
                                    {p.fallback_url && <span className="img-tag url" style={{ fontSize: '.68rem' }}>🔗 Fallback URL</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="tbl-price">{priceText(p)}</span>
                            </td>
                            <td>
                              <div className="tbl-sections">
                                {featuredSections.map(sec => {
                                  const isChecked = assignedSet.has(sec.id);
                                  return (
                                    <label key={sec.id} className="sec-chk">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={e => handleSectionCheckboxToggle(p.id, sec.id, e.target.checked)}
                                      />
                                      <span>{sec.title}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="tbl-actions" style={{ justifyContent: 'flex-end' }}>
                                <button onClick={() => openEditModal(p)}>
                                  ✏️ Edit
                                </button>
                                <button className="del" onClick={() => handleDeleteProduct(p)}>
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FEATURED SECTIONS */}
        {activeTab === 'featured' && (
          <div>
            <div className="chips" style={{ marginBottom: '1.2rem' }}>
              {featuredSections.map(sec => (
                <button
                  key={sec.id}
                  className={activeSectionId === sec.id ? 'on' : ''}
                  onClick={() => setActiveSectionId(sec.id)}
                >
                  {sec.title} ({products.filter(p => productFeaturedMap[p.id]?.has(sec.id)).length})
                </button>
              ))}
            </div>

            {currentSection && (
              <div className="fs-card">
                <div className="fs-card-h">
                  <div>
                    <h3 style={{ margin: 0 }}>{currentSection.title}</h3>
                    <p className="small" style={{ margin: '.3rem 0 0' }}>{currentSection.description}</p>
                  </div>
                  <span className="fs-badge">{productsInSection.length} Assigned Products</span>
                </div>

                {/* Add Product to this section */}
                <div className="fs-add-row box" style={{ background: '#fafafa', marginTop: '1rem', borderRadius: '10px' }}>
                  <span style={{ fontWeight: 700 }}>Add a product to this section:</span>
                  <select
                    style={{ flex: 1, minWidth: '220px' }}
                    value={productToAdd}
                    onChange={e => setProductToAdd(e.target.value)}
                  >
                    <option value="">-- Choose a product to add --</option>
                    {productsNotInSection.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({priceText(p)})
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn wa"
                    disabled={!productToAdd}
                    onClick={async () => {
                      if (!productToAdd) return;
                      await toggleSection(productToAdd, currentSection.id, true);
                      setProductToAdd('');
                      notify(`Added to ${currentSection.title}`);
                    }}
                  >
                    ➕ Add to Section
                  </button>
                </div>

                {/* Assigned Products List */}
                <h4 style={{ margin: '1.5rem 0 .6rem' }}>Assigned Products in this Section:</h4>
                {productsInSection.length === 0 ? (
                  <p className="small">No products assigned yet. Use the selector above or the checkbox pills in the All Products tab.</p>
                ) : (
                  <div className="fs-products">
                    {productsInSection.map(p => (
                      <div key={p.id} className="fs-item">
                        <div className="tbl-thumb" style={{ width: '42px', height: '42px' }}>
                          {p.img ? <img src={p.img} alt={p.name} /> : <span>{p.e}</span>}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, fontSize: '.9rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <small>{priceText(p)}</small>
                        </div>
                        <button
                          className="rem-btn"
                          title="Remove from this section"
                          onClick={async () => {
                            await toggleSection(p.id, currentSection.id, false);
                            notify(`Removed from ${currentSection.title}`);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* Shop Details */}
            <form className="form box" onSubmit={handleSaveShop}>
              <h2>Shop Contact & Social Media</h2>
              <label>
                WhatsApp Number (with country code, e.g. 919156924664)
                <input
                  value={shopForm.wa}
                  onChange={e => setShopForm({ ...shopForm, wa: e.target.value })}
                />
              </label>
              <label>
                Shop Branches (One per line: Branch Name | Phone)
                <textarea
                  rows="4"
                  value={shopForm.branchesText}
                  onChange={e => setShopForm({ ...shopForm, branchesText: e.target.value })}
                />
              </label>
              <label>
                Instagram URL
                <input
                  value={shopForm.instagram}
                  onChange={e => setShopForm({ ...shopForm, instagram: e.target.value })}
                />
              </label>
              <label>
                Wholesale Instagram URL
                <input
                  value={shopForm.wholesaleIg}
                  onChange={e => setShopForm({ ...shopForm, wholesaleIg: e.target.value })}
                />
              </label>
              <label>
                YouTube Channel URL
                <input
                  value={shopForm.youtube}
                  onChange={e => setShopForm({ ...shopForm, youtube: e.target.value })}
                />
              </label>
              <button className="btn wa" type="submit">
                Save Shop Details
              </button>
            </form>

            {/* Categories */}
            <div className="box">
              <h2>Categories Management</h2>
              <div className="alist">
                {categories.map(c => (
                  <div key={c.id} className="arow col" style={{ marginBottom: '.8rem' }}>
                    <div className="inl">
                      <input
                        className="em"
                        aria-label="Category Emoji"
                        value={c.e}
                        onChange={e => saveCategories(categories.map(x => x.id === c.id ? { ...x, e: e.target.value } : x))}
                      />
                      <input
                        aria-label="Category Label"
                        value={c.label}
                        onChange={e => saveCategories(categories.map(x => x.id === c.id ? { ...x, label: e.target.value } : x))}
                      />
                    </div>
                    <input
                      aria-label="Description"
                      placeholder="Short description"
                      value={c.blurb || ''}
                      onChange={e => saveCategories(categories.map(x => x.id === c.id ? { ...x, blurb: e.target.value } : x))}
                    />
                    <div className="inl">
                      <label className="chk">
                        <input
                          type="checkbox"
                          checked={!!c.home}
                          onChange={e => saveCategories(categories.map(x => x.id === c.id ? { ...x, home: e.target.checked } : x))}
                        />
                        Show carousel on homepage
                      </label>
                      <button
                        className="del"
                        onClick={() => {
                          const inUse = products.some(p => p.cat === c.id);
                          if (inUse) {
                            notify('Move or delete this category’s products first.', 'err');
                          } else if (window.confirm(`Delete category "${c.label}"?`)) {
                            deleteCategory(c.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="btn"
                style={{ background: 'var(--steel)', color: 'var(--ink)', marginTop: '1rem' }}
                onClick={() => {
                  const newCat = {
                    id: `cat_${Date.now()}`,
                    label: 'New Category',
                    e: '🛍️',
                    blurb: '',
                    home: false
                  };
                  saveCategories([...categories, newCat]);
                }}
              >
                ➕ Add Category
              </button>
            </div>

            {/* Backup */}
            <div className="box">
              <h2>Data Backup & Recovery</h2>
              <p className="small">Export a full JSON backup of the catalog or restore from a previous backup file.</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button
                  className="btn wa"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify({ shop, categories, products }, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `national_trader_catalog_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                  }}
                >
                  📥 Export JSON Catalog
                </button>
                <button
                  className="btn red"
                  onClick={() => {
                    if (window.confirm('Reset local catalog cache to default factory catalog?')) {
                      reset();
                      notify('Reset catalog to default.');
                    }
                  }}
                >
                  Reset to Factory Catalog
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT PRODUCT MODAL (EMOJI FALLBACK FIELD COMPLETELY REMOVED) */}
        {modalOpen && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
            <div className="modal-box">
              <div className="modal-h">
                <h2>{formProduct.id ? `Edit: ${formProduct.name}` : '➕ Add New Product'}</h2>
                <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
              </div>

              <form onSubmit={handleProductSubmit} className="form" style={{ margin: 0 }}>
                {/* Fieldset 1: Basic Information */}
                <fieldset className="form-fieldset">
                  <legend>1. Product Details</legend>
                  <label>
                    Product Name *
                    <input
                      required
                      placeholder="e.g. Stainless Steel Heavy Tiffin Dabba"
                      value={formProduct.name}
                      onChange={e => setFormProduct({ ...formProduct, name: e.target.value })}
                    />
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem', marginTop: '.6rem' }}>
                    <label>
                      Category *
                      <select
                        required
                        value={formProduct.cat}
                        onChange={e => setFormProduct({ ...formProduct, cat: e.target.value })}
                      >
                        <option value="">Select category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.e} {c.label}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Price in ₹ (leave blank for “Ask price”)
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 99"
                        value={formProduct.price ?? ''}
                        onChange={e => setFormProduct({ ...formProduct, price: e.target.value })}
                      />
                    </label>
                  </div>

                  <label style={{ marginTop: '.6rem' }}>
                    Short Note / Specifications
                    <input
                      placeholder="e.g. 3-tier airtight, heavy gauge food grade"
                      value={formProduct.note}
                      onChange={e => setFormProduct({ ...formProduct, note: e.target.value })}
                    />
                  </label>
                </fieldset>

                {/* Fieldset 2: Images (Primary Upload + Fallback URL - Emoji field removed) */}
                <fieldset className="form-fieldset">
                  <legend>2. Product Images</legend>
                  <p className="small" style={{ margin: '0 0 .8rem', color: '#555' }}>
                    Upload the main product image. Optionally add a fallback image URL in case the uploaded image is slow or fails to load.
                  </p>

                  {/* Primary Image Upload */}
                  <label>
                    <strong>Primary Image (Upload File)</strong>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageFileChange}
                      style={{ marginTop: '.3rem' }}
                    />
                    {uploadingImage && <small style={{ color: 'var(--red)' }}>⏳ Compressing and uploading to Supabase Storage...</small>}
                  </label>

                  {formProduct.img && (
                    <div className="img-preview-box">
                      <img src={formProduct.img} alt="Primary Preview" />
                      <div>
                        <span className="img-tag storage">✓ Primary Active Image</span>
                        <small style={{ display: 'block', color: '#666', marginTop: '.2rem' }}>
                          {formProduct.image_path ? `Object: ${formProduct.image_path}` : 'Ready for saving'}
                        </small>
                        <button
                          type="button"
                          style={{ color: 'var(--red)', background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: '.8rem', marginTop: '.3rem' }}
                          onClick={() => setFormProduct({ ...formProduct, img: '', image_path: '' })}
                        >
                          ✕ Remove Primary Image
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Fallback Image URL */}
                  <label style={{ marginTop: '1rem' }}>
                    <strong>Fallback Image URL (Backup URL)</strong>
                    <input
                      placeholder="https://example.com/fallback-image.jpg"
                      value={formProduct.fallback_url || ''}
                      onChange={e => setFormProduct({ ...formProduct, fallback_url: e.target.value })}
                      style={{ marginTop: '.3rem' }}
                    />
                    <small style={{ color: '#666' }}>External link displayed if the primary image cannot load.</small>
                  </label>

                  {formProduct.fallback_url && (
                    <div className="img-preview-box" style={{ background: '#f8fafc' }}>
                      <img
                        src={formProduct.fallback_url}
                        alt="Fallback Preview"
                        onError={e => { e.target.style.opacity = '0.3'; }}
                      />
                      <div>
                        <span className="img-tag url">🔗 Fallback URL Image</span>
                        <small style={{ display: 'block', color: '#666', marginTop: '.2rem' }}>
                          Displays automatically if primary image is unavailable.
                        </small>
                        <button
                          type="button"
                          style={{ color: 'var(--red)', background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: '.8rem', marginTop: '.3rem' }}
                          onClick={() => setFormProduct({ ...formProduct, fallback_url: '' })}
                        >
                          ✕ Clear Fallback URL
                        </button>
                      </div>
                    </div>
                  )}

                  <label style={{ marginTop: '1rem' }}>
                    Search Keyword (Auto-lookup keyword)
                    <input
                      placeholder="e.g. stainless steel container"
                      value={formProduct.q}
                      onChange={e => setFormProduct({ ...formProduct, q: e.target.value })}
                    />
                  </label>
                </fieldset>

                {/* Fieldset 3: Featured Sections */}
                <fieldset className="form-fieldset">
                  <legend>3. Featured Sections</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '.5rem' }}>
                    {featuredSections.map(sec => {
                      const isChecked = formSections.includes(sec.id);
                      return (
                        <label key={sec.id} className="sec-chk" style={{ background: '#fff', border: '1px solid #ddd', padding: '.4rem .6rem', borderRadius: '6px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setFormSections([...formSections, sec.id]);
                              } else {
                                setFormSections(formSections.filter(x => x !== sec.id));
                              }
                            }}
                          />
                          <span style={{ fontWeight: 600 }}>{sec.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="cta" style={{ marginTop: '1.2rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: 'var(--steel)', color: 'var(--ink)' }}
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn wa" disabled={uploadingImage} style={{ fontWeight: 800 }}>
                    {formProduct.id ? '💾 Save Changes' : '➕ Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
