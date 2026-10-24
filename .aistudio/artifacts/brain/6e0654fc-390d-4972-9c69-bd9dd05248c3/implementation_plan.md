# Coherent Biome World Generation & Accurate Collision Engine

Enhance world generation with structured natural biomes, smooth transitions, and rich decorative props (fences, reeds, bridges), paired with a precise pixel-grid collision system for cat movement.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions were confirmed during interactive clarification:

- **Biome & World Layout**: Natural biomes with a cozy town square at the center surrounded by dense forest, lake/wetland zones with wooden bridges, and flower meadows.
- **Collision Mechanics**: Accurate physics—buildings, trees, lamp posts, fences, and open water bodies are impassable, with smooth axis-sliding along walls.
- **Decorations & Props**: Added wooden fences, reeds/cattails near lake edges, wooden bridges crossing streams, and rich flower beds.

---

## 1. Overview & Core Concept

Currently, procedural chunks place props and terrain tiles with simple independent noise, leading to scattered tiles and lack of cohesive structure.

This update introduces:
1. **Coherent Biome Engine (`procedural.ts`)**: A multi-layered generator using macro-distance rings and Perlin/Simplex noise to construct structured biomes (Central Town, Dense Forest, Lake & Wetland, Wild Flower Meadow).
2. **Comprehensive Props & Decoration Set**: Wooden fences, shoreline reeds, wooden bridges across rivers/lakes, and flowerbed borders.
3. **Precise Physics & Collision Engine (`collision.ts`)**: Bounding-box and circle-collision geometry for all props and water tiles, with dual-axis sliding resolution so cats move naturally without clipping into structures.

---

## 2. Technical Architecture & System Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Client Engine                       │
├───────────────────────────┬─────────────────────────────┤
│   Procedural Biome Gen    │    Collision System         │
│   - Ring 0: Central Town  │    - Water/Tile Bounds      │
│   - Ring 1: Flower Meadow │    - Building Foot-boxes    │
│   - Ring 2: Lake & Reeds  │    - Tree Trunk Radia       │
│   - Ring 3: Deep Forest   │    - Axis-Sliding Resolution │
└─────────────┬─────────────┴──────────────┬──────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│    Scene Canvas Render    │  │    Server Authoritative   │
│ - Terrain, Bridges, Reeds │  │  Movement Validation      │
│ - Props, Fences, Halos    │  │  - Position Sync & State │
└───────────────────────────┘  └───────────────────────────┘
```

---

## 3. Key Components & Implementation Steps

### A. Coherent Biome Procedural Generator (`procedural.ts`)
- **Macro-Layer Biomes**:
  - **Center (Radius < 300px)**: Central Plaza with Town Hall, Bakery, Cafe, Library, Outfits, Flowershop, Fountain, and brick paths.
  - **Lake Zone**: Cohesive water bodies surrounded by wetland grass, shoreline reeds, and wooden bridges spanning water channels.
  - **Forest Zone**: Clusters of oak trees, log fences, and dense grass noise.
  - **Meadow Zone**: Open grassy fields with vibrant flowerbed patches.
- **New Tile & Prop Types**:
  - `reeds`: Cattails and reeds placed adjacent to water tiles.
  - `fence`: Wooden fences framing town borders and pathways.
  - `bridge`: Wooden plank bridges connecting land across water tiles.

### B. Accurate Collision Engine (`collision.ts` & `server.ts`)
- **Collision Shapes**:
  - **Buildings**: Exact rectangular foot-box bounds based on building dimensions (e.g., `w: 128`, `h: 48`).
  - **Trees**: Circular trunk base collision (`radius: 12px`, centered at tree origin).
  - **Lamp Posts & Benches**: Compact bounding boxes (`w: 12`, `h: 12`).
  - **Fences**: Rectangular barrier hitboxes (`w: 16`, `h: 8`).
  - **Water Tiles**: Tile-grid collision box (`16x16px` per tile), unless overridden by a `bridge` prop/tile.
- **Smooth Axis-Sliding Movement**:
  - Test movement vector `(dx, dy)` separately along X-axis then Y-axis.
  - If X movement collides with an object, cancel X velocity while retaining Y velocity, allowing cats to smoothly slide along building walls and fences.

### C. Visual Sprite Enhancements (`sprites.ts` & `scene.ts`)
- **Sprite Generators**:
  - Draw pixel-art wooden fences (horizontal and vertical rail segments).
  - Draw water reeds / cattails at shorelines.
  - Draw wooden bridge planks with edge railings.
- **Scene Renderer Integration**:
  - Pass collision debug/visual boundaries if needed.
  - Y-sort new props (fences, reeds, bridges) seamlessly alongside cats, trees, and buildings.

---

## 4. Verification Plan

1. **Compilation & Linting**:
   - Execute `compile_applet` and `lint_applet` to confirm zero TypeScript errors.
2. **Visual Inspection**:
   - Inspect the central town square, surrounding biomes, rivers with bridges, and fences via browser preview.
3. **Collision Testing**:
   - Walk the cat into buildings, trees, fences, and water to verify strict collision blocking and smooth wall-sliding.
