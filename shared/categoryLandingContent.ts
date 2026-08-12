export interface CategoryLandingProfile {
  name: string;
  catalogSlug: string;
  catalogHref?: string;
  eyebrow: string;
  heading: string;
  summary: string;
  overview: string;
  selectionPoints: string[];
  faq: Array<{ question: string; answer: string }>;
}

export const CATEGORY_LANDING_PROFILES: Record<string, CategoryLandingProfile> = {
  "c18-columns": {
    name: "C18 HPLC Columns",
    catalogSlug: "c18-columns",
    eyebrow: "Reversed-Phase HPLC Column Selection",
    heading: "C18 HPLC Columns for Reliable Reversed-Phase Separations",
    summary: "Browse ROWELL's C18 HPLC column range and use practical selection factors to match stationary phase, dimensions, particle size, and method requirements.",
    overview: "C18 columns are widely used in reversed-phase HPLC because their octadecyl-bonded stationary phase provides hydrophobic retention for many small-molecule and moderately non-polar analytes. A productive starting point is to align the column chemistry with the analyte and mobile-phase conditions, then refine dimensions and particle size for the required resolution, analysis time, and system pressure.",
    selectionPoints: [
      "Start with the analytical goal: screening, method development, routine QC, or a validated transfer.",
      "Match internal diameter and column length to sample throughput, sensitivity, and instrument configuration.",
      "Confirm particle size, pore size, and pH operating range against the method conditions before purchase.",
    ],
    faq: [
      { question: "When is a C18 column a practical starting point?", answer: "A C18 phase is commonly evaluated first for reversed-phase separations where analytes show useful hydrophobic retention. Final selection should be confirmed during method development with the intended mobile phase and sample matrix." },
      { question: "Which dimensions should I compare first?", answer: "Compare column length, internal diameter, particle size, and pore size with the existing method and instrument limits. These parameters affect retention, efficiency, solvent consumption, and backpressure." },
      { question: "How should I protect a C18 analytical column?", answer: "Use appropriate sample preparation and, where compatible with the analytical column, a guard column or guard cartridge. Replace protective components according to method performance rather than a fixed unsupported interval." },
    ],
  },
  "guard-columns": {
    name: "HPLC Guard Columns",
    catalogSlug: "guard-columns",
    eyebrow: "Analytical Column Protection",
    heading: "HPLC Guard Columns and Guard Cartridges for Method Protection",
    summary: "Select compatible HPLC guard columns and cartridges to help protect analytical columns from particulates and strongly retained sample components.",
    overview: "A guard column is placed before an analytical HPLC column to provide a replaceable protection stage. It can help reduce the impact of particulates and matrix components that may otherwise accumulate at the analytical-column inlet. Compatibility matters: the guard format, internal diameter, and stationary-phase chemistry should be considered together with the analytical method.",
    selectionPoints: [
      "Use a guard phase that is compatible with the analytical column chemistry and method objective.",
      "Check the hardware format, connection type, internal diameter, and pressure rating before installation.",
      "Combine guard-column use with appropriate sample filtration or cleanup for the matrix being analyzed.",
    ],
    faq: [
      { question: "Does every HPLC method require a guard column?", answer: "Not every method requires one. A guard column is most useful when the sample matrix or injection history creates a credible risk of contamination at the analytical-column inlet." },
      { question: "Should the guard chemistry match the analytical column?", answer: "Matching or method-compatible chemistry is generally the safest starting point because it reduces the chance that the guard changes selectivity before the analytical separation." },
      { question: "When should a guard cartridge be changed?", answer: "Use observed method indicators such as pressure change, peak-shape deterioration, retention shifts, or recovery of performance after replacement. The appropriate interval depends on the sample matrix and workflow." },
    ],
  },
  "gc-columns": {
    name: "GC Columns",
    catalogSlug: "gc-columns",
    eyebrow: "Capillary GC Column Selection",
    heading: "GC Capillary Columns for Method Development and Routine Analysis",
    summary: "Explore ROWELL's GC column range and compare stationary-phase polarity, column dimensions, film thickness, and temperature requirements for your analytical method.",
    overview: "GC column selection begins with the analyte volatility, polarity, matrix, detector, and separation objective. Stationary-phase polarity influences selectivity, while internal diameter, length, and film thickness influence retention, efficiency, sample capacity, and flow requirements. Selecting a column should therefore be a method-level decision rather than a brand-name substitution alone.",
    selectionPoints: [
      "Compare stationary-phase polarity with the analytes and the selectivity required by the method.",
      "Review column length, internal diameter, and film thickness together rather than in isolation.",
      "Confirm the planned oven program and inlet conditions are compatible with the column temperature limits.",
    ],
    faq: [
      { question: "What drives GC column selectivity?", answer: "Stationary-phase chemistry is a central driver of selectivity. Analyte properties, temperature programming, carrier-gas conditions, and sample introduction also affect the observed separation." },
      { question: "How does film thickness affect a GC method?", answer: "Film thickness can affect retention and sample capacity, especially for volatile analytes. The appropriate choice depends on the method objective and operating conditions." },
      { question: "Can I transfer a GC method to a different column?", answer: "Method transfer should be evaluated experimentally. Match the phase type and dimensions as closely as possible, then verify retention, resolution, and suitability criteria under the intended conditions." },
    ],
  },
  "kinetex-pfp-columns": {
    name: "Phenomenex Kinetex PFP Columns",
    catalogSlug: "kinetex-pfp-columns",
    catalogHref: "/products?search=PFP",
    eyebrow: "PFP / USP L43 Reversed-Phase Column Selection",
    heading: "Phenomenex Kinetex PFP Columns for Reversed-Phase HPLC Method Evaluation",
    summary: "Explore ROWELL's currently listed Kinetex PFP HPLC columns and compare verified dimensions, particle size, pore size, and PFP (USP L43) chemistry for your method review.",
    overview: "Kinetex PFP columns use pentafluorophenyl stationary-phase chemistry in reversed-phase HPLC. A PFP option can be evaluated when a method team is reviewing selectivity choices alongside conventional reversed-phase chemistries. Product selection should begin with the analytical objective, sample matrix, and method conditions, then compare the available particle size, internal diameter, and column length with the instrument and method requirements.",
    selectionPoints: [
      "Confirm that a PFP selectivity evaluation is appropriate for the analytes and the intended method objective before making a substitution.",
      "Compare particle size, pore size, internal diameter, and column length with the current method and instrument pressure limits.",
      "Use the exact part number when reviewing manufacturer documentation, preparing a method evaluation, or requesting a quote.",
    ],
    faq: [
      { question: "What is a PFP HPLC stationary phase?", answer: "PFP refers to pentafluorophenyl stationary-phase chemistry. It is used in reversed-phase LC and can be evaluated when method development requires a different selectivity option from a conventional alkyl phase." },
      { question: "What should be compared when selecting a Kinetex PFP column?", answer: "Compare the intended stationary-phase chemistry, particle size, pore size, internal diameter, and column length with the method objective, sample matrix, and instrument operating limits." },
      { question: "Can a PFP column replace a C18 column without method work?", answer: "A change of stationary-phase chemistry can change selectivity. Any replacement should be evaluated using the actual method conditions and the method’s suitability criteria." },
    ],
  },
  "spe-cartridges": {
    name: "SPE Cartridges",
    catalogSlug: "spe-cartridges",
    eyebrow: "Solid-Phase Extraction Selection",
    heading: "SPE Cartridges for Targeted Sample Cleanup and Concentration",
    summary: "Choose SPE cartridges by considering analyte chemistry, sample matrix, cleanup objective, sorbent selectivity, and elution strategy.",
    overview: "Solid-phase extraction can be used to reduce matrix interference, concentrate analytes, and prepare samples before chromatographic analysis. A reliable selection process starts by defining the analyte properties and sample matrix, then selecting a sorbent mechanism and workflow that supports the intended retention, wash, and elution steps. Method suitability should be demonstrated with representative samples and recovery checks.",
    selectionPoints: [
      "Define the analytes, sample matrix, target concentration range, and required cleanup before choosing sorbent chemistry.",
      "Compare sorbent mass and cartridge format with expected sample load and the planned loading volume.",
      "Validate conditioning, loading, wash, and elution steps using recovery and matrix-effect data for the actual method.",
    ],
    faq: [
      { question: "How do I choose an SPE sorbent?", answer: "Start with analyte polarity, ionization behavior, and matrix composition. Reversed-phase, normal-phase, ion-exchange, and mixed-mode options should be compared against the intended retention and cleanup mechanism." },
      { question: "Can one SPE cartridge serve every sample type?", answer: "No. Cartridge selection and workflow conditions should be evaluated for the actual matrix and analyte set, because matrix composition can materially affect retention and recovery." },
      { question: "What should be checked after selecting an SPE cartridge?", answer: "Confirm recovery, precision, matrix effects, and blank performance under the planned conditioning, loading, wash, and elution steps before routine use." },
    ],
  },
};

export const CATEGORY_LANDING_SLUGS = Object.keys(CATEGORY_LANDING_PROFILES);
