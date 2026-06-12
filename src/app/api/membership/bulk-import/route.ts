import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { Readable } from 'stream';

import { tierForMemberStatus, priceForMemberStatus } from '@/lib/constants';

export async function POST(request: NextRequest) {
    const auth = await requireAdmin()
    if (auth.error) return auth.error
    try {
        const formData = await request.formData();
        const file = formData.get('bulkFile') as File | null;

        if (!file) {
            return NextResponse.json({ message: 'No file found.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJsonData.length === 0) {
            return NextResponse.json({ message: 'File is empty or data could not be parsed.' }, { status: 400 });
        }

        // --- PROCESSING AND DATABASE INSERTION ---
        const membersToCreate: any[] = [];
        const emailsToValidate = rawJsonData.map(row => row.email?.toLowerCase()).filter(Boolean);

        // CORRECTION 1: Fetch existing members only from the Membership table
        const existingMembers = await db.membership.findMany({
            where: { email: { in: emailsToValidate } },
            select: { email: true }
        });
        const existingEmails = new Set(existingMembers.map(m => m.email));

        const now = new Date();
        const endDate = new Date(now);
        endDate.setFullYear(now.getFullYear() + 1);

        for (const row of rawJsonData) {
            const email = row.email?.toLowerCase();

            if (!email || existingEmails.has(email) || !row.fullName || !row.memberStatus) {
                // Skip rows with missing required data or duplicate emails
                continue;
            }

            const memberStatus = row.memberStatus;
            const paymentStatus = row.paymentStatus || 'pending';

            const price = priceForMemberStatus(memberStatus);
            const tier = tierForMemberStatus(memberStatus);

            membersToCreate.push({
                // CORRECTION 2: Tous les champs d'identité sont maintenant des champs de Membership
                name: row.fullName,
                email: email,

                // Membership Data
                tier: tier,
                status: paymentStatus === 'paid' ? 'active' : 'pending',
                paymentStatus: paymentStatus,
                price: price,
                paymentMethod: 'Import/Bulk',
                startDate: now,
                endDate: endDate,

                // Detailed Form Data
                memberStatus: memberStatus,
                faculty: row.faculty || null,
                cin: row.cin?.toString() || null,
                phone: row.phone?.toString() || null,
                dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
            });
        }

        if (membersToCreate.length === 0) {
            return NextResponse.json({ message: 'No valid records found for insertion or all records already exist.', count: 0 }, { status: 200 });
        }

        // One batched insert instead of N parallel creates — one DB roundtrip,
        // no partial-failure interleaving with other writers.
        await db.membership.createMany({ data: membersToCreate });

        return NextResponse.json({
            message: 'Bulk import successful.',
            count: membersToCreate.length,
            fileName: file.name
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { message: 'An internal server error occurred during file processing.' },
            { status: 500 }
        );
    }
}