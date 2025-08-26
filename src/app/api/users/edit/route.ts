import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const API_URL = process.env.API_URL;
    const API_KEY = process.env.API_KEY;

    if (!API_URL || !API_KEY) {
      return NextResponse.json(
        { error: 'Configuração da API não encontrada' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/api/users/edit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Erro ao editar usuário' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro ao editar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
