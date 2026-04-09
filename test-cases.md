# LoopLab — Test Data for New Run Experiments

> Realistic experiment inputs to test the application with diverse materials science scenarios.  
> Copy-paste these into the "New Run" modal to exercise different pipeline behaviors.

---

## 1. EV Battery Thermal Management

**Objective:**  
Find polymer composite with thermal conductivity > 2.5 W/mK for EV battery pack thermal interface material

**Parameters:**


| Name           | Value |
| -------------- | ----- |
| temperature    | 220   |
| pressure       | 1.8   |
| filler_loading | 45    |
| particle_size  | 0.5   |


**Constraints:**  
cost_per_kg < 80, non_toxic = true, electrically_insulating = true

**Why this is useful:** Standard mid-range values. No warnings expected from parameter validation (temperature <= 250).

---

## 2. High-Temperature Aerospace Coating

**Objective:**  
Develop ceramic coating material that maintains structural integrity above 1200°C for turbine blade application

**Parameters:**


| Name           | Value |
| -------------- | ----- |
| temperature    | 350   |
| sintering_time | 4.5   |
| oxide_ratio    | 0.72  |
| porosity       | 12    |


**Constraints:**  
thermal_shock_resistance > 500, weight_per_m2 < 3.5, oxidation_resistant = true

**Why this is useful:** Temperature = 350 triggers the "> 250" warning in Parameter Validation step. Tests warning display in the UI.

---

## 3. Lightweight Automotive Structural Alloy

**Objective:**  
Optimize aluminum-magnesium alloy composition for maximum tensile strength while keeping density below 2.8 g/cm³

**Parameters:**


| Name              | Value |
| ----------------- | ----- |
| temperature       | 180   |
| magnesium_content | 5.2   |
| silicon_content   | 0.8   |
| aging_time        | 6     |
| quench_rate       | 45    |


**Constraints:**  
density < 2.8, elongation > 8, corrosion_resistance = moderate

**Why this is useful:** 5 parameters — tests the UI with a larger parameter set and the AI suggestion with more variables to reason about.

---

## 4. Biodegradable Packaging Film

**Objective:**  
Create PLA-based biodegradable film with sufficient tensile strength for food packaging that degrades within 90 days

**Parameters:**


| Name            | Value |
| --------------- | ----- |
| temperature     | 165   |
| plasticizer_pct | 15    |
| thickness_um    | 25    |


**Constraints:**  
biodegradable_days < 90, food_safe = true, moisture_barrier > 0.7

**Why this is useful:** Low temperature, few parameters. Clean run with no warnings. Tests how AI reasons about sustainability/bio constraints.

---

## 5. Superconductor Thin Film

**Objective:**  
Optimize YBCO thin film deposition parameters for highest critical current density at 77K liquid nitrogen temperature

**Parameters:**


| Name            | Value |
| --------------- | ----- |
| temperature     | 780   |
| oxygen_pressure | 0.3   |
| deposition_rate | 2.1   |
| substrate_temp  | 700   |
| annealing_time  | 1.5   |


**Constraints:**  
critical_current > 1e6, film_uniformity > 95, substrate = SrTiO3

**Why this is useful:** Very high temperature values (780, 700) — both trigger the > 250 warning. Tests warning with multiple high-temperature parameters and scientific edge case for AI.

---

## 6. Solar Cell Perovskite Layer

**Objective:**  
Maximize power conversion efficiency of methylammonium lead iodide perovskite solar cell above 22%

**Parameters:**


| Name                    | Value |
| ----------------------- | ----- |
| temperature             | 100   |
| spin_speed              | 4000  |
| precursor_concentration | 1.2   |
| annealing_temp          | 100   |


**Constraints:**  
efficiency > 22, stability_hours > 1000, lead_free_preferred = true

**Why this is useful:** Mix of small (1.2) and large (4000) parameter values. Tests how the UI renders wide numeric ranges and how AI handles them.

---

## 7. 3D Printing Metal Powder

**Objective:**  
Find optimal SLM process parameters for Ti-6Al-4V to minimize porosity and maximize fatigue life

**Parameters:**


