import { randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { initializeApi } from '../../../../server/src/index';
import { insertRecord, toRecord } from '../../../../server/src/db/records';
import { User } from '../../../../server/src/models/index';
import type { IUser } from '../../../../server/src/types/index';
import { hashPassword, signToken, toPublicUser } from '../../../../server/src/utils/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SocialAuthBody {
  email?: unknown;
  name?: unknown;
  avatar?: unknown;
  provider?: unknown;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    await initializeApi();
  } catch (error) {
    console.error('[TaskAnt Social Auth initialization]', error);
    return Response.json(
      { message: 'TaskAnt API configuration is incomplete or its database is unavailable.' },
      { status: 503 }
    );
  }

  let body: SocialAuthBody;
  try {
    body = (await request.json()) as SocialAuthBody;
  } catch {
    return Response.json({ message: 'Invalid JSON request body' }, { status: 400 });
  }

  const normalizedEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return Response.json({ message: 'A valid email is required' }, { status: 400 });
  }

  const displayName =
    typeof body.name === 'string' && body.name.trim()
      ? body.name.trim()
      : normalizedEmail.split('@')[0] || 'TaskAnt User';
  const avatar =
    typeof body.avatar === 'string' && body.avatar.trim() ? body.avatar.trim() : undefined;

  try {
    const existing = await User.findOne({ email: normalizedEmail }).lean().exec();
    let record: IUser;

    if (existing) {
      record = toRecord<IUser>(existing);
      if (record.isSuspended) {
        return Response.json({ message: 'Your account has been suspended' }, { status: 403 });
      }
      if (avatar && !record.profilePhoto) {
        await User.updateOne({ _id: record._id }, { $set: { profilePhoto: avatar } }).exec();
        record = { ...record, profilePhoto: avatar };
      }
    } else {
      const randomSecret = randomBytes(32).toString('hex');
      try {
        record = await insertRecord<IUser>(User, {
          fullName: displayName,
          email: normalizedEmail,
          phone: 'Not provided',
          password: await hashPassword(randomSecret),
          location: 'Bangladesh',
          ...(avatar ? { profilePhoto: avatar } : {}),
          role: 'user',
          verificationStatus: 'Unverified',
          rating: 0,
          reviewCount: 0,
          completedTasks: 0,
          postedTasks: 0,
          isSuspended: false,
        });
      } catch (error) {
        if ((error as { code?: number }).code === 11000) {
          const raceUser = await User.findOne({ email: normalizedEmail }).lean().exec();
          if (!raceUser) throw error;
          record = toRecord<IUser>(raceUser);
          if (record.isSuspended) {
            return Response.json({ message: 'Your account has been suspended' }, { status: 403 });
          }
        } else {
          throw error;
        }
      }
    }

    const token = signToken(record._id, record.role, record.tokenVersion ?? 0);
    return Response.json({ token, user: toPublicUser(record, true) }, { status: 200 });
  } catch (error) {
    console.error('[TaskAnt Social Auth]', error);
    return Response.json({ message: 'Unable to complete social sign-in' }, { status: 500 });
  }
}
