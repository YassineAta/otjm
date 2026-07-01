import { NextRequest, NextResponse } from 'next/server'
// exceljs replaces the unmaintained `xlsx` npm package (prototype-pollution
// CVEs, registry version frozen pre-fix — docs/SECURITY_REVIEW.md S8).
import ExcelJS from 'exceljs'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

import { tierForMemberStatus, priceForMemberStatus } from '@/lib/constants'
import { encryptField } from '@/lib/crypto'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const formData = await request.formData()
    const file = formData.get('bulkFile') as File | null

    if (!file) {
      return NextResponse.json({ message: 'No file found.' }, { status: 400 })
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())
    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return NextResponse.json({ message: 'No worksheet found in file.' }, { status: 400 })
    }

    // Row 1 = headers; map each later row to { header: cellText }.
    // cell.text flattens rich-text/hyperlink cells (emails are often
    // hyperlinks in real spreadsheets); Date cells keep their Date value.
    const headers: string[] = []
    worksheet.getRow(1).eachCell((cell, col) => {
      headers[col] = cell.text.trim()
    })
    const rawJsonData: any[] = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const obj: Record<string, unknown> = {}
      row.eachCell((cell, col) => {
        const key = headers[col]
        if (!key) return
        obj[key] = cell.value instanceof Date ? cell.value : cell.text.trim()
      })
      if (Object.keys(obj).length) rawJsonData.push(obj)
    })

    if (rawJsonData.length === 0) {
      return NextResponse.json(
        { message: 'File is empty or data could not be parsed.' },
        { status: 400 },
      )
    }

    // --- PROCESSING AND DATABASE INSERTION ---
    const membersToCreate: any[] = []
    const emailsToValidate = rawJsonData.map((row) => row.email?.toLowerCase()).filter(Boolean)

    // CORRECTION 1: Fetch existing members only from the Membership table
    const existingMembers = await db.membership.findMany({
      where: { email: { in: emailsToValidate } },
      select: { email: true },
    })
    const existingEmails = new Set(existingMembers.map((m) => m.email))

    const now = new Date()
    const endDate = new Date(now)
    endDate.setFullYear(now.getFullYear() + 1)

    for (const row of rawJsonData) {
      const email = row.email?.toLowerCase()

      if (!email || existingEmails.has(email) || !row.fullName || !row.memberStatus) {
        // Skip rows with missing required data or duplicate emails
        continue
      }

      const memberStatus = row.memberStatus
      const paymentStatus = row.paymentStatus || 'pending'

      const price = priceForMemberStatus(memberStatus)
      const tier = tierForMemberStatus(memberStatus)

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
        cin: encryptField(row.cin?.toString()),
        phone: encryptField(row.phone?.toString()),
        dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
      })
    }

    if (membersToCreate.length === 0) {
      return NextResponse.json(
        { message: 'No valid records found for insertion or all records already exist.', count: 0 },
        { status: 200 },
      )
    }

    // One batched insert instead of N parallel creates — one DB roundtrip,
    // no partial-failure interleaving with other writers.
    await db.membership.createMany({ data: membersToCreate })

    return NextResponse.json(
      {
        message: 'Bulk import successful.',
        count: membersToCreate.length,
        fileName: file.name,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      { message: 'An internal server error occurred during file processing.' },
      { status: 500 },
    )
  }
}
