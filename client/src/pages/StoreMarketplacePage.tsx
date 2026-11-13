'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Camera, Check, MapPin, MessageCircle, Pencil, Search, ShoppingBag, SlidersHorizontal,
  Tag, Trash2, X,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { messagesApi, storeApi, uploadsApi } from '../services/api';
import type { CloudinaryAsset, StoreCategory, StoreListing } from '../types';
import { formatCurrency, getInitials, timeAgo } from '../utils/format';

const categories: StoreCategory[] = [
  'Electronics', 'Fashion', 'Books', 'Furniture', 'Accessories', 'Home Appliances', 'Others',
];
const categoryFilters = ['All', ...categories] as const;
const conditionOptions = ['New', 'Used'] as const;

const emptyForm = {
  title: '',
  description: '',
  price: '',
  category: 'Electronics' as StoreCategory,
  condition: 'Used' as 'New' | 'Used',
  location: '',
  photos: [] as string[],
  photoAssets: [] as CloudinaryAsset[],
};

interface SelectedPhoto {
  file: File;
  preview: string;
}

const sampleListings: StoreListing[] = [
  {
    _id: 'sample-store-samsung-a52',
    title: 'Samsung Galaxy A52 · 128GB',
    description: 'Carefully used, 8/10 condition. Everything works well and the display is clean. Includes original box and case.',
    price: 14500,
    category: 'Electronics',
    condition: 'Used',
    location: 'Dhanmondi, Dhaka',
    photos: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80'],
    status: 'Available',
    sellerId: 'sample-seller-nusrat',
    seller: { _id: 'sample-seller-nusrat', fullName: 'Nusrat Jahan', location: 'Dhanmondi, Dhaka', role: 'user', verificationStatus: 'Verified', rating: 4.8, reviewCount: 12, completedTasks: 8, postedTasks: 15, createdAt: '2026-10-14T08:49:40.955Z' },
    createdAt: '2026-11-12T10:00:00.000Z',
    updatedAt: '2026-11-12T10:00:00.000Z',
    isSample: true,
  },
  {
    _id: 'sample-store-laptop',
    title: 'Dell Inspiron 15 laptop',
    description: 'Core i5, 8GB RAM, 256GB SSD. Great for study and office work; battery lasts around four hours.',
    price: 32000,
    category: 'Electronics',
    condition: 'Used',
    location: 'Uttara, Dhaka',
    photos: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80'],
    status: 'Available',
    sellerId: 'sample-seller-mehedi',
    seller: { _id: 'sample-seller-mehedi', fullName: 'Mehedi Hasan', location: 'Uttara, Dhaka', role: 'user', verificationStatus: 'Verified', rating: 4.6, reviewCount: 9, completedTasks: 11, postedTasks: 7, createdAt: '2026-10-14T08:49:40.955Z' },
    createdAt: '2026-11-11T08:30:00.000Z',
    updatedAt: '2026-11-11T08:30:00.000Z',
    isSample: true,
  },
  {
    _id: 'sample-store-bicycle',
    title: 'Phoenix city bicycle',
    description: 'Comfortable 26-inch bicycle with recently serviced brakes and gears. Ready for daily commuting.',
    price: 8500,
    category: 'Others',
    condition: 'Used',
    location: 'Rajshahi Sadar, Rajshahi',
    photos: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80'],
    status: 'Available',
    sellerId: 'sample-seller-rahim',
    seller: { _id: 'sample-seller-rahim', fullName: 'Rahim Ahmed', location: 'Rajshahi', role: 'user', verificationStatus: 'Verified', rating: 4.9, reviewCount: 24, completedTasks: 32, postedTasks: 5, createdAt: '2026-10-14T08:49:40.955Z' },
    createdAt: '2026-11-10T12:15:00.000Z',
    updatedAt: '2026-11-10T12:15:00.000Z',
    isSample: true,
  },
  {
    _id: 'sample-store-study-table',
    title: 'Solid wood study table',
    description: 'Compact study desk with a drawer and sturdy legs. A few light marks from normal use.',
    price: 3200,
    category: 'Furniture',
    condition: 'Used',
    location: 'Mirpur 10, Dhaka',
    photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80'],
    status: 'Available',
    sellerId: 'sample-seller-farhana',
    seller: { _id: 'sample-seller-farhana', fullName: 'Farhana Akter', location: 'Mirpur, Dhaka', role: 'user', verificationStatus: 'Verified', rating: 4.9, reviewCount: 18, completedTasks: 14, postedTasks: 9, createdAt: '2026-10-14T08:49:40.955Z' },
    createdAt: '2026-11-10T09:30:00.000Z',
    updatedAt: '2026-11-10T09:30:00.000Z',
    isSample: true,
  },
  {
    _id: 'sample-store-headphones',
    title: 'Sony wireless headphones',
    description: 'Clear sound and comfortable fit, with charging cable. Tested and working perfectly.',
    price: 1800,
    category: 'Electronics',
    condition: 'Used',
    location: 'Chawkbazar, Chattogram',
    photos: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
    status: 'Available',
    sellerId: 'sample-seller-karim',
    seller: { _id: 'sample-seller-karim', fullName: 'Karim Uddin', location: 'Chattogram', role: 'user', verificationStatus: 'Verified', rating: 4.7, reviewCount: 18, completedTasks: 9, postedTasks: 6, createdAt: '2026-10-14T08:49:40.955Z' },
    createdAt: '2026-11-09T14:00:00.000Z',
    updatedAt: '2026-11-09T14:00:00.000Z',
    isSample: true,
  },
  {
    _id: 'sample-store-textbooks',
    title: 'University textbooks bundle',
    description: 'Four first-year business studies books in good condition. Selling together at a student-friendly price.',
    price: 1200,
    category: 'Books',
    condition: 'Used',
    location: 'Nilkhet, Dhaka',
    photos: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80'],
    status: 'Available',
    sellerId: 'sample-seller-sadia',
    seller: { _id: 'sample-seller-sadia', fullName: 'Sadia Rahman', location: 'Dhaka', role: 'user', verificationStatus: 'Verified', rating: 4.9, reviewCount: 16, completedTasks: 9, postedTasks: 11, createdAt: '2026-10-14T08:49:40.955Z' },
    createdAt: '2026-11-09T09:45:00.000Z',
    updatedAt: '2026-11-09T09:45:00.000Z',
    isSample: true,
  },
  {
    _id: 'sample-store-backpack',
    title: 'Water-resistant campus backpack',
    description: 'Spacious 25L backpack with laptop sleeve. Bought recently and used only a few times.',
    price: 900,
    category: 'Fashion',
    condition: 'Used',
    location: 'Pabna Sadar, Pabna',
    photos: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'],
    status: 'Available',
    sellerId: 'sample-seller-tanvir',
    seller: { _id: 'sample-seller-tanvir', fullName: 'Tanvir Ahmed', location: 'Pabna', role: 'user', verificationStatus: 'Verified', rating: 4.7, reviewCount: 7, completedTasks: 10, postedTasks: 5, createdAt: '2026-10-14T08:49:40.955Z' },
    createdAt: '2026-11-08T15:20:00.000Z',
    updatedAt: '2026-11-08T15:20:00.000Z',
    isSample: true,
  },
  {
    _id: 'sample-store-desk-lamp',
    title: 'Adjustable LED desk lamp',
    description: 'Brand new adjustable LED desk lamp with warm and cool light modes, flexible neck and USB adapter.',
    price: 1400,
    category: 'Home Appliances',
    condition: 'New',
    location: 'Zindabazar, Sylhet',
    photos: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'],
    status: 'Available',
    sellerId: 'sample-seller-rafa',
    seller: { _id: 'sample-seller-rafa', fullName: 'Rafiul Islam', location: 'Sylhet', role: 'user', verificationStatus: 'Verified', rating: 4.8, reviewCount: 21, completedTasks: 25, postedTasks: 13, createdAt: '2026-10-14T08:49:40.955Z' },
    createdAt: '2026-11-08T11:00:00.000Z',
    updatedAt: '2026-11-08T11:00:00.000Z',
    isSample: true,
  },
];

