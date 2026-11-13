import { Router } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, insertRecord } from '../db/records';
import { Ride, RideRequest, User } from '../models/index';
import type { IRide, IRideRequest, IUser } from '../types/index';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler, validate } from '../middleware/validate';
import { toPublicUser } from '../utils/auth';
import type { AuthRequest } from '../types/index';

const router = Router();

async function enrichRide(ride: IRide) {
  const driver = await findRecord<IUser>(User, ride.driverId);
  return { ...ride, driver: driver ? toPublicUser(driver) : null };
}

async function enrichRequest(request: IRideRequest) {
  const [passenger, ride] = await Promise.all([
    findRecord<IUser>(User, request.passengerId),
    findRecord<IRide>(Ride, request.rideId),
  ]);
  return {
    ...request,
    passenger: passenger ? toPublicUser(passenger) : null,
    ride: ride ? await enrichRide(ride) : null,
  };
}

router.get('/my/requests', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const requests = await findRecords<IRideRequest>(
    RideRequest,
    { passengerId: req.user!.id },
    { createdAt: -1 }
  );
  res.json({ requests: await Promise.all(requests.map(enrichRequest)) });
}));

router.get('/', optionalAuth, asyncHandler(async (_req, res) => {
  const rides = await findRecords<IRide>(
    Ride,
    { status: 'Open', departureAt: { $gte: new Date() } },
    { departureAt: 1 }
  );
  res.json({ rides: await Promise.all(rides.map(enrichRide)) });
}));

router.post(
  '/',
  authenticate,
  [
    body('pickup').trim().notEmpty().isLength({ max: 120 }),
    body('destination').trim().notEmpty().isLength({ max: 120 }),
    body('vehicleType').isIn(['Car', 'Bike']),
    body('departureAt')
      .isISO8601()
      .custom((value: string) => new Date(value).getTime() > Date.now()),
    body('availableSeats').isInt({ min: 1, max: 8 }),
    body('fare').isFloat({ min: 1, max: 100000 }),
    body('description').optional({ values: 'falsy' }).isString().isLength({ max: 500 }),
  ],
  validate,
  asyncHandler(async (req: AuthRequest, res) => {
    const ride = await insertRecord<IRide>(Ride, {
      pickup: req.body.pickup,
      destination: req.body.destination,
      vehicleType: req.body.vehicleType,
      departureAt: new Date(req.body.departureAt),
      availableSeats: Number(req.body.availableSeats),
      fare: Number(req.body.fare),
      description: req.body.description?.trim() || undefined,
      status: 'Open',
      driverId: req.user!.id,
    });
    res.status(201).json({ ride: await enrichRide(ride) });
  })
);

router.get('/:rideId/requests', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const ride = await findRecord<IRide>(Ride, req.params.rideId);
  if (!ride) {
    res.status(404).json({ message: 'Ride not found' });
    return;
  }
  if (ride.driverId !== req.user!.id) {
    res.status(403).json({ message: 'Only the driver can view ride requests' });
    return;
  }
  const requests = await findRecords<IRideRequest>(
    RideRequest,
    { rideId: ride._id },
    { createdAt: -1 }
  );
  res.json({ requests: await Promise.all(requests.map(enrichRequest)) });
}));

router.post(
  '/:rideId/requests',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const ride = await findRecord<IRide>(Ride, req.params.rideId);
    if (!ride || ride.status !== 'Open' || ride.departureAt <= new Date()) {
      res.status(404).json({ message: 'This ride is no longer available' });
      return;
    }
    if (ride.driverId === req.user!.id) {
      res.status(400).json({ message: 'You cannot request your own ride' });
      return;
    }
    if (await RideRequest.exists({ rideId: ride._id, passengerId: req.user!.id })) {
      res.status(409).json({ message: 'You have already requested this ride' });
      return;
    }
    let request: IRideRequest;
    try {
      request = await insertRecord<IRideRequest>(RideRequest, {
        rideId: ride._id,
        passengerId: req.user!.id,
        status: 'Pending',
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        res.status(409).json({ message: 'You have already requested this ride' });
        return;
      }
      throw error;
    }
    res.status(201).json({ request });
  })
);

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const ride = await findRecord<IRide>(Ride, req.params.id);
  if (!ride) {
    res.status(404).json({ message: 'Ride not found' });
    return;
  }
  res.json({ ride: await enrichRide(ride) });
}));

export default router;
