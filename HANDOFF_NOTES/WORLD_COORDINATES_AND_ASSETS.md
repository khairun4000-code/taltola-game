# World Coordinates, Controls & Asset Reference Notes

## 1. World Spatial Map (Three.js Coordinates, 1 unit = 1 meter)
- **Main Street Axis:** Runs North-South along `Z` (`z = -42` to `+42`), centered at `x = 0` (`road width = 4.2m`, `x ∈ [-2.1, +2.1]`).
- **5-Story Taltola House (`src/house.js`):**
  - Compound & courtyard: `x ∈ [2.48, 21.5]`, `z ∈ [-7.28, +7.28]`
  - Building footprint: `x ∈ [6.08, 14.28]`, `z ∈ [-5.36, +5.36]`
  - 5 Floors + Rooftop: `y = 0, 3.05, 6.10, 9.15, 12.20, 15.25` (10 flats: `1A/1B` .. `5A/5B`)
  - Stairwell: `x ∈ [7.75, 12.05]`, `z ∈ [0.16, 1.16]`
- **Haji Mohsin Road Block (`src/haji-mohsin-road.js`):**
  - Location reference: `22.8075089° N, 89.5692802° E` (Haji Mohsin Road, Tootpara, Khulna)
  - Red-brick sidewalks: East `x ∈ [2.08, 3.28]`, West `x ∈ [-3.28, -2.08]`
  - East Planter + Sago Palms + Pine Tree: `z ∈ [7.4, 11.2]`
  - East 4 Corrugated Shutter Shops (3rd half-open): `z ∈ [11.3, 20.6]`
  - East `AVIJIT'S SPECIAL BATCH (ASB)` Open Compound & Gate: `x ∈ [3.2, 14.5]`, `z ∈ [20.7, 26.8]`
  - East Milk Vita Shop Strip: `z ∈ [27.0, 37.5]`
  - West Weathered Wall + `MCSK` & `SHETU'S SPECIAL` Poles: `x = -3.12`, `z ∈ [-10.0, 10.2]`
  - Parked Blue Motorcycle: `(-2.52, 0.08, 18.2)` | Static Cycle Rickshaw: `(-0.95, 0, 13.0)`
- **Fakir Bari Lane (Walkable & Drivable Side Alley):**
  - `x ∈ [-42.0, -2.1]`, `z ∈ [10.2, 14.25]`
- **SK Arshan Alif 10-Story Tower (`src/sk-arshan-tower.js`):**
  - Footprint: `x ∈ [-19.85, -2.85]`, `z ∈ [14.25, 28.6]`
  - Floor heights: `L(k) = k === 0 ? 0.50 : 4.0 + (k - 1) * 3.0` (`k = 0..10`, rooftop at `y = 31.0`)
  - 3D Elevator Shaft: `x ∈ [-13.38, -11.55]`, `z ∈ [18.70, 20.40]`
  - Car Parking Ramp Entrance: `z ∈ [19.15, 22.95]`

## 2. BMW M3/M4 Competition GLB Asset Notes (`public/assets/bmw_m3.glb`)
- **Origin:** Copied from `/Users/student/.gemini/antigravity/scratch/shutoko-car-sim/models/bmw_m3.glb` (standard GLB, no Draco/Meshopt extensions).
- **Scaled Length:** `4.35m` (matches `1.76m` player height & Khulna road width).
- **Spawn Point:** `(-0.35, 0.01, 4.8)`, `heading = 0` (facing `+Z` down Haji Mohsin Road).
- **Key Material Names inside `bmw_m3.glb`:**
  - Body paint: `Mesheszx1Mtl`, `Meshesbody151Mtl`, `Mesheslivery1Mtl`
  - Wheels parent node: `WHeelsandrims_2`
  - Wheel rims: `Meshesm8rim1Mtl` | Tires: `Meshesm8rim0011Mtl` | Brake calipers: `Caliper1Mtl`
  - Yellow DRLs: `Meshesled111Mtl` | Taillights: `Meshesredlight1Mtl`, `Meshestail71Mtl` | Windows: `Mesheswindows1Mtl`

## 3. All Active Keybindings
- **Walking:** `WASD / Arrows` Move · `Shift / R / Double-W` Sprint · `Space` Jump · `E / F` Doors / Sit / Enter BMW · `G` Toggle All Doors · `L` Elevator Keypad · `V` Camera (`Back / Face / 1st`) · `P / 1-6` Emotes · `X / C / Click` Attack
- **Driving BMW M3:** `T` Enter/Exit BMW anywhere · `W/S` Gas/Brake/Reverse · `A/D` Steer · `Shift` Boost · `Space` Handbrake Drift · `C` Cycle 6 Paint Colors · `H` Horn · `V` Car Camera (`Chase / Hood / Front`) · `E / F / T` Exit Car
