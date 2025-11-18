import create from "zustand";
import { devtools } from "zustand/middleware";
import supabase from "../supabase/client";
import { nanoid } from "nanoid";
import { toast } from "react-hot-toast";

/**
 * Cart store:
 * - Guests: persisted in localStorage (key: lms_guest_cart)
 * - Authenticated: stored in Supabase tables 'cart' and 'cart_items'
 *   Schema expectation (simplified):
 *     cart: { id, user_id, created_at, updated_at, status }
 *     cart_items: { id, cart_id, course_id, price, quantity }
 * - Business rule: unique course per cart; quantity = 1 for courses.
 */

const GUEST_CART_KEY = "lms_guest_cart";

function loadGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : { items: [] };
  } catch {
    return { items: [] };
  }
}

function saveGuestCart(cart) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch {
    // ignore
  }
}

async function getOrCreateUserCart(userId) {
  // Get existing cart in 'active' status or create one
  const { data: existing, error: existingErr } = await supabase
    .from("cart")
    .select("id, user_id, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (existingErr) {
    // eslint-disable-next-line no-console
    console.error("Error fetching cart", existingErr);
  }
  if (existing) return existing;

  const { data, error } = await supabase
    .from("cart")
    .insert([{ user_id: userId, status: "active" }])
    .select()
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error creating cart", error);
    throw error;
  }
  return data;
}

const initialState = {
  items: [], // [{ id, courseId, price, quantity }]
  cartId: null, // user cart id if logged in
  userId: null,
  loading: false,
  error: null,
  initialized: false,
};

// PUBLIC_INTERFACE
export const useCartStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      // PUBLIC_INTERFACE
      initGuestCart() {
        /** Initialize cart for guests from localStorage. */
        const guest = loadGuestCart();
        set({ items: guest.items || [], initialized: true });
      },

      // PUBLIC_INTERFACE
      async loadCartForUser(userId) {
        /** Load cart for a logged-in user from Supabase. */
        if (!userId) return;
        set({ loading: true, error: null });
        try {
          const cart = await getOrCreateUserCart(userId);
          const { data: items, error: itemsErr } = await supabase
            .from("cart_items")
            .select("id, course_id, price, quantity")
            .eq("cart_id", cart.id);

          if (itemsErr) throw itemsErr;

          set({
            userId,
            cartId: cart.id,
            items:
              items?.map((i) => ({
                id: i.id,
                courseId: i.course_id,
                price: Number(i.price) || 0,
                quantity: i.quantity || 1,
              })) || [],
            loading: false,
            initialized: true,
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Failed to load user cart", e);
          set({ loading: false, error: e, initialized: true });
        }
      },

      // PUBLIC_INTERFACE
      async mergeGuestCartToUser(userId) {
        /** Merge guest cart items into user's cart, enforcing unique course rule. */
        const guest = loadGuestCart();
        if (!guest.items?.length) {
          set({ userId });
          return;
        }

        try {
          const cart = await getOrCreateUserCart(userId);

          // Fetch current items
          const { data: existingItems, error: itemsErr } = await supabase
            .from("cart_items")
            .select("course_id")
            .eq("cart_id", cart.id);

          if (itemsErr) throw itemsErr;

          const existingSet = new Set(existingItems?.map((i) => i.course_id) || []);

          const toInsert = guest.items
            .filter((g) => !existingSet.has(g.courseId))
            .map((g) => ({
              cart_id: cart.id,
              course_id: g.courseId,
              price: g.price,
              quantity: 1,
            }));

          if (toInsert.length) {
            const { error: insErr } = await supabase.from("cart_items").insert(toInsert);
            if (insErr) throw insErr;
          }

          // Clear guest cart after merge
          saveGuestCart({ items: [] });
          toast.success("Cart items merged from guest session");

          // Reload from backend
          await get().loadCartForUser(userId);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Failed to merge guest cart", e);
          toast.error("Failed to merge cart");
        }
      },

      // PUBLIC_INTERFACE
      async addCourse(courseId, price = 0) {
        /** Add a course to cart; unique per cart, quantity=1. */
        const { userId, cartId, items } = get();
        const exists = items.find((i) => i.courseId === courseId);
        if (exists) {
          toast("Course already in cart");
          return;
        }

        if (!userId) {
          // Guest cart
          const newItem = { id: nanoid(), courseId, price, quantity: 1 };
          const newItems = [...items, newItem];
          set({ items: newItems });
          saveGuestCart({ items: newItems });
          toast.success("Added to cart");
          return;
        }

        try {
          const cid = cartId || (await getOrCreateUserCart(userId)).id;
          const { data, error } = await supabase
            .from("cart_items")
            .insert([{ cart_id: cid, course_id: courseId, price, quantity: 1 }])
            .select()
            .single();
          if (error) throw error;
          set({
            cartId: cid,
            items: [
              ...items,
              {
                id: data.id,
                courseId: data.course_id,
                price: Number(data.price) || 0,
                quantity: data.quantity || 1,
              },
            ],
          });
          toast.success("Added to cart");
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Failed to add course to cart", e);
          toast.error("Failed to add to cart");
        }
      },

      // PUBLIC_INTERFACE
      async removeCourse(courseId) {
        /** Remove a course from the cart. */
        const { userId, cartId, items } = get();
        if (!userId) {
          const newItems = items.filter((i) => i.courseId !== courseId);
          set({ items: newItems });
          saveGuestCart({ items: newItems });
          toast.success("Removed from cart");
          return;
        }
        try {
          // delete by cart_id and course_id
          const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("cart_id", cartId)
            .eq("course_id", courseId);
          if (error) throw error;
          set({ items: items.filter((i) => i.courseId !== courseId) });
          toast.success("Removed from cart");
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Failed to remove item", e);
          toast.error("Failed to remove");
        }
      },

      // PUBLIC_INTERFACE
      async clearCart() {
        /** Clear all items from cart for guest or user. */
        const { userId, cartId } = get();
        if (!userId) {
          set({ items: [] });
          saveGuestCart({ items: [] });
          toast.success("Cart cleared");
          return;
        }
        try {
          const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("cart_id", cartId);
          if (error) throw error;
          set({ items: [] });
          toast.success("Cart cleared");
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Failed to clear cart", e);
          toast.error("Failed to clear cart");
        }
      },
    }),
    { name: "cart-store" }
  )
);

export default useCartStore;
