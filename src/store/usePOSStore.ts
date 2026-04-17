import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Dish {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  available: boolean;
}

export interface CartItem extends Dish {
  quantity: number;
}

interface POSState {
  menu: Dish[];
  cart: CartItem[];
  likedIds: string[];
  history: { id: string, items: CartItem[], total: number, date: string }[];
  sales: { total: number; count: number };
  addToCart: (dish: Dish) => void;
  removeFromCart: (dishId: string) => void;
  updateQuantity: (dishId: string, delta: number) => void;
  toggleLike: (dishId: string) => void;
  clearCart: () => void;
  addDish: (dish: Dish) => void;
  removeDish: (dishId: string) => void;
  updateDish: (dish: Dish) => void;
  checkout: () => void;
  setMenu: (menu: Dish[]) => void;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set) => ({
      menu: [], 
      cart: [],
      likedIds: [],
      history: [],
      sales: { total: 0, count: 0 },
      addToCart: (dish) => set((state) => {
        const existing = state.cart.find((item) => item.id === dish.id);
        if (existing) {
          return {
            cart: state.cart.map((item) =>
              item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          };
        }
        return { cart: [...state.cart, { ...dish, quantity: 1 }] };
      }),
      removeFromCart: (dishId) => set((state) => ({
        cart: state.cart.filter((item) => item.id !== dishId),
      })),
      toggleLike: (dishId) => set((state) => ({
        likedIds: state.likedIds.includes(dishId)
          ? state.likedIds.filter(id => id !== dishId)
          : [...state.likedIds, dishId]
      })),
      updateQuantity: (dishId, delta) => set((state) => ({
        cart: state.cart.map((item) =>
          item.id === dishId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ),
      })),
      clearCart: () => set({ cart: [] }),
      addDish: (dish) => set((state) => ({ menu: [...state.menu, dish] })),
      removeDish: (dishId) => set((state) => ({ menu: state.menu.filter(d => d.id !== dishId) })),
      updateDish: (dish) => set((state) => ({
        menu: state.menu.map(d => d.id === dish.id ? dish : d)
      })),
      checkout: () => set((state) => {
        const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.05;
        const total = subtotal + tax;
        const newOrder = {
            id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            items: [...state.cart],
            total,
            date: new Date().toLocaleString()
        };
        return {
          sales: {
            total: state.sales.total + total,
            count: state.sales.count + 1
          },
          history: [newOrder, ...state.history],
          cart: []
        };
      }),
      setMenu: (menu) => set({ menu }),
    }),
    {
      name: 'pos-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
