export interface CategoryLandingProfile {
  name: string;
  catalogSlug: string;
  catalogHref?: string;
  eyebrow: string;
  heading: string;
  summary: string;
  overview: string;
  selectionPoints: string[];
  selectionFramework?: Array<{ heading: string; body: string }>;
  relatedLinks?: Array<{ href: string; label: string; description: string }>;
  faq: Array<{ question: string; answer: string }>;
}

export const CATEGORY_LANDING_PROFILES: Record<string, CategoryLandingProfile> = {
  "c18-columns": {
    name: "C18 HPLC Columns",
    catalogSlug: "c18-columns",
    eyebrow: "Reversed-Phase HPLC Column Selection",
    heading: "C18 HPLC Columns for Reliable Reversed-Phase Separations",
    summary: "Browse ROWELL's C18 HPLC column range and use practical selection factors to match stationary phase, dimensions, particle size, and method requirements.",
    overview: "C18 columns are widely used in reversed-phase HPLC because their octadecyl-bonded stationary phase provides hydrophobic retention for many small-molecule and moderately non-polar analytes. A useful selection process starts with the analytical objective and current method, then compares stationary-phase format, dimensions, particle size, pore size and documented operating limits for the exact part number. C18 is a chemistry family rather than a guarantee of interchangeability: bonding, endcapping, particle technology and hardware can differ between products.",
    selectionPoints: [
      "Start with the analytical goal: screening, method development, routine QC, or a validated transfer.",
      "Match internal diameter and column length to sample throughput, sensitivity, injection volume, solvent use, and instrument configuration.",
      "Compare particle size with the method objective and the system's documented pressure capability; a change in particle size can change efficiency and backpressure together.",
      "Confirm pore size, pH operating range, mobile-phase compatibility and temperature guidance against the exact manufacturer documentation before purchase or method transfer.",
      "Use the exact part number when comparing a listed product with a current method, pharmacopeial procedure, or existing column hardware.",
    ],
    selectionFramework: [
      {
        heading: "1. Begin with method intent and retention mechanism",
        body: "Define the analyte set, matrix, separation goal and mobile-phase conditions before choosing a column. A C18 phase is often evaluated for hydrophobic retention in reversed-phase work, but the selected product should be assessed against the actual method rather than treated as an automatic replacement.",
      },
      {
        heading: "2. Set the column geometry from the workflow",
        body: "Compare internal diameter and column length with the established method, detector sensitivity, injection volume, run-time target and available instrument configuration. Geometry changes can affect retention, efficiency, solvent consumption and the conditions required for a comparable transfer.",
      },
      {
        heading: "3. Balance particle size with system capability",
        body: "Particle size is one part of the efficiency and pressure trade-off. Confirm the selected product's listed particle size and the instrument's documented operating range before changing a validated method or setting a new method-development starting point.",
      },
      {
        heading: "4. Check pore size and operating limits",
        body: "Pore size should be compared with analyte size and the method objective. Use the exact product documentation to confirm pH, solvent, temperature and pressure guidance; these limits can differ between C18 families and are not established by the C18 label alone.",
      },
      {
        heading: "5. Verify compatibility before method transfer",
        body: "For routine methods or regulated workflows, compare the exact stationary phase, dimensions, particle size and documented limits with the existing column. Evaluate retention, selectivity, resolution and system-suitability criteria under the intended conditions before adopting a substitute.",
      },
    ],
    relatedLinks: [
      {
        href: "/resources/hplc-c18-column-selection-guide",
        label: "Read the C18 column selection guide",
        description: "Review the existing technical guide before comparing current catalog listings for a method evaluation.",
      },
      {
        href: "/resources/c18-vs-c8-hplc-column-selection-guide",
        label: "Compare C18 and C8 stationary phases",
        description: "Use the existing C18-versus-C8 guide when method development requires a documented selectivity comparison.",
      },
      {
        href: "/categories/guard-columns",
        label: "Review HPLC guard-column considerations",
        description: "Compare compatible guard-column options alongside the analytical-column workflow.",
      },
    ],
    faq: [
      { question: "When is a C18 column a practical starting point?", answer: "A C18 phase is commonly evaluated first for reversed-phase separations where analytes show useful hydrophobic retention. Final selection should be confirmed during method development with the intended mobile phase and sample matrix." },
      { question: "Which C18 dimensions should I compare first?", answer: "Compare column length, internal diameter, particle size and pore size with the existing method, injection volume, instrument configuration and documented operating limits. These parameters can influence retention, efficiency, solvent consumption and backpressure together." },
      { question: "Are all C18 HPLC columns interchangeable?", answer: "No. C18 describes an alkyl stationary-phase family, but bonding, endcapping, particle technology, dimensions, hardware and documented operating limits can differ. Confirm the exact part number and verify method suitability before treating one C18 product as a substitute for another." },
      { question: "How should I protect a C18 analytical column?", answer: "Use appropriate sample preparation and, where compatible with the analytical column, a guard column or guard cartridge. Replace protective components according to method performance rather than a fixed unsupported interval." },
      { question: "What should be checked before transferring a C18 method?", answer: "Compare the exact phase, dimensions, particle size and documented operating limits with the current method, then evaluate retention, selectivity, resolution and system-suitability criteria under the intended conditions." },
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
    selectionFramework: [
      {
        heading: "1. Start with the separation objective and sample profile",
        body: "Define the analytes, expected concentration range, matrix, detector, injection approach and required separation before selecting a GC column. A column should be treated as one component of the full method; inlet conditions, oven program and detector configuration also influence the observed result.",
      },
      {
        heading: "2. Compare stationary-phase selectivity deliberately",
        body: "Stationary-phase chemistry is a primary selectivity decision in capillary GC. Compare the phase polarity and documented application guidance for the exact part number with the analyte class and separation objective. Do not assume that a familiar phase label establishes equivalence between products or methods.",
      },
      {
        heading: "3. Select length, internal diameter and film thickness together",
        body: "Column length, internal diameter and film thickness work together to influence efficiency, retention, sample capacity, flow requirements and run time. Compare all three dimensions with the established method and the available instrument configuration rather than changing one parameter in isolation.",
      },
      {
        heading: "4. Check operating boundaries before installation",
        body: "Confirm the exact column's documented temperature limits, inlet compatibility, carrier-gas conditions and hardware format before use. The intended oven program, sample introduction conditions and detector setup should remain within the manufacturer guidance for the selected product.",
      },
      {
        heading: "5. Verify method suitability before routine use or transfer",
        body: "For a new method, replacement or transfer, evaluate retention, selectivity, resolution, peak shape and relevant system-suitability criteria using the actual method conditions. A phase or dimension match is a starting point for evaluation, not evidence that two columns will perform identically.",
      },
    ],
    relatedLinks: [
      { href: "/resources/gc-capillary-column-environmental-analysis", label: "Read the GC capillary-column guide", description: "Use the existing guide to frame stationary-phase and dimension comparisons before reviewing listings." },
      { href: "/resources/gc-troubleshooting-guide", label: "Review GC troubleshooting considerations", description: "Use the recorded troubleshooting resource when evaluating method or inlet-related performance questions." },
    ],
    faq: [
      { question: "What drives GC column selectivity?", answer: "Stationary-phase chemistry is a central driver of selectivity. Analyte properties, temperature programming, carrier-gas conditions, and sample introduction also affect the observed separation." },
      { question: "How does film thickness affect a GC method?", answer: "Film thickness can affect retention and sample capacity, especially for volatile analytes. The appropriate choice depends on the method objective and operating conditions." },
      { question: "Can I transfer a GC method to a different column?", answer: "Method transfer should be evaluated experimentally. Match the phase type and dimensions as closely as possible, then verify retention, resolution, and suitability criteria under the intended conditions." },
      { question: "What are the main factors when comparing capillary GC columns?", answer: "Compare the exact stationary phase, length, internal diameter, film thickness, temperature limits and hardware format with the analytes, oven program, inlet configuration and required separation objective." },
      { question: "Does a longer GC column always provide a better method?", answer: "A longer column can change efficiency and run time, but the appropriate choice depends on the phase, dimensions, analytes, instrument conditions and method criteria. Evaluate the complete method rather than selecting by length alone." },
    ],
  },
  "kinetex-pfp-columns": {
    name: "Phenomenex Kinetex F5 / PFP (USP L43) Columns",
    catalogSlug: "kinetex-pfp-columns",
    catalogHref: "/products?search=PFP",
    eyebrow: "Kinetex F5 / PFP (USP L43) Column Selection",
    heading: "Phenomenex Kinetex F5 / PFP (USP L43) Columns for HPLC Method Evaluation",
    summary: "Explore ROWELL's currently listed Kinetex F5 / PFP HPLC columns and compare listed dimensions, particle size, pore size, and pentafluorophenyl-propyl (USP L43) chemistry for method review.",
    overview: "Phenomenex identifies Kinetex F5 as a pentafluorophenyl-propyl, USP L43 core-shell HPLC column family. It can be considered when a method team is reviewing stationary-phase selectivity alongside conventional reversed-phase chemistries. Product selection should begin with the analytical objective, sample matrix, and method conditions, then compare the listed particle size, internal diameter, and column length with instrument and method requirements.",
    selectionPoints: [
      "Confirm that a Kinetex F5 / PFP (USP L43) selectivity evaluation is appropriate for the analytes and intended method objective before making a substitution.",
      "Compare particle size, pore size, internal diameter, and column length with the current method and instrument pressure limits.",
      "Use the exact part number when reviewing manufacturer documentation, preparing a method evaluation, or requesting a quote.",
    ],
    faq: [
      { question: "What is a PFP HPLC stationary phase?", answer: "PFP refers to pentafluorophenyl stationary-phase chemistry. It is used in reversed-phase LC and can be evaluated when method development requires a different selectivity option from a conventional alkyl phase." },
      { question: "What should be compared when selecting a Kinetex F5 / PFP column?", answer: "Compare the intended stationary-phase chemistry, particle size, pore size, internal diameter, and column length with the method objective, sample matrix, and instrument operating limits." },
      { question: "Can a PFP column replace a C18 column without method work?", answer: "A change of stationary-phase chemistry can change selectivity. Any replacement should be evaluated using the actual method conditions and the method’s suitability criteria." },
    ],
  },
  "chiral-hplc-columns": {
    name: "Chiral HPLC Columns",
    catalogSlug: "chiral-hplc-columns",
    catalogHref: "/products?search=chiral",
    eyebrow: "Chiral Separation Column Selection",
    heading: "Chiral HPLC Columns for Enantioselective Method Development",
    summary: "Browse ROWELL's current chiral chromatography column listings and compare manufacturer-stated dimensions, particle size, stationary-phase format, and method compatibility.",
    overview: "Chiral column selection should begin with the exact analyte, the intended separation mode, and the manufacturer documentation for the selected part number. The active catalog includes chiral column families from multiple brands; use the catalog to compare current listings before requesting a quote or planning a method evaluation.",
    selectionPoints: [
      "Use the exact product part number and manufacturer documentation when reviewing a chiral stationary phase.",
      "Check whether the intended HPLC, normal-phase, reversed-phase, polar-organic, or SFC conditions are supported for the selected column.",
      "Confirm dimensions, particle size, solvent compatibility, and method suitability with the actual analytical workflow."
    ],
    selectionFramework: [
      {
        heading: "1. Define the enantioselective separation objective",
        body: "Begin with the analyte, matrix, expected enantiomeric relationship, detector and method objective. A chiral column is selected for a method evaluation, not merely by a familiar brand or a nominal column size. State whether the work is exploratory, routine QC, impurity assessment, preparative separation or a validated transfer before narrowing the catalog.",
      },
      {
        heading: "2. Establish the intended separation mode",
        body: "Check the planned solvent system and technique before comparing a chiral stationary phase. Normal-phase, reversed-phase, polar-organic and SFC workflows can place different demands on solvent compatibility and operating conditions. Confirm the exact product documentation rather than inferring compatibility from a family name.",
      },
      {
        heading: "3. Compare stationary-phase options without assuming interchangeability",
        body: "Chiral selectivity depends on the interaction between the analyte, stationary phase and mobile phase. Columns described as chiral can differ in selector chemistry, support format and documented operating guidance. Treat a new part number as a method-development candidate and verify resolution, retention and selectivity under the intended conditions.",
      },
      {
        heading: "4. Match geometry and particle size to the workflow",
        body: "Review length, internal diameter, particle size and hardware format alongside the analytical or preparative workflow. These parameters can affect pressure, loading, sensitivity, solvent use and run time. Compare them with the current method and the instrument's documented operating range before a transfer or scale change.",
      },
      {
        heading: "5. Confirm method suitability before routine use",
        body: "Before adopting a listed product, use the exact manufacturer documentation and evaluate the relevant method criteria under planned conditions. For an enantioselective method, verify the observed separation, repeatability and system-suitability requirements rather than assuming that a category match establishes equivalence.",
      },
    ],
    relatedLinks: [
      {
        href: "/products?search=chiral",
        label: "Browse current chiral column listings",
        description: "Compare active catalog records by exact part number and listed product attributes before requesting a quote.",
      },
      {
        href: "/learning",
        label: "Explore the chromatography learning center",
        description: "Use the learning center to review general method-development resources alongside manufacturer documentation.",
      },
      {
        href: "/contact",
        label: "Request a quote with method context",
        description: "Provide the part number where known, intended technique and key workflow requirements for an accurate inquiry.",
      },
    ],
    faq: [
      { question: "How should I start selecting a chiral HPLC column?", answer: "Start with the analyte, separation objective, intended technique and manufacturer guidance for the exact part number. Chiral selectivity should be verified experimentally under the planned conditions." },
      { question: "Which separation modes should be checked for a chiral column?", answer: "Confirm whether the exact product documentation supports the intended HPLC, normal-phase, reversed-phase, polar-organic or SFC conditions. Do not infer solvent compatibility from a family name alone." },
      { question: "Can a chiral column be substituted without method work?", answer: "A change of chiral stationary phase, dimensions or operating conditions can affect selectivity. Any substitution should be evaluated using the actual method conditions and the method’s suitability criteria." },
      { question: "Which dimensions matter when comparing chiral HPLC columns?", answer: "Compare length, internal diameter, particle size and hardware format with the method objective, available instrument configuration, pressure capability, sample load and run-time requirements." },
      { question: "Which product details should be confirmed before requesting a quote?", answer: "Confirm the exact part number, dimensions, particle size, technique compatibility and manufacturer documentation relevant to the planned method." }
    ],
  },
  "hilic-hplc-columns": {
    name: "HILIC HPLC Columns",
    catalogSlug: "hilic-hplc-columns",
    catalogHref: "/products?search=HILIC",
    eyebrow: "Polar Analyte Retention Selection",
    heading: "HILIC HPLC Columns for Polar Compound Method Evaluation",
    summary: "Browse ROWELL's current HILIC column listings and compare manufacturer-stated stationary phase, dimensions, particle size, and method compatibility for polar-analyte workflows.",
    overview: "HILIC methods are commonly evaluated when a method requires a different retention mechanism for polar analytes. Product selection should be based on the exact stationary phase, sample chemistry, mobile-phase conditions, and manufacturer documentation for the selected part number.",
    selectionPoints: [
      "Review the listed stationary phase and manufacturer method guidance before transferring or developing a HILIC method.",
      "Compare column dimensions and particle size with instrument pressure limits and the intended method scale.",
      "Confirm equilibration, sample-solvent, and mobile-phase requirements using the selected manufacturer’s documentation."
    ],
    selectionFramework: [
      {
        heading: "1. Define the polar-analyte separation objective",
        body: "Start with the analyte properties, sample matrix, detector and analytical objective. HILIC is often evaluated when conventional reversed-phase retention is not the desired starting point for a polar-analyte workflow, but the appropriate choice must be confirmed under the actual method conditions.",
      },
      {
        heading: "2. Compare the exact stationary-phase format",
        body: "HILIC columns can differ in stationary-phase chemistry, support technology and manufacturer guidance. Compare the exact part number and listed phase with the intended method rather than treating every HILIC listing as interchangeable. A category label does not establish selectivity or solvent compatibility for a specific product.",
      },
      {
        heading: "3. Plan mobile phase, sample solvent and equilibration carefully",
        body: "Use the exact product documentation when designing or reviewing mobile-phase composition, additives, sample solvent and equilibration steps. These practical conditions can affect retention, peak shape and repeatability, so they should be set through the intended workflow rather than copied from an unrelated column family.",
      },
      {
        heading: "4. Match column geometry and particle size to the system",
        body: "Review internal diameter, column length, particle size and hardware format alongside the required sensitivity, injection volume, sample load, pressure capability and run-time target. Geometry or particle changes can change operating behavior and should be evaluated before a method transfer.",
      },
      {
        heading: "5. Verify suitability under the intended method",
        body: "Before routine use or substitution, evaluate the selected column with the actual analytes, matrix and system-suitability criteria. Confirm retention, selectivity, resolution, repeatability and documented operating limits under planned conditions rather than assuming that a HILIC category match proves equivalence.",
      },
    ],
    relatedLinks: [
      {
        href: "/products?search=HILIC",
        label: "Browse current HILIC column listings",
        description: "Compare active catalog records by exact part number, listed phase and product attributes before requesting a quote.",
      },
      {
        href: "/learning",
        label: "Explore the chromatography learning center",
        description: "Use the learning center to review general method-development resources alongside manufacturer documentation.",
      },
      {
        href: "/contact",
        label: "Request a quote with method context",
        description: "Provide the part number where known, intended technique and key workflow requirements for an accurate inquiry.",
      },
    ],
    faq: [
      { question: "When can a HILIC column be evaluated?", answer: "HILIC can be evaluated when a method needs a polar-analyte retention mechanism that differs from conventional reversed-phase conditions. Suitability depends on the analyte and method conditions." },
      { question: "What should be checked for polar compounds in a HILIC method?", answer: "Start with the analyte, sample matrix and intended separation objective, then use the exact product documentation to evaluate stationary phase, mobile-phase conditions, sample solvent and equilibration requirements." },
      { question: "Can all HILIC columns use the same method conditions?", answer: "No. Stationary-phase chemistry and manufacturer guidance differ by product. Check the exact part number before selecting solvents, additives or operating conditions." },
      { question: "Which dimensions should be compared for a HILIC column?", answer: "Compare column length, internal diameter, particle size and hardware format with the method objective, injection volume, system pressure capability, sensitivity and run-time requirements." },
      { question: "What should I compare in the active catalog?", answer: "Compare the listed phase, dimensions, particle size, manufacturer documentation and method compatibility for the current product listing." }
    ],
  },
  "c8-hplc-columns": {
    name: "C8 HPLC Columns",
    catalogSlug: "c8-hplc-columns",
    catalogHref: "/products?search=C8",
    eyebrow: "Reversed-Phase Selectivity Selection",
    heading: "C8 HPLC Columns for Reversed-Phase Method Development",
    summary: "Explore ROWELL's current C8 HPLC column listings and compare manufacturer-stated dimensions, particle size, pore size, and method compatibility.",
    overview: "C8 is a reversed-phase stationary-phase family that can be evaluated alongside other alkyl phases during method development. The correct choice depends on the analyte, mobile phase, separation objective, and the documented limits for the exact column part number.",
    selectionPoints: [
      "Compare the selected C8 phase with the actual method objective rather than assuming equivalence with another phase.",
      "Check column length, internal diameter, particle size, and pore size against the current method and instrument limits.",
      "Use manufacturer documentation to confirm applicable solvent, pH, and pressure guidance for the exact part number."
    ],
    faq: [
      { question: "When might a C8 phase be evaluated?", answer: "A C8 phase can be evaluated as a reversed-phase option when method development requires a different retention profile from the current column. The outcome should be confirmed experimentally." },
      { question: "Is every C8 column interchangeable?", answer: "No. Bonding chemistry, hardware, dimensions, particle size, and manufacturer limits can differ. Compare the exact products before making a substitution." },
      { question: "What information is needed for a C8 quote?", answer: "Provide the desired part number where possible, or the required phase, dimensions, particle size, and intended method conditions." }
    ],
  },
  "phenyl-hplc-columns": {
    name: "Phenyl HPLC Columns",
    catalogSlug: "phenyl-hplc-columns",
    catalogHref: "/products?search=phenyl",
    eyebrow: "Alternative Reversed-Phase Selectivity",
    heading: "Phenyl HPLC Columns for Alternative Selectivity Evaluation",
    summary: "Browse ROWELL's current phenyl and phenyl-hexyl HPLC column listings and compare manufacturer-stated chemistry, dimensions, particle size, and method compatibility.",
    overview: "Phenyl-type stationary phases can be evaluated when a method team is considering an alternative selectivity option. Selection should be based on the exact product chemistry, the analyte and matrix, and manufacturer documentation rather than a general assumption about performance.",
    selectionPoints: [
      "Identify the exact phenyl or phenyl-hexyl chemistry listed for the candidate product.",
      "Compare dimensions and particle size with the method objective and instrument operating limits.",
      "Verify the selected product’s documented operating conditions before changing a validated method."
    ],
    faq: [
      { question: "Why consider a phenyl HPLC column?", answer: "A phenyl-type phase can be evaluated when method development calls for an alternative selectivity option. The appropriate choice depends on the analyte and actual method data." },
      { question: "Are phenyl and phenyl-hexyl phases identical?", answer: "No. Product chemistry and manufacturer specifications can differ. Review the exact product documentation before treating any phases as interchangeable." },
      { question: "How should a phenyl-column change be assessed?", answer: "Evaluate retention, selectivity, resolution, and method suitability using the actual operating conditions and predefined acceptance criteria." }
    ],
  },
  "kinetex-hplc-columns": {
    name: "Phenomenex Kinetex HPLC Columns",
    catalogSlug: "kinetex-hplc-columns",
    catalogHref: "/products?search=Kinetex",
    eyebrow: "Kinetex Core-Shell LC Column Selection",
    heading: "Phenomenex Kinetex HPLC Columns for Method Evaluation",
    summary: "Browse ROWELL's current Phenomenex Kinetex column listings and compare the listed phase, dimensions, particle size, and manufacturer documentation for your method.",
    overview: "Phenomenex describes the Kinetex family as core-shell LC columns with multiple stationary-phase options. ROWELL's active catalog includes currently listed Kinetex products; review each exact part number and the associated manufacturer documentation before selecting a phase or planning method work.",
    selectionPoints: [
      "Use the active catalog to identify the exact Kinetex product and compare its listed phase, dimensions, and particle size.",
      "Confirm compatibility with the instrument, mobile phase, and validated method before changing columns.",
      "Treat each stationary phase as a distinct method-development option rather than assuming all Kinetex variants are interchangeable."
    ],
    faq: [
      { question: "What is the Kinetex column family?", answer: "Phenomenex describes Kinetex as a core-shell LC column family with multiple stationary-phase options. Review the exact product documentation for the selected part number." },
      { question: "Does this page list every Kinetex phase?", answer: "The catalog link shows ROWELL's current active listings. Availability and documented specifications should be checked for each exact part number." },
      { question: "Can a Kinetex phase be substituted directly for another phase?", answer: "A phase change can alter chromatographic behavior. Evaluate substitutions under the actual method conditions and method-suitability requirements." }
    ],
  },
  "agilent-poroshell-columns": {
    name: "Agilent InfinityLab Poroshell HPLC Columns",
    catalogSlug: "agilent-poroshell-columns",
    catalogHref: "/products?search=Poroshell",
    eyebrow: "Poroshell Core-Shell Column Selection",
    heading: "Agilent InfinityLab Poroshell HPLC Columns",
    summary: "Explore ROWELL's current Agilent InfinityLab Poroshell column listings and compare manufacturer-stated chemistry, dimensions, particle size, and method compatibility.",
    overview: "Agilent describes the InfinityLab Poroshell 120 family as superficially porous LC columns with multiple chemistries and particle sizes. Use the active catalog to identify current listings, then confirm the exact product documentation before selecting a column for a method.",
    selectionPoints: [
      "Compare the exact listed Poroshell chemistry and dimensions with the method objective and existing instrument configuration.",
      "Review the manufacturer documentation for the selected part number before choosing operating conditions.",
      "Verify a method transfer or substitution using the method’s own suitability criteria."
    ],
    faq: [
      { question: "What is the InfinityLab Poroshell 120 family?", answer: "Agilent describes Poroshell 120 as a superficially porous LC column family with multiple chemistries and particle sizes. Specifications depend on the exact part number." },
      { question: "Can Poroshell products support different LC methods?", answer: "The family includes multiple chemistries, but suitability depends on the selected product, analyte, mobile phase, and method requirements." },
      { question: "How should I compare current Poroshell listings?", answer: "Compare the exact phase, dimensions, particle size, and manufacturer documentation with the existing method and instrument limits." }
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
    relatedLinks: [
      { href: "/resources/spe-vs-lle-sample-extraction-efficiency", label: "Compare SPE and liquid-liquid extraction", description: "Use the existing comparison guide to frame sample-preparation options before selecting a listed cartridge." },
      { href: "/resources/hplc-sample-preparation-sop-filtration", label: "Review sample filtration guidance", description: "Use the recorded sample-preparation resource when planning the workflow around an SPE cleanup step." },
    ],
    faq: [
      { question: "How do I choose an SPE sorbent?", answer: "Start with analyte polarity, ionization behavior, and matrix composition. Reversed-phase, normal-phase, ion-exchange, and mixed-mode options should be compared against the intended retention and cleanup mechanism." },
      { question: "Can one SPE cartridge serve every sample type?", answer: "No. Cartridge selection and workflow conditions should be evaluated for the actual matrix and analyte set, because matrix composition can materially affect retention and recovery." },
      { question: "What should be checked after selecting an SPE cartridge?", answer: "Confirm recovery, precision, matrix effects, and blank performance under the planned conditioning, loading, wash, and elution steps before routine use." },
    ],
  },
  "vials": {
    name: "Chromatography Vials",
    catalogSlug: "vials",
    catalogHref: "/products?category=19",
    eyebrow: "Chromatography Sample Vial Selection",
    heading: "Chromatography Vials for HPLC, UHPLC and GC Sample Handling",
    summary: "Browse chromatography vials for HPLC, UHPLC and GC workflows, and compare listed capacity, glass type, neck finish, dimensions, closure format and package quantity.",
    overview: "A chromatography vial is selected around the sample volume, autosampler format, closure system and chemical compatibility required by the method. Compare the listed vial capacity, glass type, neck finish and dimensions with the autosampler documentation and intended sample workflow. Where a vial, cap and septum are offered separately, confirm compatible dimensions and closure formats.",
    selectionPoints: [
      "Match vial capacity and recovery format to the expected injection volume, remaining sample volume and method workflow.",
      "Compare neck finish, vial dimensions and closure style with the intended autosampler and selected cap or septum.",
      "Review listed clear or amber glass format, package quantity and the exact part number before requesting sourcing support.",
    ],
    relatedLinks: [
      { href: "/categories/caps-septa", label: "Compare compatible vial caps and septa", description: "Review closure formats alongside the vial neck finish and autosampler workflow." },
      { href: "/resources/vial-selection-and-sample-integrity-in-chromatographic-analysis", label: "Read the vial selection guide", description: "Use the existing technical resource to compare sample-handling factors before selecting a part number." },
    ],
    faq: [
      { question: "How should I choose chromatography vial capacity?", answer: "Start with the sample volume, required injection volume and autosampler format. Compare the listed vial capacity and dimensions with the actual workflow and instrument documentation." },
      { question: "Are screw-neck and snap-neck vials interchangeable?", answer: "No. Vial neck finish and closure format must be compatible. Confirm the exact vial, cap and septum specifications before assembling a sample container." },
      { question: "When should amber glass vials be considered?", answer: "Amber glass can be evaluated when the method or sample-handling procedure calls for reduced light exposure. Confirm material suitability using the sample and method requirements." },
    ],
  },
  "caps-septa": {
    name: "Vial Caps & Septa",
    catalogSlug: "caps-septa",
    catalogHref: "/products?category=20",
    eyebrow: "Vial Closure and Septum Selection",
    heading: "Vial Caps and Septa for Chromatography Sample Handling",
    summary: "Compare chromatography vial caps and septa by closure format, dimensions, septum material, slit design, cap color and package quantity for your sample-handling workflow.",
    overview: "Caps and septa complete the vial closure system and should be selected with the exact vial neck finish, autosampler needle configuration and sample-handling requirements in mind. Use the exact part number to confirm that the cap and septum are compatible with the vial and intended method conditions.",
    selectionPoints: [
      "Match cap diameter and closure format to the selected screw-neck, snap-neck or crimp-neck vial.",
      "Compare listed septum material and slit design with the sample, needle type and injection workflow.",
      "Verify package quantity and whether the listing contains a cap, a septum or an assembled cap-and-septum set.",
    ],
    relatedLinks: [
      { href: "/categories/vials", label: "Review compatible chromatography vials", description: "Match caps and septa with the listed vial neck finish and closure format." },
      { href: "/resources/vial-selection-and-sample-integrity-in-chromatographic-analysis", label: "Read the vial and closure guide", description: "Use the existing resource to review sample-container compatibility before requesting a part number." },
    ],
    faq: [
      { question: "How do I match a cap and septum to a vial?", answer: "Match the vial neck finish, closure style and listed dimensions first. Then confirm the cap-and-septum configuration against the autosampler and sample-handling requirements." },
      { question: "What does a preslit septum mean?", answer: "A preslit septum has a manufacturer-provided opening. Whether it is appropriate depends on the needle, sample volatility and method workflow, so check the exact product specifications." },
      { question: "Should cap color be used as the only selection criterion?", answer: "No. Color can identify a product configuration, but closure format, dimensions, septum material and the exact part number are the key compatibility checks." },
    ],
  },
  "chromatography-syringes": {
    name: "Chromatography Syringes",
    catalogSlug: "chromatography-syringes",
    catalogHref: "/products?category=21",
    eyebrow: "GC and Chromatography Syringe Selection",
    heading: "Chromatography Syringes for GC and Laboratory Sample Introduction",
    summary: "Browse chromatography syringes and compare listed volume, needle gauge, needle length, needle configuration, intended use and package format before selecting a part number.",
    overview: "Chromatography syringe selection depends on the injection technique, required volume, needle configuration and relevant instrument or manual workflow. Compare manufacturer-listed capacity, needle gauge, needle length and fixed or removable needle format with the actual method and instrument documentation.",
    selectionPoints: [
      "Match listed syringe volume with the injection volume and precision requirements of the intended workflow.",
      "Compare needle gauge, length and fixed or removable configuration with the injector, inlet or manual procedure.",
      "Review whether the manufacturer lists the product for reusable or single-use handling and confirm the exact package format.",
    ],
    relatedLinks: [
      { href: "/resources/chromatography-syringe-selection-volume-needle-termination", label: "Read the chromatography syringe guide", description: "Use the existing resource to compare volume, needle configuration and intended workflow." },
      { href: "/categories/vials", label: "Review related sample-handling consumables", description: "Compare syringes with the recorded vial and sample-preparation workflow requirements." },
    ],
    faq: [
      { question: "Which syringe volume should I select for a chromatography method?", answer: "Use the method's injection requirement as the starting point, then compare the listed syringe capacity and configuration with the injector or manual procedure." },
      { question: "Why does needle configuration matter?", answer: "Needle gauge, length and fixed or removable construction affect physical compatibility with the intended injection workflow. Verify the exact product requirements before use." },
      { question: "Can a syringe be selected from volume alone?", answer: "No. Volume is only one parameter. Check listed needle details, intended use, product format and method or instrument documentation as well." },
    ],
  },
  "hplc-fittings-tubing": {
    name: "HPLC Fittings & Tubing",
    catalogSlug: "hplc-fittings-tubing",
    catalogHref: "/products?category=22",
    eyebrow: "HPLC Fluidic Connection Selection",
    heading: "HPLC Fittings and Tubing for Chromatography Fluidic Connections",
    summary: "Explore HPLC fittings and tubing, including listed PEEK and stainless-steel components, and compare connection format, tubing dimensions, material, pressure rating and package quantity.",
    overview: "HPLC fittings and tubing connect components in the chromatographic flow path. Selection should start with the existing port and thread format, tubing outer and inner diameter, material compatibility and documented pressure requirements. Review the exact part number and system documentation before changing a fluidic connection.",
    selectionPoints: [
      "Confirm the port or thread format and match it with listed fitting and tubing outer-diameter requirements.",
      "Compare tubing inner diameter, material, length and stated pressure rating with the intended flow path and system conditions.",
      "Use the exact part number to review package quantity and avoid assuming that fittings, ferrules or tubing are included unless listed.",
    ],
    relatedLinks: [
      { href: "/resources/peek-tubing-fittings-hplc-selection-guide", label: "Read the PEEK tubing and fittings guide", description: "Use the existing resource to compare materials, dimensions and connection requirements." },
      { href: "/resources/hplc-system-maintenance-guide", label: "Review HPLC system maintenance guidance", description: "Use the maintenance resource when evaluating a fluidic-connection change in the wider instrument workflow." },
    ],
    faq: [
      { question: "What should be checked before selecting HPLC tubing?", answer: "Check listed tubing outer and inner diameter, material, length, pressure rating and the connection requirements of the existing system." },
      { question: "Are PEEK and stainless-steel fittings interchangeable?", answer: "Material and connection suitability depend on the method, solvent exposure, pressure requirement and hardware configuration. Compare the exact listed component with system documentation before installation." },
      { question: "Why is tubing inner diameter important?", answer: "Inner diameter influences the physical flow path and dead volume. Use the intended method and system configuration to determine the appropriate listed tubing dimensions." },
    ],
  },
};

export const CATEGORY_LANDING_SLUGS = Object.keys(CATEGORY_LANDING_PROFILES);
