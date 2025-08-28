import { NextRequest, NextResponse } from 'next/server';

interface MealUpdatePayload {
  user_id: number;
  type_id?: number;
  description?: string;
  date_time?: string;
  items?: Array<{
    item_name: string;
    quantity: number;
    unit_id: number;
  }>;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mealId } = await params;
    const body = await request.json();

    if (!mealId || isNaN(parseInt(mealId))) {
      return NextResponse.json(
        { error: 'ID da refeição inválido' },
        { status: 400 }
      );
    }

    const { user_id, type_id, description, date_time, items } = body as MealUpdatePayload;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    const payload: Partial<MealUpdatePayload> = { user_id };

    if (type_id !== undefined) payload.type_id = type_id;
    if (description !== undefined) payload.description = description;
    if (date_time !== undefined) payload.date_time = date_time;
    if (items !== undefined) payload.items = items;

    const response = await fetch(`${process.env.API_URL}/api/meals/${mealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        message: 'Refeição atualizada com sucesso',
        data: data
      });
    } else {
      return NextResponse.json(
        { error: data.message || 'Erro ao atualizar refeição' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Erro ao atualizar refeição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mealId } = await params;

    if (!mealId || isNaN(parseInt(mealId))) {
      return NextResponse.json(
        { error: 'ID da refeição inválido' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.API_URL}/api/meals/${mealId}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.API_KEY,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: data.message || 'Erro ao buscar refeição' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Erro ao buscar refeição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
