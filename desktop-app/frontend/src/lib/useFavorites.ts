import { useState, useEffect } from "react";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ahnara_guest_favorites");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load favorites", e);
    }
  }, []);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setFavorites(prev => {
      const newFavs = prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id];
        
      try {
        localStorage.setItem("ahnara_guest_favorites", JSON.stringify(newFavs));
      } catch (err) {
        console.error("Failed to save favorites", err);
      }
      
      return newFavs;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite };
}