export default function StoreMarketplacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<StoreListing[]>([]);
  const [myListings, setMyListings] = useState<StoreListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  const [error, setError] = useState('');
  const [myError, setMyError] = useState('');
  const [showMine, setShowMine] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [editing, setEditing] = useState<StoreListing | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [actionId, setActionId] = useState('');
  const [selectedListing, setSelectedListing] = useState<StoreListing | null>(null);
  const [contacting, setContacting] = useState(false);
  const marketplaceRequest = useRef(0);

  const loadMine = useCallback(async () => {
    if (!user) return;
    setMyLoading(true);
    setMyError('');
    try {
      const response = await storeApi.mine();
      setMyListings(response.data.listings);
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Your listings could not be loaded.';
      setMyError(message);
      toast.error(message);
    } finally {
      setMyLoading(false);
    }
  }, [user]);

  const refreshMarketplace = useCallback(async () => {
    const requestId = ++marketplaceRequest.current;
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    if (search.trim()) params.search = search.trim();
    if (category !== 'All') params.category = category;
    if (location.trim()) params.location = location.trim();
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    try {
      const response = await storeApi.list(params);
      if (requestId === marketplaceRequest.current) setListings(response.data.listings);
    } catch (requestError) {
      if (requestId === marketplaceRequest.current) {
        setError((requestError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Marketplace listings could not be loaded.');
      }
    } finally {
      if (requestId === marketplaceRequest.current) setLoading(false);
    }
  }, [category, location, maxPrice, minPrice, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshMarketplace(); }, 250);
    return () => window.clearTimeout(timer);
  }, [refreshMarketplace]);

  const visibleSamples = useMemo(() => sampleListings.filter((listing) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${listing.title} ${listing.description} ${listing.category}`.toLowerCase().includes(query);
    const matchesCategory = category === 'All' || listing.category === category;
    const matchesLocation = !location.trim() || listing.location.toLowerCase().includes(location.trim().toLowerCase());
    const matchesMin = !minPrice || listing.price >= Number(minPrice);
    const matchesMax = !maxPrice || listing.price <= Number(maxPrice);
    return matchesSearch && matchesCategory && matchesLocation && matchesMin && matchesMax;
  }), [category, location, maxPrice, minPrice, search]);

  const updateForm = (field: keyof typeof emptyForm, value: string | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handlePhotoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    event.target.value = '';
    if (form.photos.length + selectedPhotos.length + incoming.length > 5) {
      toast.error('Add no more than five photos to a listing.');
      return;
    }
    if (incoming.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024)) {
      toast.error('Photos must be JPG, PNG, or WebP files no larger than 4 MB each.');
      return;
    }
    try {
      const previews = await Promise.all(incoming.map((file) => readPhotoPreview(file)));
      setSelectedPhotos((current) => [...current, ...previews]);
    } catch {
      toast.error('A selected photo could not be previewed.');
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setSelectedPhotos([]);
    setEditing(null);
  };

  const submitListing = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast.error('Sign in to list an item.');
      return;
    }
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      toast.error('Complete the product title, description, and location.');
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 1 || price > 10000000) {
      toast.error('Enter a price between ৳1 and ৳10,000,000.');
      return;
    }
    if (form.photos.length + selectedPhotos.length < 1) {
      toast.error('Add at least one product photo.');
      return;
    }

    setSaving(true);
    try {
      const photoProgress = selectedPhotos.map(() => 0);
      const uploaded = await Promise.all(
        selectedPhotos.map(({ file }, index) => uploadsApi.upload(file, 'store-listing', (progress) => {
          photoProgress[index] = progress;
          setUploadProgress(Math.round(photoProgress.reduce((total, item) => total + item, 0) / photoProgress.length));
        }))
      );
      const newAssets = uploaded.map((response) => response.data.asset as CloudinaryAsset);
      const photos = [
        ...form.photos,
        ...newAssets.map((asset) => asset.url),
      ];
      const photoAssets = [...form.photoAssets, ...newAssets];
      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        category: form.category,
        condition: form.condition,
        location: form.location.trim(),
        photos,
        photoAssets,
      };
      if (editing) {
        await storeApi.update(editing._id, data);
        toast.success('Listing updated');
      } else {
        await storeApi.create(data);
        toast.success('Item listed');
      }
      resetForm();
      await refreshMarketplace();
      if (showMine) await loadMine();
    } catch (requestError) {
      toast.error((requestError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to save listing. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const editListing = (listing: StoreListing) => {
    setEditing(listing);
    setForm({
      title: listing.title,
      description: listing.description,
      price: String(listing.price),
      category: listing.category,
      condition: listing.condition,
      location: listing.location,
      photos: [...listing.photos],
      photoAssets: [...(listing.photoAssets || [])],
    });
    setSelectedPhotos([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateListingStatus = async (listing: StoreListing, status: 'Available' | 'Sold') => {
    setActionId(listing._id);
    try {
      const response = await storeApi.update(listing._id, { status });
      setMyListings((current) => current.map((item) => item._id === listing._id ? response.data.listing : item));
      if (status === 'Sold') {
        setListings((current) => current.filter((item) => item._id !== listing._id));
        toast.success('Listing marked as sold');
      } else {
        await refreshMarketplace();
        toast.success('Listing is available again');
      }
    } catch (requestError) {
      toast.error((requestError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to update listing.');
    } finally {
      setActionId('');
    }
  };

  const deleteListing = async (listing: StoreListing) => {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
    setActionId(listing._id);
    try {
      await storeApi.remove(listing._id);
      setMyListings((current) => current.filter((item) => item._id !== listing._id));
      setListings((current) => current.filter((item) => item._id !== listing._id));
      toast.success('Listing deleted');
    } catch (requestError) {
      toast.error((requestError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to delete listing.');
    } finally {
      setActionId('');
    }
  };

  const contactSeller = async (listing: StoreListing) => {
    if (!user) {
      toast.error('Sign in to contact the seller.');
      return;
    }
    if (listing.isSample || listing.sellerId === user._id) return;
    setContacting(true);
    try {
      await messagesApi.sendStore({
        listingId: listing._id,
        content: `Hi, I'm interested in "${listing.title}". Is it still available?`,
      });
      toast.success('Message sent to the seller');
      setSelectedListing(null);
      router.push(`/messages?listing=${listing._id}&user=${listing.sellerId}`);
    } catch (requestError) {
      toast.error((requestError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to contact the seller.');
    } finally {
      setContacting(false);
    }
  };

  const removePhoto = (index: number) => {
    setForm((current) => {
      const removed = current.photos[index];
      return {
        ...current,
        photos: current.photos.filter((_, itemIndex) => itemIndex !== index),
        photoAssets: current.photoAssets.filter((asset) => asset.url !== removed),
      };
    });
  };

  const removeSelectedPhoto = (index: number) => {
    setSelectedPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const cards = showMine ? myListings : listings;

  return (
    <div className="mx-auto w-full max-w-140 px-3 py-3 sm:px-0">
      <div className="mb-3">
        <h1 className="text-xl font-extrabold text-slate-950">Marketplace</h1>
        <p className="mt-0.5 text-xs text-slate-500">Buy and sell pre-loved finds in your community.</p>
      </div>

      <form onSubmit={submitListing} className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{getInitials(user?.fullName || 'You')}</div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-950">{editing ? 'Edit your listing' : 'Sell an Item'}</h2>
            <p className="text-xs text-slate-500">{editing ? 'Update your product details and photos.' : 'Give a good item a new home.'}</p>
          </div>
          {user && <button type="button" onClick={() => {
            const next = !showMine;
            setShowMine(next);
            resetForm();
            if (next) void loadMine();
          }} className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-50">{showMine ? 'Browse items' : 'My listings'}</button>}
        </div>
        {user ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <StoreField label="Product title" required><input required maxLength={120} value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="e.g. Samsung Galaxy A52" className={storeInputClass} /></StoreField>
              <StoreField label="Price (BDT)" required><input required type="number" min="1" max="10000000" value={form.price} onChange={(event) => updateForm('price', event.target.value)} placeholder="e.g. 14500" className={storeInputClass} /></StoreField>
              <StoreField label="Category" required><select required value={form.category} onChange={(event) => updateForm('category', event.target.value)} className={storeInputClass}>{categories.map((item) => <option key={item}>{item}</option>)}</select></StoreField>
              <StoreField label="Condition" required><select required value={form.condition} onChange={(event) => updateForm('condition', event.target.value)} className={storeInputClass}>{conditionOptions.map((item) => <option key={item}>{item}</option>)}</select></StoreField>
              <div className="sm:col-span-2"><StoreField label="Location" required><input required maxLength={120} value={form.location} onChange={(event) => updateForm('location', event.target.value)} placeholder="e.g. Dhanmondi, Dhaka" className={storeInputClass} /></StoreField></div>
              <div className="sm:col-span-2"><StoreField label="Description" required><textarea required maxLength={2000} rows={2} value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Describe the item's condition and details..." className={`${storeInputClass} h-auto py-2`} /></StoreField></div>
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600"><Camera className="h-4 w-4 text-orange-500" /> Photos <span className="font-normal text-slate-400">· up to 5, JPG/PNG/WebP, 5 MB each</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void handlePhotoSelection(event)} className="sr-only" />
                </label>
                {(form.photos.length > 0 || selectedPhotos.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.photos.map((photo, index) => <PhotoPreview key={`${photo}-${index}`} src={photo} onRemove={() => removePhoto(index)} />)}
                    {selectedPhotos.map((photo, index) => <PhotoPreview key={`${photo.file.name}-${index}`} src={photo.preview} onRemove={() => removeSelectedPhoto(index)} />)}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-2">
              {editing && <Button type="button" size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>}
              <Button type="submit" size="sm" loading={saving}>{saving ? `Uploading ${uploadProgress}%` : editing ? 'Save Changes' : 'Post Listing'}</Button>
            </div>
          </>
        ) : (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">Sign in to sell your items. <Link href="/login" className="font-bold text-orange-600">Log in</Link></p>
        )}
      </form>

      <form onSubmit={(event) => event.preventDefault()} className="mb-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
        <label className="flex h-10 items-center gap-2 rounded-md bg-slate-100 px-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, brands, or categories" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
        </label>
        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          {categoryFilters.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${category === item ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item}</button>)}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} type="number" min="0" placeholder="Min price ৳" aria-label="Minimum price" className={`${storeInputClass} h-9`} />
          <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" min="0" placeholder="Max price ৳" aria-label="Maximum price" className={`${storeInputClass} h-9`} />
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Filter by location" aria-label="Filter by location" className={`${storeInputClass} col-span-2 h-9 sm:col-span-1`} />
        </div>
      </form>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-slate-950">{showMine ? 'My listings' : 'Community listings'}</h2>
        {!showMine && <span className="text-xs text-slate-500">{listings.length} {listings.length === 1 ? 'item' : 'items'}</span>}
      </div>
      {showMine && myLoading ? <LoadingSpinner className="min-h-32" /> : !showMine && loading ? <LoadingSpinner className="min-h-32" /> : error && !showMine ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-800">Could not load marketplace</p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void refreshMarketplace()}>Try again</Button>
        </div>
      ) : showMine && myError ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-800">Could not load your listings</p>
          <p className="mt-1 text-xs text-slate-500">{myError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void loadMine()}>Try again</Button>
        </div>
      ) : cards.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {cards.map((listing) => <ListingCard key={listing._id} listing={listing}
            ownListing={listing.sellerId === user?._id}
            actionBusy={actionId === listing._id}
            onDetails={() => setSelectedListing(listing)}
            onContact={() => void contactSeller(listing)}
            onEdit={() => editListing(listing)}
            onDelete={() => void deleteListing(listing)}
            onStatusChange={(status) => void updateListingStatus(listing, status)} />)}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-7 text-center shadow-sm">
          <ShoppingBag className="mx-auto h-7 w-7 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-800">{showMine ? 'You have no listings yet' : 'No items match these filters'}</p>
          <p className="mt-1 text-xs text-slate-500">{showMine ? 'Post an item above to get started.' : 'Try a different search or category.'}</p>
        </div>
      )}

      {!showMine && (
        <section className="mt-5">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-700">Sample finds</h2>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Preview only</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {visibleSamples.map((listing) => <ListingCard key={listing._id} listing={listing} ownListing={false} actionBusy={false}
              onDetails={() => setSelectedListing(listing)} onContact={() => undefined}
              onEdit={() => undefined} onDelete={() => undefined} onStatusChange={() => undefined} />)}
          </div>
        </section>
      )}

      {selectedListing && <ListingDetails listing={selectedListing} ownListing={selectedListing.sellerId === user?._id}
        contacting={contacting} onClose={() => setSelectedListing(null)} onContact={() => void contactSeller(selectedListing)} />}
    </div>
  );
}

