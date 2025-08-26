import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API_URL = process.env.API_URL;
    const API_KEY = process.env.API_KEY;

    if (!API_URL || !API_KEY) {
      return NextResponse.json(
        { error: 'Configuração da API não encontrada' },
        { status: 500 }
      );
    }

    const response = await fetch(`${API_URL}/api/meals/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
