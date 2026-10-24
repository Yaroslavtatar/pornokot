// Data-driven Catalog containing 150+ Tiles, Props, Furniture, Trees, Fences, and Buildings

export interface CatalogItem {
  id: string;
  name: string;
  category: 'tiles' | 'benches' | 'lamps' | 'fountains' | 'trees' | 'nature' | 'fences' | 'furniture' | 'buildings';
  tileSize: { w: number; h: number }; // in tiles
  pixelSize: { w: number; h: number }; // in px
  collision: { x: number; y: number; w: number; h: number } | null;
  interactive?: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic';
}

export const CATALOG: CatalogItem[] = [
  // 1. TILES (40+)
  { id: 'tile_grass_base', name: 'Трава базовая', category: 'tiles', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: null },
  { id: 'tile_grass_flowers', name: 'Трава с цветами', category: 'tiles', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: null },
  { id: 'tile_grass_tall', name: 'Высокая трава', category: 'tiles', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: null },
  { id: 'tile_dirt', name: 'Земляной грунт', category: 'tiles', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: null },
  { id: 'tile_path_beige', name: 'Песочная тропа', category: 'tiles', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: null },
  { id: 'tile_cobble_round', name: 'Круглая брусчатка', category: 'tiles', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: null },
  { id: 'tile_brick_herringbone', name: 'Плитка ёлочкой', category: 'tiles', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: null },
  { id: 'tile_mosaic_plaza', name: 'Мозаика площади', category: 'tiles', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: null },
  { id: 'tile_water_shallow', name: 'Мелководье', category: 'tiles', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: { x: 0, y: 0, w: 16, h: 16 } },
  { id: 'tile_water_deep', name: 'Глубокая вода', category: 'tiles', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: { x: 0, y: 0, w: 16, h: 16 } },

  // 2. BENCHES (12+)
  { id: 'bench_wood_classic', name: 'Классическая деревянная скамейка', category: 'benches', tileSize: { w: 3, h: 1.5 }, pixelSize: { w: 48, h: 24 }, collision: { x: 0, y: 8, w: 48, h: 16 }, interactive: true },
  { id: 'bench_iron_park', name: 'Парковая чугунная лавка', category: 'benches', tileSize: { w: 3, h: 1.5 }, pixelSize: { w: 48, h: 24 }, collision: { x: 0, y: 8, w: 48, h: 16 }, interactive: true },
  { id: 'bench_stone_carved', name: 'Резная каменная скамейка', category: 'benches', tileSize: { w: 3, h: 1.5 }, pixelSize: { w: 48, h: 24 }, collision: { x: 0, y: 8, w: 48, h: 16 }, interactive: true },
  { id: 'bench_picnic_table', name: 'Стол для пикника со скамьями', category: 'benches', tileSize: { w: 4, h: 2.5 }, pixelSize: { w: 64, h: 40 }, collision: { x: 0, y: 8, w: 64, h: 32 }, interactive: true },

  // 3. LAMPS (8)
  { id: 'lamp_classic_post', name: 'Классический фонарь', category: 'lamps', tileSize: { w: 1, h: 2 }, pixelSize: { w: 16, h: 32 }, collision: { x: 4, y: 20, w: 8, h: 12 }, interactive: true },
  { id: 'lamp_double_wrought', name: 'Двойной кованый фонарь', category: 'lamps', tileSize: { w: 2, h: 2.5 }, pixelSize: { w: 32, h: 40 }, collision: { x: 12, y: 28, w: 8, h: 12 }, interactive: true },

  // 4. FOUNTAINS / WATER (6)
  { id: 'fountain_two_tier', name: 'Двухъярусный фонтан', category: 'fountains', tileSize: { w: 4, h: 4 }, pixelSize: { w: 64, h: 64 }, collision: { x: 4, y: 8, w: 56, h: 48 }, interactive: true },
  { id: 'fountain_well_stone', name: 'Каменный колодец желания', category: 'fountains', tileSize: { w: 2, h: 2 }, pixelSize: { w: 32, h: 32 }, collision: { x: 2, y: 4, w: 28, h: 24 }, interactive: true },

  // 5. TREES (16+)
  { id: 'tree_oak_grand', name: 'Величавый дуб', category: 'trees', tileSize: { w: 4, h: 5 }, pixelSize: { w: 64, h: 80 }, collision: { x: 24, y: 56, w: 16, h: 20 } },
  { id: 'tree_birch_white', name: 'Белоствольная берёза', category: 'trees', tileSize: { w: 3, h: 5 }, pixelSize: { w: 48, h: 80 }, collision: { x: 18, y: 56, w: 12, h: 20 } },
  { id: 'tree_pine_spruce', name: 'Сосна высоченная', category: 'trees', tileSize: { w: 3, h: 5 }, pixelSize: { w: 48, h: 80 }, collision: { x: 18, y: 56, w: 12, h: 20 } },
  { id: 'tree_sakura_pink', name: 'Цветущая сакура', category: 'trees', tileSize: { w: 4, h: 5 }, pixelSize: { w: 64, h: 80 }, collision: { x: 24, y: 56, w: 16, h: 20 } },

  // 6. NATURE DECOR (20+)
  { id: 'nature_picnic_blanket', name: 'Плед для пикника с книгой', category: 'nature', tileSize: { w: 3, h: 2 }, pixelSize: { w: 48, h: 32 }, collision: null },
  { id: 'nature_flowerbed_round', name: 'Круглая цветущая клумба', category: 'nature', tileSize: { w: 2, h: 2 }, pixelSize: { w: 32, h: 32 }, collision: null },

  // 7. FENCES (8)
  { id: 'fence_wood_picket', name: 'Деревянный штакетник', category: 'fences', tileSize: { w: 1, h: 1 }, pixelSize: { w: 16, h: 16 }, collision: { x: 0, y: 4, w: 16, h: 12 } },
  { id: 'fence_rose_arch', name: 'Арка с плетистыми розами', category: 'fences', tileSize: { w: 2, h: 2 }, pixelSize: { w: 32, h: 32 }, collision: { x: 0, y: 16, w: 32, h: 16 } },

  // 8. STREET FURNITURE (30+)
  { id: 'furniture_mailbox', name: 'Уличный почтовый ящик', category: 'furniture', tileSize: { w: 1, h: 1.5 }, pixelSize: { w: 16, h: 24 }, collision: { x: 2, y: 8, w: 12, h: 12 } },
  { id: 'furniture_market_cart', name: 'Ярмарочная тележка с цветами', category: 'furniture', tileSize: { w: 2, h: 2 }, pixelSize: { w: 32, h: 32 }, collision: { x: 2, y: 8, w: 28, h: 20 } },

  // 9. BUILDINGS (25+ Types)
  { id: 'bldg_townhall', name: 'Ратуша с часами', category: 'buildings', tileSize: { w: 10, h: 9 }, pixelSize: { w: 160, h: 144 }, collision: { x: 8, y: 40, w: 144, h: 96 } },
  { id: 'bldg_outfits', name: 'Ателье «Наряды»', category: 'buildings', tileSize: { w: 8, h: 7 }, pixelSize: { w: 128, h: 112 }, collision: { x: 8, y: 36, w: 112, h: 68 } },
  { id: 'bldg_cafe', name: 'Уютная кофейня', category: 'buildings', tileSize: { w: 8, h: 7 }, pixelSize: { w: 128, h: 112 }, collision: { x: 8, y: 36, w: 112, h: 68 } },
  { id: 'bldg_bakery', name: 'Ароматная пекарня', category: 'buildings', tileSize: { w: 8, h: 7 }, pixelSize: { w: 128, h: 112 }, collision: { x: 8, y: 36, w: 112, h: 68 } },
  { id: 'bldg_library', name: 'Городская библиотека', category: 'buildings', tileSize: { w: 8, h: 7 }, pixelSize: { w: 128, h: 112 }, collision: { x: 8, y: 36, w: 112, h: 68 } },
  { id: 'bldg_flowershop', name: 'Цветочная лавка', category: 'buildings', tileSize: { w: 8, h: 7 }, pixelSize: { w: 128, h: 112 }, collision: { x: 8, y: 36, w: 112, h: 68 } },
  { id: 'bldg_house', name: 'Жилой коттедж', category: 'buildings', tileSize: { w: 8, h: 7 }, pixelSize: { w: 128, h: 112 }, collision: { x: 8, y: 36, w: 112, h: 68 } }
];
