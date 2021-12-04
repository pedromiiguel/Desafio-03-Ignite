import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCard = [...cart];

      const existProduct = updatedCard.find(
        (product) => product.id === productId
      );

      const stock = await api.get<Stock>(`/stock/${productId}`);
      const amount = existProduct ? existProduct.amount + 1 : 1;

      if (stock.data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (existProduct) {
        existProduct.amount = existProduct.amount + 1;
        setCart(updatedCard);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCard));
      } else {
        const product = await api.get<Product>(`/products/${productId}`);
        const newProduct = { ...product.data, amount: amount };

        setCart([...updatedCard, newProduct]);

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify([...updatedCard, newProduct])
        );
      }
    } catch (err) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCard = [...cart];

      const existProduct = updatedCard.find(
        (product) => product.id === productId
      );

      if (!existProduct) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const newCart = cart.filter((product) => product.id !== productId);

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const stock = await api.get<Stock>(`/stock/${productId}`);

      if (stock.data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCard = [...cart];

      const existProduct = updatedCard.find(
        (product) => product.id === productId
      );

      if (existProduct) existProduct.amount = amount;

      setCart(updatedCard);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCard));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
