import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ValidatedTransaction } from '@/domain/csv-import';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactions } = body as { transactions: ValidatedTransaction[] };

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Aucune transaction à importer' },
        { status: 400 }
      );
    }

    // Insert transactions in database
    const created = await prisma.transaction.createMany({
      data: transactions.map((t) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        categoryId: null, // No category assigned by default
      })),
    });

    return NextResponse.json({
      success: true,
      count: created.count,
    });
  } catch (error) {
    console.error('Error importing transactions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'importation des transactions' },
      { status: 500 }
    );
  }
}