| Name            | Value |
| --------------- | ----- |
| temperature     | 250   |
| laser_power     | 280   |
| scan_speed      | 1200  |
| layer_thickness | 0.03  |
| hatch_spacing   | 0.1   |
| powder_size     | 35    |


**Constraints:**  
porosity < 0.5, surface_roughness < 10, relative_density > 99.5

**Why this is useful:** 6 parameters — the most in this set. Tests form scrolling, parameter chips in experiment view, and AI reasoning over many variables. Temperature at exactly 250 (boundary — no warning since condition is > 250).

---

## 8. Flexible Electronics Substrate

**Objective:**  
Develop transparent conductive film on PET substrate with sheet resistance below 50 ohm/sq for foldable displays

**Parameters:**


| Name           | Value |
| -------------- | ----- |
| temperature    | 150   |
| coating_cycles | 3     |
| concentration  | 0.8   |


**Constraints:**  
transparency > 90, flexibility_radius < 5mm, sheet_resistance < 50

**Why this is useful:** Only 3 parameters with one being an integer (3). Minimal input — tests the simplest realistic scenario.

---

## 9. Concrete Self-Healing Additive

**Objective:**  
Optimize microcapsule-based self-healing concrete that recovers 85% flexural strength after cracking

**Parameters:**


| Name               | Value |
| ------------------ | ----- |
| temperature        | 23    |
| capsule_diameter   | 200   |
| capsule_loading    | 5     |
| water_cement_ratio | 0.45  |
| curing_days        | 28    |


**Constraints:**  
strength_recovery > 85, compressive_strength > 30, cost_increase < 15

**Why this is useful:** Very low temperature (room temp, 23°C). Mix of integers and decimals. Realistic civil engineering scenario — different domain from electronics/energy.

---

## 10. Drug Delivery Nanoparticle

**Objective:**  
Engineer PLGA nanoparticle formulation for sustained release of doxorubicin with 72-hour release profile targeting tumors

**Parameters:**


| Name            | Value |
| --------------- | ----- |
| temperature     | 37    |
| polymer_mw      | 45000 |
| drug_loading    | 8.5   |
| surfactant_pct  | 1.2   |
| sonication_time | 5     |


**Constraints:**  
particle_size < 200nm, encapsulation_efficiency > 75, release_hours > 72, biocompatible = true

**Why this is useful:** Extremely large parameter value (polymer_mw = 45000). Tests numeric rendering and AI interpretation. Biomedical domain — diverse from other test cases. 4 constraints tests multi-constraint handling.

---

## 11. Single Parameter — Minimal Input

**Objective:**  
Test thermal conductivity at a single temperature point

**Parameters:**


| Name        | Value |
| ----------- | ----- |
| temperature | 200   |


**Constraints:**  
*(leave empty)*

**Why this is useful:** Minimum viable input — 1 parameter, no constraints. Tests that the app handles the simplest case. Also tests empty constraint string parsing.

---

## 12. Edge Case — Zero and Negative Values

**Objective:**  
Investigate cryogenic material behavior at sub-zero temperatures for liquid hydrogen storage tank liner

**Parameters:**


| Name              | Value |
| ----------------- | ----- |
| temperature       | -253  |
| strain_rate       | 0.001 |
| hydrogen_pressure | 0     |
| wall_thickness    | 4.5   |


**Constraints:**  
brittle_fracture = false, permeability < 1e-12

**Why this is useful:** Negative temperature (-253), zero value (0), very small decimal (0.001). Tests how the pipeline, UI, and AI handle zero/negative numbers.

---

## 13. Edge Case — Very Long Goal Description

**Objective:**  
Develop a multi-layer functionally graded material system combining a high-hardness boron carbide ceramic strike face with an ultra-high molecular weight polyethylene backing layer and an intermediate aluminum oxide transition zone, optimized for maximum ballistic protection against 7.62mm NATO rounds while maintaining total areal density below 25 kg per square meter and ensuring the system remains field-repairable using standard military adhesive bonding techniques at temperatures between -40C and 60C

**Parameters:**


