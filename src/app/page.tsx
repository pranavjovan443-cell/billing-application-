'use client';

import React, { useState, useEffect } from 'react';
import { usePOSStore, Dish } from '@/store/usePOSStore';
import { SAMPLE_MENU } from '@/constants/sampleData';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Utensils, 
  ChevronRight,
  Printer,
  X,
  Settings,
  LayoutDashboard,
  BarChart3,
  Package,
  PlusCircle,
  Menu as MenuIcon,
  Home,
  Star,
  Zap,
  Music,
  Radio,
  Rss,
  Play,
  Heart,
  Share2,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'All',
  'South Indian',
  'North Indian',
  'Chinese',
  'Tandoor',
  'Beverages',
  'Desserts'
];

export default function GourmetPOS() {
  const { 
    menu, cart, sales, likedIds, history,
    addToCart, removeFromCart, updateQuantity, toggleLike, clearCart, 
    addDish, removeDish, updateDish, checkout, setMenu 
  } = usePOSStore();
  
  const [view, setView] = useState<'pos' | 'admin' | 'dashboard' | 'premium' | 'specials' | 'history' | 'liked' | 'tab'>('pos');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Robust hydration check
  useEffect(() => {
    const checkHydration = () => {
      // @ts-ignore - access internal zustand persist state
      const hydrated = usePOSStore.persist?.hasHydrated();
      if (hydrated) {
        setIsHydrated(true);
      } else {
        // Fallback for older versions or if hasHydrated isn't ready
        setTimeout(checkHydration, 50);
      }
    };
    checkHydration();
  }, []);

  useEffect(() => {
    // Only set sample menu if we are sure hydration finished AND menu is truly empty
    if (isHydrated && menu.length === 0) {
      setMenu(SAMPLE_MENU);
    }
  }, [isHydrated, menu.length]);

  // Reset scroll to top when view changes
  useEffect(() => {
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }, [view]);

  const filteredMenu = menu.filter(dish => {
    // Basic filters
    const matchesCategory = selectedCategory === 'All' || dish.category === selectedCategory;
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // View-specific filters
    if (view === 'premium') return matchesSearch && dish.price >= 200;
    if (view === 'specials') return matchesSearch && (dish.category === 'Tandoor' || dish.category === 'Desserts');
    if (view === 'liked') return matchesSearch && likedIds.includes(dish.id);
    
    return matchesCategory && matchesSearch;
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleCheckout = () => setIsBillOpen(true);
  const confirmCheckout = () => { checkout(); setIsBillOpen(false); };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish?.name || !editingDish?.price) return;
    
    // Clean up the image URL (trim whitespace)
    const imageUrl = editingDish.image?.trim();
    
    // Default high-quality placeholder if no image is provided
    const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
    const dishData = {
      ...editingDish,
      image: imageUrl || defaultImage,
      available: true
    };

    if (editingDish.id) {
      updateDish(dishData as Dish);
    } else {
      addDish({
        ...dishData,
        id: Math.random().toString(36).substr(2, 9),
      } as Dish);
    }
    setEditingDish(null);
  };

  return (
    <div className="flex h-screen bg-[#0d0d12] text-white font-sans selection:bg-red-500/30 overflow-hidden">
      
      {/* Sidebar Overlay - Mobile only */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Maximum Z-index to ensure it captures clicks */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#09090d] border-r border-white/5 flex flex-col py-8 z-[100] h-full transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-8 mb-10 flex items-center justify-between">
            <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-orange-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-white/30 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
        </div>

        <div className="px-6 mb-8 uppercase text-[10px] font-black text-white/30 tracking-[0.2em]">Browse Flavors</div>
        
        <nav className="flex flex-col space-y-1 px-2">
          <SidebarNavItem icon={<Home className="w-4 h-4" />} label="Home Feed" active={view === 'pos'} onClick={() => { setView('pos'); setIsSidebarOpen(false); }} />
          <SidebarNavItem icon={<Star className="w-4 h-4" />} label="Premium Picks" active={view === 'premium'} onClick={() => { setView('premium'); setIsSidebarOpen(false); }} />
          <SidebarNavItem icon={<Zap className="w-4 h-4" />} label="Daily Specials" active={view === 'specials'} onClick={() => { setView('specials'); setIsSidebarOpen(false); }} />
          <SidebarNavItem icon={<Heart className="w-4 h-4" />} label="Liked Dishes" active={view === 'liked'} onClick={() => { setView('liked'); setIsSidebarOpen(false); }} />
          <SidebarNavItem icon={<BarChart3 className="w-4 h-4" />} label="Sales Summary" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} />
          <SidebarNavItem icon={<Settings className="w-4 h-4" />} label="Admin Panel" active={view === 'admin'} onClick={() => { setView('admin'); setIsSidebarOpen(false); }} />
        </nav>

        <div className="mt-12 px-6 mb-4 uppercase text-[10px] font-black text-white/30 tracking-[0.2em]">Your Order List</div>
        <nav className="flex flex-col space-y-1 px-2 mb-auto">
          <SidebarNavItem icon={<Rss className="w-4 h-4" />} label="Current Tab" active={view === 'tab'} onClick={() => { setView('tab'); setIsSidebarOpen(false); }} />
          <SidebarNavItem icon={<Bookmark className="w-4 h-4" />} label="Order History" active={view === 'history'} onClick={() => { setView('history'); setIsSidebarOpen(false); }} />
        </nav>

        <div className="mt-auto px-6 py-4 mx-4 mb-4 glass-card bg-white/5 border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-0.5">
                <img src="https://ui-avatars.com/api/?name=Joe+Cooks&background=random" className="w-full h-full rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">Joe Cooks Admin</p>
                <p className="text-[10px] text-white/40">Waitstaff #AR1</p>
            </div>
            <Zap className="w-3 h-3 text-orange-400 fill-orange-400" />
        </div>
      </aside>

      {/* Main Content Area - Single scrollable plane */}
      <main className="flex-1 min-w-0 relative bg-gradient-to-b from-[#1a1b2e]/30 to-[#0d0d12] flex flex-col h-full">
        
        {/* Transparent Header */}
        <header className="h-20 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl bg-black/10 border-b border-white/5">
            <div className="flex gap-4 items-center">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center lg:hidden hover:bg-white/10 transition-colors border border-white/5"
                >
                    <MenuIcon className="w-5 h-5" />
                </button>
                <button className="hidden lg:flex w-8 h-8 rounded-full bg-white/5 items-center justify-center hover:bg-white/10 transition-colors border border-white/5">
                    <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div className="relative group w-48 lg:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                    <input 
                    type="text" 
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                    />
                </div>
            </div>
            <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/5">
                <button className="hidden sm:block px-6 py-1.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Play</button>
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"><Bookmark className="w-3.5 h-3.5" /></button>
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"><Share2 className="w-3.5 h-3.5" /></button>
            </div>
        </header>

        {/* Scrollable Content Zone */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar px-10 pt-8 pb-40">
            {view === 'pos' && (
            <>
                {/* Hero Section */}
                <section className="relative h-72 w-full rounded-[2.5rem] overflow-hidden mb-12 group cursor-pointer shadow-2xl border border-white/10">
                    <img 
                        src="https://images.unsplash.com/photo-1544333346-64663fcf0287?w=1600&q=80" 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>
                    <div className="absolute inset-y-0 left-0 p-12 flex flex-col justify-center max-w-lg">
                        <p className="text-red-500 font-black uppercase text-[10px] tracking-[0.3em] mb-4">Chef's recommendation</p>
                        <h2 className="text-5xl font-black mb-4 tracking-tighter">Classic Series <br/> <span className="text-white/40 italic">Butter Chicken</span></h2>
                        <div className="flex gap-4 mt-4">
                            <button onClick={() => addToCart(menu.find(d => d.name === 'Butter Chicken') || SAMPLE_MENU[3])} className="btn-vibrant btn-vibrant-primary text-[10px] uppercase tracking-widest px-10 py-3">Add to Order</button>
                        </div>
                    </div>
                </section>

                {/* Sub-Header / Categories */}
                <div className="flex items-center gap-10 mb-8 border-b border-white/5 bg-transparent">
                    {CATEGORIES.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`text-[11px] font-black uppercase tracking-widest pb-4 transition-all relative ${selectedCategory === cat ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                        >
                            {cat}
                            {selectedCategory === cat && <motion.div layoutId="cat-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444]" />}
                        </button>
                    ))}
                </div>

                {/* Main Grid */}
                <h3 className="text-lg font-bold mb-8 uppercase italic tracking-tighter text-white/60">Popular near you</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredMenu.map(dish => <DishCard key={dish.id} dish={dish} addToCart={addToCart} toggleLike={toggleLike} isLiked={likedIds.includes(dish.id)} />)}
                </div>
            </>
            )}

            {view === 'premium' && (
                <div className="animate-in">
                    <header className="mb-12">
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Premium <span className="text-yellow-500">Picks</span></h2>
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Elite Culinary Collection</p>
                    </header>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredMenu.map(dish => <DishCard key={dish.id} dish={dish} addToCart={addToCart} toggleLike={toggleLike} isLiked={likedIds.includes(dish.id)} />)}
                    </div>
                </div>
            )}

            {view === 'specials' && (
                <div className="animate-in">
                    <header className="mb-12">
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Daily <span className="text-orange-500">Specials</span></h2>
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Today's Fresh Curation</p>
                    </header>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredMenu.map(dish => <DishCard key={dish.id} dish={dish} addToCart={addToCart} toggleLike={toggleLike} isLiked={likedIds.includes(dish.id)} />)}
                    </div>
                </div>
            )}

            {view === 'liked' && (
                <div className="animate-in">
                    <header className="mb-12">
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Liked <span className="text-red-500">Dishes</span></h2>
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Your Personal Favorites</p>
                    </header>
                    {filteredMenu.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredMenu.map(dish => <DishCard key={dish.id} dish={dish} addToCart={addToCart} toggleLike={toggleLike} isLiked={likedIds.includes(dish.id)} />)}
                        </div>
                    ) : (
                        <div className="py-20 text-center glass-card bg-white/5 border-dashed border-white/10 max-w-2xl mx-auto">
                            <Heart className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p className="text-white/20 uppercase font-black tracking-[0.2em] text-xs">No favorites yet. Spread some love!</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'history' && (
                <div className="animate-in">
                    <header className="mb-12">
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Order <span className="text-blue-500">History</span></h2>
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Past Transactions Record</p>
                    </header>
                    <div className="space-y-4">
                        {history.map(order => (
                            <div key={order.id} className="glass-card bg-white/5 p-8 border border-white/5 flex justify-between items-center group hover:bg-white/80 transition-all">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-[10px] font-black uppercase px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/20">#{order.id}</span>
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{order.date}</span>
                                    </div>
                                    <p className="text-xs font-bold text-white/60 truncate max-w-md group-hover:text-black">
                                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black group-hover:text-black">₹{order.total.toFixed(0)}</p>
                                    <button className="text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors mt-2">Reprint Receipt</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'tab' && (
                <div className="animate-in">
                    <header className="mb-12">
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Current <span className="text-green-500">Tab</span></h2>
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Active Order Details</p>
                    </header>
                    <div className="glass-card bg-white/5 border border-white/5 overflow-hidden">
                        {cart.length > 0 ? (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                                        <th className="px-8 py-6">Item</th>
                                        <th className="px-8 py-6 text-center">Qty</th>
                                        <th className="px-8 py-6 text-center">Price</th>
                                        <th className="px-8 py-6 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.id} className="border-b border-white/[0.02]">
                                            <td className="px-8 py-5 flex items-center gap-4">
                                                <img 
                                                    src={item.image || getPlaceholder(item.category)} 
                                                    className="w-10 h-10 rounded-lg object-cover" 
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        const fallback = getPlaceholder(item.category);
                                                        if (target.src !== fallback) {
                                                            target.src = fallback;
                                                        }
                                                    }}
                                                />
                                                <span className="font-bold text-xs uppercase">{item.name}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white/5 rounded-full"><Minus className="w-3 h-3" /></button>
                                                    <span className="text-xs font-bold">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white/5 rounded-full"><Plus className="w-3 h-3" /></button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center font-mono text-xs text-white/40">₹{item.price}</td>
                                            <td className="px-8 py-5 text-right font-black text-xs text-green-500">₹{item.price * item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-20 text-center">
                                <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                <p className="text-white/20 uppercase font-black tracking-[0.2em] text-xs">Your tab is currently empty</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'dashboard' && (
                <div className="animate-in">
                    <header className="mb-12 flex justify-between items-end">
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Sales <span className="text-red-500">Analytics</span></h2>
                            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Daily Performance Review</p>
                        </div>
                        <button onClick={() => setView('liked')} className="btn-vibrant bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center gap-3 px-6 py-3 rounded-full">
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Liked Dishes ({likedIds.length})</span>
                        </button>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ModernStatCard label="Total Revenue" value={`₹${sales.total.toFixed(0)}`} icon={<BarChart3 />} color="red" />
                        <ModernStatCard label="Orders Filled" value={sales.count.toString()} icon={<Zap />} color="purple" />
                        <ModernStatCard label="Avg. Order" value={`₹${sales.count ? (sales.total / sales.count).toFixed(0) : '0'}`} icon={<Star />} color="blue" />
                    </div>
                </div>
            )}

            {view === 'admin' && (
                <div className="animate-in">
                    <header className="mb-12 flex justify-between items-end">
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Menu <span className="text-red-500">Editor</span></h2>
                            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Stock & Price Control</p>
                        </div>
                        <button onClick={() => setEditingDish({ category: 'All' })} className="btn-vibrant btn-vibrant-primary text-[10px] uppercase tracking-widest px-10 py-4">Add New Item</button>
                    </header>
                    <div className="glass-card bg-white/5 overflow-hidden border border-white/5">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                                    <th className="px-8 py-6">Product</th>
                                    <th className="px-8 py-6 text-center">Category</th>
                                    <th className="px-8 py-6 text-center">Price</th>
                                    <th className="px-8 py-6 text-right">Settings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menu.map(dish => (
                                    <tr key={dish.id} className="border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors group">
                                        <td className="px-8 py-5 flex items-center gap-4">
                                            <img 
                                                src={dish.image || getPlaceholder(dish.category)} 
                                                className="w-10 h-10 rounded-lg object-cover" 
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    const fallback = getPlaceholder(dish.category);
                                                    if (target.src !== fallback) {
                                                        target.src = fallback;
                                                    }
                                                }}
                                            />
                                            <span className="font-bold text-xs uppercase">{dish.name}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center text-[9px] font-black text-white/30 uppercase tracking-widest">{dish.category}</td>
                                        <td className="px-8 py-5 text-center font-mono text-xs text-red-500">₹{dish.price}</td>
                                        <td className="px-8 py-5 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditingDish(dish)} className="p-2 text-white/20 hover:text-white"><Settings className="w-4 h-4" /></button>
                                            <button onClick={() => removeDish(dish.id)} className="p-2 text-white/20 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        {/* Global Bottom Experience Bar - High Z-index */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[85%] lg:w-[70%] glass-effect p-6 rounded-full flex items-center justify-between shadow-2xl z-50 border border-white/10">
            <div className="flex items-center gap-4 w-1/4 overflow-hidden">
                <AnimatePresence mode="wait">
                    {cart.length > 0 ? (
                        <motion.div key="active" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-500 shadow-[0_0_20px_#ef444466] flex-shrink-0 bg-white/10">
                                <img 
                                    src={cart[cart.length-1].image || getPlaceholder(cart[cart.length-1].category)} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        const fallback = getPlaceholder(cart[cart.length-1].category);
                                        if (target.src !== fallback) target.src = fallback;
                                    }}
                                />
                            </div>
                            <div className="min-w-0 pr-4">
                                <p className="text-[11px] font-black uppercase truncate leading-none mb-1">{cart[cart.length-1].name}</p>
                                <p className="text-[9px] text-white/40 uppercase tracking-widest font-black leading-none">Last added</p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex items-center gap-3 text-white/10 italic">
                            <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center"><ShoppingCart className="w-4 h-4" /></div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Cart Empty</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-col items-center gap-3 flex-1">
                <div className="flex items-center gap-8">
                   <button className="text-white/20 hover:text-white transition-colors" title="Quick Shuffle"><Zap className="w-4 h-4" /></button>
                   <button className="text-white/20 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                   <button onClick={handleCheckout} className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 transition-all">
                      <Play className="w-7 h-7 fill-black translate-x-1" />
                   </button>
                   <button className="text-white/20 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                   <button onClick={clearCart} className="text-white/20 hover:text-red-500 transition-colors" title="Clear All"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="w-full max-w-xs h-1 bg-white/5 rounded-full relative overflow-hidden">
                    <motion.div className="absolute top-0 left-0 h-full bg-red-500 shadow-[0_0_15px_#ef4444]" initial={{ width: "0%" }} animate={{ width: `${Math.min(100, (cart.length / 8) * 100)}%` }} transition={{ type: "spring", stiffness: 100 }} />
                </div>
            </div>

            <div className="flex items-center justify-end gap-8 w-1/4">
                <div className="text-right">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Estimated Total</p>
                    <p className="text-2xl font-black text-white drop-shadow-lg italic">₹{total.toFixed(0)}</p>
                </div>
                <button 
                    onClick={() => setIsBillOpen(true)}
                    className="w-12 h-12 rounded-full bg-white/5 hover:bg-white text-white hover:text-black transition-all flex items-center justify-center border border-white/10 group active:scale-90"
                >
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
      </main>

      {/* Overlays / Modals */}
      <AnimatePresence>
        {isBillOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f0f14] w-full max-w-md rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden relative">
                <div id="receipt" className="p-12 font-mono text-white/80">
                   <div className="text-center mb-10">
                       <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-4">Joe Cooks<br/><span className="text-red-500">Receipt</span></h1>
                      <div className="h-px w-12 bg-red-500/50 mx-auto"></div>
                   </div>
                   <div className="space-y-4 mb-10">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-end border-b border-white/5 pb-2">
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.1em]">{item.name}</p>
                              <p className="text-[9px] opacity-40 italic">{item.quantity} x ₹{item.price}</p>
                           </div>
                           <p className="text-xs font-black text-red-500 font-mono italic">₹{item.price * item.quantity}</p>
                        </div>
                      ))}
                   </div>
                   <div className="space-y-4 pt-4">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-20"><span>Service Charge (5%)</span><span>₹{tax.toFixed(2)}</span></div>
                      <div className="flex justify-between items-center pt-6 border-t border-white/10 mt-2">
                         <span className="text-[10px] font-black uppercase italic opacity-40 tracking-widest">Final Grand Total</span>
                         <span className="text-3xl font-black text-white italic">₹{total.toFixed(2)}</span>
                      </div>
                   </div>
                </div>
                <div className="p-8 bg-white/5 border-t border-white/10 flex gap-4">
                   <button onClick={() => setIsBillOpen(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Discard</button>
                   <button onClick={confirmCheckout} className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20">Settle & Print</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Edit Modal */}
      <AnimatePresence>
        {editingDish && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
             <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0f0f14] w-full max-w-xl p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-2xl font-black uppercase italic tracking-tighter">Inventory <span className="text-red-500">Edit</span></h3>
                   <button onClick={() => setEditingDish(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-6 h-6 text-white/20" /></button>
                </div>
                 <form onSubmit={handleSaveDish} className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 ml-6">Product Label</label>
                      <input required value={editingDish.name || ''} onChange={e => setEditingDish({...editingDish, name: e.target.value})} className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold text-xs uppercase" placeholder="Dish Name" />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 ml-6">Image URL / Path</label>
                      <div className="flex gap-6 items-center">
                         <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                            {editingDish.image ? (
                               <img 
                                  src={editingDish.image} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                     (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+URL';
                                  }}
                               />
                            ) : (
                               <div className="text-[8px] font-black text-white/10 uppercase tracking-widest text-center px-2">No Prev</div>
                            )}
                         </div>
                         <input 
                            value={editingDish.image || ''} 
                            onChange={e => setEditingDish({...editingDish, image: e.target.value})} 
                            className="flex-1 px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold text-xs text-white" 
                            placeholder="/images/your-image.png or URL" 
                         />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 ml-6">Classification</label>
                        <select value={editingDish.category || 'All'} onChange={e => setEditingDish({...editingDish, category: e.target.value})} className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] outline-none font-bold text-[10px] uppercase appearance-none">{CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0f0f14]">{c}</option>)}</select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 ml-6">Unit Cost (₹)</label>
                        <input required type="number" value={editingDish.price || ''} onChange={e => setEditingDish({...editingDish, price: Number(e.target.value)})} className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] outline-none font-black text-lg text-red-500" placeholder="0.00" />
                      </div>
                   </div>
                   <button type="submit" className="w-full py-6 bg-red-500 text-white rounded-[2.5rem] font-black tracking-[0.3em] text-[10px] uppercase shadow-2xl shadow-red-500/10 hover:bg-red-600 transition-all">Communicate to Store</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @media print {
            body * { visibility: hidden; }
            #receipt, #receipt * { visibility: visible; }
            #receipt { position: absolute; left: 0; top: 0; width: 100%; border: none; background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}

function SidebarNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all group relative cursor-pointer outline-none w-full text-left ${active ? 'bg-white/5 text-white' : 'text-white/30 hover:text-white/50 hover:bg-white/[0.02]'}`}
    >
      {active && <motion.div layoutId="nav-glow" className="sidebar-active-indicator" />}
      <div className={`${active ? 'text-red-500' : 'group-hover:text-white/60'} transition-colors`}>{icon}</div>
      <span className={`text-[11px] uppercase tracking-[0.1em] font-black`}>{label}</span>
    </button>
  )
}

function ModernStatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
    const glows = {
        red: 'text-red-500 border-red-500/10',
        purple: 'text-purple-500 border-purple-500/10',
        blue: 'text-blue-500 border-blue-500/10',
    }[color] || 'text-white border-white/5';

    return (
        <div className={`glass-card p-10 bg-white/5 border flex flex-col items-center text-center group hover:bg-white/10 transition-all ${glows}`}>
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform ${glows}`}>
                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" }) : icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-2">{label}</p>
            <p className="text-4xl font-black italic tracking-tighter">{value}</p>
        </div>
    )
}

function getPlaceholder(category: string) {
    const placeholders: Record<string, string> = {
        'South Indian': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', // Dosa
        'North Indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80', // Curry
        'Chinese': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80', // Noodles
        'Beverages': 'https://images.unsplash.com/photo-1544145945-f904253db0ad?w=800&q=80', // Drink
        'Desserts': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80', // Sweet
        'Tandoor': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80', // Kebab
        'All': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80' // General
    };
    return placeholders[category] || placeholders['All'];
}

function DishCard({ dish, addToCart, toggleLike, isLiked }: { dish: Dish, addToCart: (d: Dish) => void, toggleLike: (id: string) => void, isLiked: boolean }) {
    const fallback = getPlaceholder(dish.category);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group cursor-pointer"
        >
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-lg border border-white/5 bg-white/5">
                <img 
                    src={dish.image?.trim() || fallback} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== fallback) {
                            target.src = fallback;
                        }
                    }}
                />
                {!dish.image && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded text-[7px] font-black tracking-widest text-white/40 uppercase">
                        Default Img
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                        onClick={() => addToCart(dish)}
                        className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => toggleLike(dish.id)}
                        className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg border transition-all ${isLiked ? 'bg-red-500 border-red-500 text-white' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
                    >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
                    </button>
                </div>
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[9px] font-black tracking-widest">
                    ₹{dish.price}
                </div>
            </div>
            <h4 className="font-bold text-xs tracking-tight truncate group-hover:text-red-400 transition-colors uppercase">{dish.name}</h4>
            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mt-1 tracking-tighter">{dish.category}</p>
        </motion.div>
    )
}