const storeInputClass = 'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100';

function StoreField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}{required && <span className="text-orange-600"> *</span>}<span className="mt-1 block">{children}</span></label>;
}

function ListingCard({
  listing, ownListing, actionBusy, onDetails, onContact, onEdit, onDelete, onStatusChange,
}: {
  listing: StoreListing;
  ownListing: boolean;
  actionBusy: boolean;
  onDetails: () => void;
  onContact: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: 'Available' | 'Sold') => void;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onDetails} className="block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {listing.photos[0] ? <ProductImage src={listing.photos[0]} alt={listing.title} /> : <div className="flex h-full items-center justify-center text-slate-300"><ShoppingBag className="h-8 w-8" /></div>}
          {listing.isSample && <span className="absolute left-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">Sample</span>}
          {!listing.isSample && listing.status === 'Sold' && <span className="absolute left-2 top-2 rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Sold</span>}
          <span className="absolute right-2 top-2 rounded bg-slate-950/75 px-1.5 py-0.5 text-[10px] font-bold text-white">{listing.condition}</span>
        </div>
        <div className="px-2.5 pb-2 pt-2">
          <p className="truncate text-[13px] font-bold text-slate-950">{listing.title}</p>
          <p className="mt-0.5 text-sm font-extrabold text-orange-600">{formatCurrency(listing.price)}</p>
          <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-500"><MapPin className="h-3 w-3 shrink-0" />{listing.location}</p>
          <p className="mt-1 truncate text-[10px] text-slate-500">{listing.seller?.fullName || 'TaskAnt member'} · {listing.category}</p>
        </div>
      </button>
      <div className="mx-2.5 flex items-center gap-1 border-t border-slate-100 py-1.5">
        <button type="button" onClick={onDetails} className="flex flex-1 items-center justify-center gap-1 rounded px-1 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100">View Details</button>
        {ownListing ? (
          <>
            <button type="button" disabled={actionBusy} onClick={onEdit} aria-label="Edit listing" className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={actionBusy} onClick={() => onStatusChange(listing.status === 'Sold' ? 'Available' : 'Sold')} className="rounded p-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50" title={listing.status === 'Sold' ? 'Mark available' : 'Mark as sold'}>{listing.status === 'Sold' ? <Check className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}</button>
            <button type="button" disabled={actionBusy} onClick={onDelete} aria-label="Delete listing" className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
          </>
        ) : (
          <button type="button" disabled={listing.isSample} onClick={onContact} title={listing.isSample ? 'Sample listings cannot be contacted' : 'Contact seller'} className="flex flex-1 items-center justify-center gap-1 rounded bg-orange-50 px-1.5 py-1.5 text-[10px] font-bold text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"><MessageCircle className="h-3 w-3" />{listing.isSample ? 'Sample only' : 'Contact Seller'}</button>
        )}
      </div>
    </article>
  );
}

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="flex h-full items-center justify-center text-slate-300"><ShoppingBag className="h-8 w-8" /></div>;
  return <Image src={src} alt={alt} fill sizes="(max-width: 640px) 50vw, 280px" className="object-cover" onError={() => setFailed(true)} />;
}

