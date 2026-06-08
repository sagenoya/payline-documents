import type { CompanyRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canUpload } from '@/lib/dms';
import { canViewActivity, getExpectedRole, isAdmin } from '@/server/access-control';
import { onboardingSchema } from '@/lib/validations/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function GET() {
  try {
    const user = await requireClerkUser();

    return jsonOk({
      ...user,
      canUpload: canUpload(user.profile?.companyRole),
      canViewActivity: canViewActivity(user.email),
      isAdmin: isAdmin(user.email),
    });
  } catch (error) {
    console.error('Profile lookup failed', error);
    if (error instanceof Response) return error;
    return jsonError('Profile is temporarily unavailable. Please try again.', 503);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireClerkUser();
    const payload = await request.json();
    const parsed = onboardingSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid role', 422);
    }

    const expectedRole = getExpectedRole(user.email);
    if (expectedRole && expectedRole !== parsed.data.companyRole) {
      return jsonError('That role doesn’t match your account. Please select your correct role.', 422);
    }

    const [profile] = await withDbTimeout(
      prisma.$transaction([
        prisma.profile.upsert({
          where: { userId: user.id },
          update: { companyRole: parsed.data.companyRole as CompanyRole },
          create: {
            userId: user.id,
            companyRole: parsed.data.companyRole as CompanyRole,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { onboarded: true },
        }),
      ]),
    );

    return jsonOk({
      profile,
      canUpload: canUpload(profile.companyRole),
    });
  } catch (error) {
    console.error('Onboarding profile update failed', error);

    if (error instanceof Response) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unable to complete onboarding';

    if (
      message.includes('column') ||
      message.includes('does not exist') ||
      message.includes('table') ||
      message.includes('relation')
    ) {
      return jsonError(
        'Database schema is not up to date. Run `npx prisma db push` with the active Neon DATABASE_URL, then try onboarding again.',
        500,
      );
    }

    return jsonError(message, 500);
  }
}
