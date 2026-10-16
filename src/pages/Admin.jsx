import { useState, useEffect, useMemo, useRef } from 'react';
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

  if (!isAuthenticated) {
    return (
      <section className="adm narrow">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '3rem' }}>🔐</span>
          <h1>Admin Portal</h1>
          <p className="lead" style={{ margin: '0 auto' }}>National Trader Management Dashboard</p>
        </div>

        <form className="form box" onSubmit={handleLogin}>
          <h2>Sign in</h2>
          <label>
            Username
            <input
              required
              autoFocus
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              autoComplete="username"
              placeholder="Admin username"
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
          <button className="btn red" type="submit" disabled={loginLoading}>
            {loginLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
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

  const [activeTab, setActiveTab] = useState('overview'); // overview | products | featured | settings
  const [feedback, setFeedback] = useState({ text: '', type: 'ok' });
  const [modalOpen, setModalOpen] = useState(false);
  const [formProduct, setFormProduct] = useState(BLANK_PRODUCT);
  const [formSections, setFormSections] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imgInputMode, setImgInputMode] = useState('upload'); // upload | url

  // Filter & search states for products tab
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

  // Open Create Product
  const openCreateModal = () => {
    setFormProduct(BLANK_PRODUCT);
    setFormSections([]);
    setImgInputMode('upload');
    setModalOpen(true);
  };

  // Open Edit Product
  const openEditModal = p => {
    setFormProduct({
      ...BLANK_PRODUCT,
      ...p,
      price: p.price ?? ''
    });
    const assignedSecs = Array.from(productFeaturedMap[p.id] || []);
    setFormSections(assignedSecs);
    setImgInputMode(p.img && !p.image_path ? 'url' : 'upload');
    setModalOpen(true);
  };

  // Handle image file selection with upload to Supabase Storage
  const handleImageFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const resizedBase64 = await resizeImage(file);
      // Attempt upload to Supabase Storage
      try {
        const uploadRes = await uploadProductImage(resizedBase64, file.name);
        if (uploadRes && uploadRes.url) {
          setFormProduct(prev => ({
            ...prev,
            img: uploadRes.url,
            image_path: uploadRes.path
          }));
          notify('Image uploaded to Supabase Storage!');
        } else {
          // Fallback to data url if API returned no URL
          setFormProduct(prev => ({ ...prev, img: resizedBase64, image_path: '' }));
          notify('Saved image locally.');
        }
      } catch (uploadErr) {
        // Fallback gracefully
        console.warn('Storage upload notice:', uploadErr.message);
        setFormProduct(prev => ({ ...prev, img: resizedBase64, image_path: '' }));
        notify('Image stored locally (Storage fallback).');
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
      price: formProduct.price !== '' && !isNaN(Number(formProduct.price)) ? Number(formProduct.price) : null
    };

    const oldProduct = products.find(x => x.id === productId);
    const oldImagePath = oldProduct?.image_path;

    await saveProduct(cleanProduct, formSections, oldImagePath);
    setModalOpen(false);
    notify(isEdit ? `Updated "${cleanProduct.name}" successfully!` : `Created product "${cleanProduct.name}"!`);
  };

  // Handle Product Deletion
  const handleDeleteProduct = async p => {
    if (window.confirm(`Delete "${p.name}"?\n\nThis will remove the product, all its featured section associations, and any uploaded image.`)) {
      await deleteProduct(p.id, p.image_path);
      notify(`Deleted "${p.name}".`);
    }
  };

  // Quick toggle featured section checkbox from the table
  const handleSectionCheckboxToggle = async (productId, sectionId, checked) => {
    await toggleSection(productId, sectionId, checked);
    const sec = featuredSections.find(s => s.id === sectionId);
    notify(`${checked ? 'Added to' : 'Removed from'} ${sec?.title || sectionId}`);
  };

  // Save Shop Details
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

  // Filtered Products for the table
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

  // Current active section object
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
    <section className="adm" style={{ maxWidth: '1100px' }}>
      {/* Top Header */}
      <div className="adm-header">
        <div className="adm-title-wrap">
          <h1>Admin Portal</h1>
          <span className={`sync-pill ${isSupabaseLive ? 'live' : 'offline'}`} title={isSupabaseLive ? 'Connected to live Supabase DB & Storage' : 'Using local catalog storage'}>
            <span style={{ fontSize: '.8rem' }}>{isSupabaseLive ? '●' : '○'}</span>
            {isSupabaseLive ? 'Supabase Live' : 'Local Fallback'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button className="btn" style={{ background: 'var(--steel)', color: 'var(--ink)' }} onClick={() => refresh()}>
            ↻ Refresh
          </button>
          <button className="btn red" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </div>

      {feedback.text && (
        <p role="status" className={feedback.type === 'err' ? 'err' : 'ok'} style={{ animation: 'drop .3s ease' }}>
          {feedback.text}
        </p>
      )}

      {/* Multi-Tab Navigation */}
      <div className="adm-nav">
        {[
          ['overview', '📊 Dashboard'],
          ['products', `📦 All Products (${products.length})`],
          ['featured', `🌟 Featured Sections (${featuredSections.length})`],
          ['settings', '⚙️ Settings']
        ].map(([tabKey, tabLabel]) => (
          <button
            key={tabKey}
            className={`adm-tab-btn ${activeTab === tabKey ? 'active' : ''}`}
            onClick={() => setActiveTab(tabKey)}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW / DASHBOARD */}
      {activeTab === 'overview' && (
        <div>
          <div className="stats-grid">
            <div className="stat-card tag-bg">
              <span className="num">{products.length}</span>
              <span className="lbl">Total Products</span>
            </div>
            <div className="stat-card">
              <span className="num">{featuredSections.length}</span>
              <span className="lbl">Featured Sections</span>
            </div>
            <div className="stat-card">
              <span className="num">{categories.length}</span>
              <span className="lbl">Categories</span>
            </div>
            <div className="stat-card">
              <span className="num" style={{ fontSize: '1.4rem' }}>{isSupabaseLive ? 'Connected' : 'Ready'}</span>
              <span className="lbl">Supabase Storage: nt_products</span>
            </div>
          </div>

          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="quick-btn primary" onClick={openCreateModal}>
              + Add New Product
            </button>
            <button className="quick-btn" onClick={() => setActiveTab('products')}>
              Browse All Products
            </button>
            <button className="quick-btn" onClick={() => setActiveTab('featured')}>
              Manage Featured Sections
            </button>
            <button className="quick-btn" onClick={() => setActiveTab('settings')}>
              Edit Shop Details & Categories
            </button>
          </div>

          <h2 style={{ marginTop: '2rem' }}>Featured Sections Overview</h2>
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

      {/* TAB 2: CENTRALIZED PRODUCT MANAGEMENT */}
      {activeTab === 'products' && (
        <div>
          <div className="tbl-toolbar">
            <div className="tbl-filters">
              <input
                type="search"
                placeholder="Search products by name or note..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.e} {c.label}</option>
                ))}
              </select>
              <select value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                <option value="all">All Sections</option>
                {featuredSections.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <button className="btn wa" onClick={openCreateModal}>
              + Create Product
            </button>
          </div>

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
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
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
                              Edit
                            </button>
                            <button className="del" onClick={() => handleDeleteProduct(p)}>
                              Delete
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
        </div>
      )}

      {/* TAB 3: FEATURED SECTIONS DEDICATED VIEW */}
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
              <div className="fs-add-row box" style={{ background: '#fafafa', marginTop: '1rem' }}>
                <span style={{ fontWeight: 600 }}>Add a product to this section:</span>
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
                  + Add to Section
                </button>
              </div>

              {/* Assigned Products List */}
              <h4 style={{ margin: '1.5rem 0 .6rem' }}>Assigned Products:</h4>
              {productsInSection.length === 0 ? (
                <p className="small">No products assigned to this section yet. Use the dropdown above or check the boxes in the All Products tab.</p>
              ) : (
                <div className="fs-products">
                  {productsInSection.map(p => (
                    <div key={p.id} className="fs-item">
                      <div className="tbl-thumb" style={{ width: '40px', height: '40px' }}>
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

      {/* TAB 4: SETTINGS */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Shop Details Form */}
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

          {/* Categories Management */}
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
              + Add Category
            </button>
          </div>

          {/* Backup & Disaster Recovery */}
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
                Export JSON Catalog
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal-box">
            <div className="modal-h">
              <h2>{formProduct.id ? `Edit: ${formProduct.name}` : 'Create New Product'}</h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleProductSubmit} className="form" style={{ margin: 0 }}>
              <label>
                Product Name *
                <input
                  required
                  placeholder="e.g. Stainless Steel Lunch Dabba"
                  value={formProduct.name}
                  onChange={e => setFormProduct({ ...formProduct, name: e.target.value })}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                    placeholder="e.g. 150"
                    value={formProduct.price ?? ''}
                    onChange={e => setFormProduct({ ...formProduct, price: e.target.value })}
                  />
                </label>
              </div>

              <label>
                Short Note
                <input
                  placeholder="e.g. 3-tier airtight, heavy gauge"
                  value={formProduct.note}
                  onChange={e => setFormProduct({ ...formProduct, note: e.target.value })}
                />
              </label>

              {/* Image Input Selection */}
              <div>
                <label style={{ marginBottom: '.3rem' }}>Product Image</label>
                <div className="img-modes">
                  <button
                    type="button"
                    className={imgInputMode === 'upload' ? 'active' : ''}
                    onClick={() => setImgInputMode('upload')}
                  >
                    📁 Upload to Supabase
                  </button>
                  <button
                    type="button"
                    className={imgInputMode === 'url' ? 'active' : ''}
                    onClick={() => setImgInputMode('url')}
                  >
                    🔗 External Image URL
                  </button>
                </div>

                {imgInputMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageFileChange}
                    />
                    {uploadingImage && <small style={{ color: 'var(--red)' }}>Optimizing & uploading image to Supabase...</small>}
                  </div>
                ) : (
                  <input
                    placeholder="https://example.com/product.jpg"
                    value={formProduct.img && !formProduct.img.startsWith('data:') ? formProduct.img : ''}
                    onChange={e => setFormProduct({ ...formProduct, img: e.target.value, image_path: '' })}
                  />
                )}

                {/* Image Preview & Badges */}
                {formProduct.img && (
                  <div className="img-preview-box">
                    <img src={formProduct.img} alt="Product Preview" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                      <span className={`img-tag ${formProduct.image_path ? 'storage' : 'url'}`}>
                        {formProduct.image_path ? '✓ Supabase Storage Object' : '🔗 Hosted Image URL'}
                      </span>
                      <button
                        type="button"
                        style={{ fontSize: '.8rem', color: 'var(--red)', background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}
                        onClick={() => setFormProduct({ ...formProduct, img: '', image_path: '' })}
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <label>
                  Auto-Image search keyword (fallback)
                  <input
                    placeholder="e.g. pressure cooker"
                    value={formProduct.q}
                    onChange={e => setFormProduct({ ...formProduct, q: e.target.value })}
                  />
                </label>
                <label>
                  Fallback Emoji
                  <input
                    value={formProduct.e}
                    onChange={e => setFormProduct({ ...formProduct, e: e.target.value })}
                  />
                </label>
              </div>

              {/* Featured Sections Selection */}
              <div>
                <label style={{ marginBottom: '.4rem' }}>Featured Sections</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.4rem' }}>
                  {featuredSections.map(sec => {
                    const isChecked = formSections.includes(sec.id);
                    return (
                      <label key={sec.id} className="sec-chk">
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
                        <span>{sec.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="cta" style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'var(--steel)', color: 'var(--ink)' }}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn wa" disabled={uploadingImage}>
                  {formProduct.id ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