| Name              | Value |
| ----------------- | ----- |
| temperature       | 200   |
| ceramic_thickness | 8     |
| backing_thickness | 12    |


**Constraints:**  
areal_density < 25, v50_velocity > 850

**Why this is useful:** Very long goal (~500 characters). Tests text truncation in dashboard cards, experiment view header, toast notifications, and AI prompt handling.

---

## 14. Edge Case — Many Constraints

**Objective:**  
Design multi-functional nanocomposite membrane for simultaneous water desalination and heavy metal removal

**Parameters:**


| Name                 | Value |
| -------------------- | ----- |
| temperature          | 60    |
| membrane_thickness   | 0.15  |
| pore_size            | 2.5   |
| nanoparticle_loading | 3     |


**Constraints:**  
salt_rejection > 99, flux > 20, lead_removal > 98, arsenic_removal > 95, chlorine_resistant = true, ph_range = 2-12, lifespan_years > 5, cost_per_m2 < 50

**Why this is useful:** 8 constraints — tests the constraint string parsing (comma-separated), API payload size, and how well the AI reasons across many constraints.

---

## 15. Semiconductor Wafer Processing

**Objective:**  
Optimize chemical vapor deposition parameters for uniform gallium nitride epitaxial growth on silicon carbide substrate

**Parameters:**


| Name             | Value |
| ---------------- | ----- |
| temperature      | 1050  |
| chamber_pressure | 0.05  |
| gas_flow_rate    | 15    |
| growth_time      | 120   |
| v_iii_ratio      | 2000  |


**Constraints:**  
thickness_uniformity > 98, defect_density < 1e6, surface_roughness < 0.5nm

**Why this is useful:** Extreme temperature (1050°C) — heavy warning territory. Very large ratio (v_iii_ratio = 2000). Tests AI handling of semiconductor-specific domain knowledge.

---

## Quick Reference Table


| #   | Scenario              | Params | Constraints | Temperature | Key Test Aspect             |
| --- | --------------------- | ------ | ----------- | ----------- | --------------------------- |
| 1   | EV Battery            | 4      | 3           | 220         | Standard happy path         |
| 2   | Aerospace Coating     | 4      | 3           | 350         | Temperature warning         |
| 3   | Auto Alloy            | 5      | 3           | 180         | Many parameters             |
| 4   | Bio Packaging         | 3      | 3           | 165         | Sustainability domain       |
| 5   | Superconductor        | 5      | 3           | 780         | Multiple high temps         |
| 6   | Solar Cell            | 4      | 3           | 100         | Wide numeric range          |
| 7   | 3D Printing           | 6      | 3           | 250         | Most params, boundary temp  |
| 8   | Flex Electronics      | 3      | 3           | 150         | Minimal params              |
| 9   | Self-Healing Concrete | 5      | 3           | 23          | Room temperature, civil eng |
| 10  | Drug Delivery         | 5      | 4           | 37          | Huge param value (45000)    |
| 11  | Single Param          | 1      | 0           | 200         | Minimum input               |
| 12  | Cryogenic             | 4      | 2           | -253        | Negative/zero values        |
| 13  | Long Goal             | 3      | 2           | 200         | Text truncation             |
| 14  | Many Constraints      | 4      | 8           | 60          | Constraint parsing          |
| 15  | Semiconductor         | 5      | 3           | 1050        | Extreme temperature         |


---

## Suggested Testing Order

1. **Start with #1** (EV Battery) — confirm the basic happy path works end-to-end
2. **Then #11** (Single Param) — verify minimum viable input
3. **Then #2** (Aerospace) — verify the temperature warning appears
4. **Then #7** (3D Printing) — stress test with 6 parameters, boundary temperature
5. **Then #12** (Cryogenic) — negative and zero value handling
6. **Then #10** (Drug Delivery) — large numeric values
7. **Then #13** (Long Goal) — text overflow/truncation behavior
8. **Then #14** (Many Constraints) — multi-constraint parsing
9. **Run remaining** in any order for broad coverage
10. **Finally, run #1 → complete → click "Run Next Iteration"** — verify the iteration flow pre-fills the AI's suggested values

