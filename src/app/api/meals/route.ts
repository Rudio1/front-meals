import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, type_id, description, date_time, items } = body;

    if (!user_id || !type_id || !description || !date_time || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      );
    }

    if (!items.every((item: { item_name: string; quantity: number; unit_id: number }) => item.item_name && item.quantity > 0 && item.unit_id)) {
      return NextResponse.json(
        { error: 'Todos os itens devem ter nome, quantidade e unidade válidos' },
        { status: 400 }
      );
    }

    const API_URL = process.env.API_URL;
    const API_KEY = process.env.API_KEY;

    if (!API_URL || !API_KEY) {
      return NextResponse.json(
        { error: 'Configuração da API não encontrada' },
        { status: 500 }
      );
    }

    // Enviar para o backend
    const response = await fetch(`${API_URL}/api/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        user_id,
        type_id,
        description,
        date_time,
        items
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro na API: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro ao criar refeição:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
