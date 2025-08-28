export interface MealItem {
  item_name: string;
  quantity: number;
  unit_id: number;
}

export interface MealFormData {
  user_id: number;
  type_id: number;
  description: string;
  date_time: string;
  items: MealItem[];
}

export interface MealType {
  id: number;
  name: string;
}

export interface Unit {
  id: number;
  name: string;
  abbreviation: string;
}

export interface CreateMealRequest {
  user_id: number;
  type_id: number;
  description: string;
  date_time: string;
  items: MealItem[];
}

export interface CreateMealResponse {
  message: string;
  meal_id?: number;
  success: boolean;
}