function PhotoPreview({ src, onRemove }: { src: string; onRemove: () => void }) {
  return <div className="relative h-14 w-14 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
    <Image unoptimized src={src} alt="Selected product" width={56} height={56} className="h-full w-full object-cover" />
    <button type="button" onClick={onRemove} aria-label="Remove photo" className="absolute right-0.5 top-0.5 rounded-full bg-slate-950/70 p-0.5 text-white"><X className="h-3 w-3" /></button>
  </div>;
}

function ListingDetails({
  listing, ownListing, contacting, onClose, onContact,
}: {
  listing: StoreListing;
  ownListing: boolean;
  contacting: boolean;
  onClose: () => void;
  onContact: () => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="listing-details-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-start justify-between p-4 pb-2">
          <div><p className="text-xs font-semibold text-orange-600">{listing.category} · {listing.condition}{listing.isSample ? ' · Sample' : ''}</p>
            <h2 id="listing-details-title" className="mt-1 text-lg font-extrabold text-slate-950">{listing.title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close listing details" className="rounded-full p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </header>
        {listing.photos.length > 0 && <div className="relative aspect-[4/3] bg-slate-100">
          <ProductImage src={listing.photos[Math.min(photoIndex, listing.photos.length - 1)]} alt={listing.title} />
          {listing.photos.length > 1 && <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">{listing.photos.map((photo, index) => <button key={photo} type="button" onClick={() => setPhotoIndex(index)} aria-label={`View photo ${index + 1}`} className={`h-2 w-2 rounded-full ${index === photoIndex ? 'bg-orange-600' : 'bg-white/80'}`} />)}</div>}
        </div>}
        <div className="space-y-3 p-4">
          <p className="text-xl font-extrabold text-orange-600">{formatCurrency(listing.price)}</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{listing.description}</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 text-orange-500" />{listing.location}</p>
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{getInitials(listing.seller?.fullName || 'TaskAnt member')}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{listing.seller?.fullName || 'TaskAnt member'}</p><p className="text-[10px] text-slate-500">Listed {timeAgo(listing.createdAt)}</p></div>
          </div>
          {listing.isSample && <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">Sample listing for preview only. Contact is available on live community listings.</p>}
        </div>
        <footer className="flex gap-2 border-t border-slate-100 p-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          {!ownListing && !listing.isSample && listing.status === 'Available' && <Button type="button" loading={contacting} className="flex-1" onClick={onContact}><MessageCircle className="h-4 w-4" />Contact Seller</Button>}
        </footer>
      </section>
    </div>
  );
}

function readPhotoPreview(file: File): Promise<SelectedPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve({ file, preview: reader.result })
      : reject(new Error('Unable to preview product photo.'));
    reader.onerror = () => reject(new Error('Unable to preview product photo.'));
    reader.readAsDataURL(file);
  });
}
