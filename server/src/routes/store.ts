import { Router } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, insertRecord, updateRecord } from '../db/records';
import { StoreListing, User } from '../models/index';
import type { IStoreListing, IUser, StoreCategory } from '../types/index';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler, validate } from '../middleware/validate';
import { toPublicUser } from '../utils/auth';
import { isOwnedCloudinaryAsset } from '../services/cloudinary';
import type { AuthRequest } from '../types/index';

const router = Router();
const categories: StoreCategory[] = [
  'Electronics', 'Fashion', 'Books', 'Furniture', 'Accessories', 'Home Appliances', 'Others',
];

async function enrichListing(listing: IStoreListing) {
  const seller = await findRecord<IUser>(User, listing.sellerId);
  return { ...listing, seller: seller ? toPublicUser(seller) : null };
}

function escapedRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/my', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const listings = await findRecords<IStoreListing>(
    StoreListing,
    { sellerId: req.user!.id },
    { createdAt: -1 }
  );
  res.json({ listings: await Promise.all(listings.map(enrichListing)) });
}));

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const query: Record<string, unknown> = { status: 'Available' };
  const { search, category, location, minPrice, maxPrice } = req.query;
  if (typeof category === 'string' && category && category !== 'All') {
    if (!categories.includes(category as StoreCategory)) {
      res.status(400).json({ message: 'Invalid product category' });
      return;
    }
    query.category = category;
  }
  if (typeof search === 'string' && search.trim()) {
    const match = { $regex: escapedRegex(search.trim()), $options: 'i' };
    query.$or = [{ title: match }, { description: match }, { category: match }];
  }
  if (typeof location === 'string' && location.trim()) {
    query.location = { $regex: escapedRegex(location.trim()), $options: 'i' };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const minimum = minPrice === undefined ? 0 : Number(minPrice);
    const maximum = maxPrice === undefined ? 10000000 : Number(maxPrice);
    if (
      !Number.isFinite(minimum) || !Number.isFinite(maximum) ||
      minimum < 0 || maximum < minimum || maximum > 10000000
    ) {
      res.status(400).json({ message: 'Enter a valid product price range' });
      return;
    }
    query.price = { $gte: minimum, $lte: maximum };
  }
  const listings = await findRecords<IStoreListing>(StoreListing, query, { createdAt: -1 });
  res.json({ listings: await Promise.all(listings.map(enrichListing)) });
}));

router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().isLength({ max: 120 }),
    body('description').trim().notEmpty().isLength({ max: 2000 }),
    body('price').isFloat({ min: 1, max: 10000000 }),
    body('category').isIn(categories),
    body('condition').isIn(['New', 'Used']),
    body('location').trim().notEmpty().isLength({ max: 120 }),
    body('photos').isArray({ max: 5 }),
    body('photoAssets').isArray({ max: 5 }),
  ],
  validate,
  asyncHandler(async (req: AuthRequest, res) => {
    const photos = req.body.photos as unknown[];
    const photoAssets = req.body.photoAssets as unknown[];
    if (
      !photos.length ||
      photos.length !== photoAssets.length ||
      !photoAssets.every((asset) =>
        isOwnedCloudinaryAsset(asset, req.user!.id, 'store-listing')
      ) ||
      !photoAssets.every((asset, index) => (asset as { url: string }).url === photos[index])
    ) {
      res.status(400).json({ message: 'Upload product photos before posting the listing.' });
      return;
    }
    const listing = await insertRecord<IStoreListing>(StoreListing, {
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      condition: req.body.condition,
      location: req.body.location,
      photos,
      photoAssets,
      status: 'Available',
      sellerId: req.user!.id,
    });
    res.status(201).json({ listing: await enrichListing(listing) });
  })
);

router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const listing = await findRecord<IStoreListing>(StoreListing, req.params.id);
  if (!listing || (listing.status === 'Sold' && listing.sellerId !== req.user?.id)) {
    res.status(404).json({ message: 'Listing not found' });
    return;
  }
  res.json({ listing: await enrichListing(listing) });
}));

router.patch(
  '/:id',
  authenticate,
  [
    body('title').optional().trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().trim().notEmpty().isLength({ max: 2000 }),
    body('price').optional().isFloat({ min: 1, max: 10000000 }),
    body('category').optional().isIn(categories),
    body('condition').optional().isIn(['New', 'Used']),
    body('location').optional().trim().notEmpty().isLength({ max: 120 }),
    body('photos').optional().isArray({ max: 5 }),
    body('photoAssets').optional().isArray({ max: 5 }),
    body('status').optional().isIn(['Available', 'Sold']),
  ],
  validate,
  asyncHandler(async (req: AuthRequest, res) => {
    const listing = await findRecord<IStoreListing>(StoreListing, req.params.id);
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    if (listing.sellerId !== req.user!.id) {
      res.status(403).json({ message: 'Only the seller can update this listing' });
      return;
    }
    if (req.body.photoAssets !== undefined) {
      const photoAssets = req.body.photoAssets as unknown[];
      const photos = req.body.photos as unknown;
      if (
        !Array.isArray(photos) ||
        !photoAssets.every((asset) =>
          isOwnedCloudinaryAsset(asset, req.user!.id, 'store-listing')
        ) ||
        !photoAssets.every((asset) => photos.includes((asset as { url: string }).url))
      ) {
        res.status(400).json({ message: 'Upload product photos before saving the listing.' });
        return;
      }
      const currentAssetUrls = new Set(
        (listing.photoAssets || []).map((asset) => asset.url)
      );
      if (photos.some((photo) =>
        typeof photo !== 'string' ||
        (!photoAssets.some((asset) => (asset as { url: string }).url === photo) &&
          (!listing.photos.includes(photo) || currentAssetUrls.has(photo)))
      )) {
        res.status(400).json({ message: 'Only existing photos or your uploaded product photos can be used.' });
        return;
      }
    }
    const allowed = ['title', 'description', 'price', 'category', 'condition', 'location', 'photos', 'photoAssets', 'status'];
    const update = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key))
    );
    if (!Object.keys(update).length) {
      res.status(400).json({ message: 'Provide listing details to update' });
      return;
    }
    const updated = await updateRecord<IStoreListing>(StoreListing, listing._id, update);
    if (!updated) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    res.json({ listing: await enrichListing(updated) });
  })
);

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const listing = await findRecord<IStoreListing>(StoreListing, req.params.id);
  if (!listing) {
    res.status(404).json({ message: 'Listing not found' });
    return;
  }
  if (listing.sellerId !== req.user!.id) {
    res.status(403).json({ message: 'Only the seller can delete this listing' });
    return;
  }
  await StoreListing.findByIdAndDelete(listing._id).exec();
  res.json({ message: 'Listing deleted' });
}));

export default router;
