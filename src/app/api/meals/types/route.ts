import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Tipos de refeição baseados no que você mencionou
    const mealTypes = [
      { id: 1, name: 'Café da manhã' },
      { id: 2, name: 'Lanche da manhã' },
      { id: 3, name: 'Almoço' },
      { id: 4, name: 'Lanche da tarde' },
      { id: 5, name: 'Jantar' },
      { id: 6, name: 'Ceia' },
      { id: 7, name: 'Snack (Lanche rápido)' }
    ];

    return NextResponse.json(mealTypes);
  } catch (error) {
    console.error('Erro ao buscar tipos de refeição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
