import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

const parseDate = (dateString: any, isRequired: boolean = true) => {
    if (!dateString) {
        if (isRequired) throw new Error('Date field is required.');
        return null;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format for: ${dateString}`);
    }
    return date;
};

export async function POST(request: NextRequest) {
    const limited = checkRateLimit(request, { limit: 5, windowSeconds: 60 })
    if (limited) return limited
    let data;
    try {
        data = await request.json();
    } catch (e) {
        return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    const {
        fullName, cin, dateOfBirth, email, phone, faculty,
        memberStatus, price, paymentStatus, startDate, endDate, paymentMethod, tier
    } = data;

    if (!fullName || !email || !memberStatus || price === undefined || !startDate || !endDate) {
        return NextResponse.json({
            message: "Champs essentiels manquants pour la création.",
        }, { status: 400 });
    }

    // Checking for existing member by unique email in Membership table
    const existingMembership = await db.membership.findUnique({
        where: { email },
        select: { id: true }
    });

    if (existingMembership) {
        return NextResponse.json({
            message: "Un membre avec cet email existe déjà.",
            email: email
        }, { status: 409 });
    }

    try {
        const newMembership = await db.membership.create({
            data: {
                // Identity fields stored directly in Membership
                email: email,
                name: fullName,

                tier: tier,
                status: paymentStatus === 'paid' ? 'active' : 'pending',
                paymentStatus: paymentStatus,
                paymentMethod: paymentMethod,
                price: price,

                startDate: parseDate(startDate)!,
                endDate: parseDate(endDate)!,

                memberStatus: memberStatus,
                faculty: faculty,
                cin: cin,
                phone: phone,
                dateOfBirth: parseDate(dateOfBirth, false),
            }
        });

        return NextResponse.json({
            message: "Membre créé avec succès (Membership only).",
            memberId: newMembership.id
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json(
            { error: "Échec de l'opération de base de données lors de la création du membre." },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    let where: any = {}
    if (email) {
      where.email = email
    }

    // FIX: Removed the inclusion of the 'user' relationship which no longer exists.
    const memberships = await db.membership.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(memberships)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch memberships' },
      { status: 500 }
    )
  }
}