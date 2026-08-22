export type VerifiedLiteratureRecoveryEntry = {
  slug: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string | null;
  url: string;
  applicationArea: 'pharmaceutical' | 'biopharmaceutical';
  summary: string;
  keyFindings: string;
  relevance: string;
  keywords: string;
  originalPaperUrl: string;
  expandedAnalysis: string;
  methodologyDetails: {
    hplc_system: string;
    column: { type: string; dimensions: string; particle_size: string; temperature: string };
    mobile_phase: { composition: string; flow_rate: string; gradient: string; ph: string };
    detection: { type: string; wavelength: string };
  };
  practicalGuide: string;
};

/**
 * Curated original guidance for two formerly missing, high-impression literature URLs.
 * The entries deliberately avoid reproducing copyrighted experimental recipes, figures,
 * tables, or text from the cited publications. They provide only independent method
 * planning and validation guidance, with the source article linked for attribution.
 */
export const VERIFIED_HIGH_VISIBILITY_LITERATURE_RECOVERY: readonly VerifiedLiteratureRecoveryEntry[] = [
  {
    slug: 'development-and-validation-of-a-hplc-uv-method-for-urea-and-related-impurities',
    title: 'Urea and Related Impurities by HPLC-UV: Method Development Considerations',
    authors: 'ROWELL Technical Editorial Team',
    journal: 'ROWELL Technical Guide',
    year: 2026,
    doi: null,
    url: 'https://www.rowellhplc.com/learning/literature/development-and-validation-of-a-hplc-uv-method-for-urea-and-related-impurities',
    applicationArea: 'biopharmaceutical',
    summary: `This original technical guide outlines a structured way to plan an HPLC-UV assay for urea and related impurities in a biopharmaceutical support setting. Urea is used in protein purification, column cleaning, and refolding workflows, so laboratories may need to establish identity, assay, and impurity control appropriate to their own material, process, and quality system.\n\nA published 2020 study reported the HPLC-UV separation of urea together with biuret, cyanuric acid, and triuret, and evaluated specificity, linearity, accuracy, identity, precision, and robustness. This page is an independent planning resource based on that public abstract; it is not a reproduction of the publication or a ready-to-run validated method.`,
    keyFindings: `- Begin with a written analytical target profile that distinguishes assay, identity, and impurity-resolution needs.\n- Include urea and the relevant impurity panel in selectivity work before selecting final conditions.\n- Treat UV response, sample preparation, and matrix effects as method-development variables requiring local evidence.\n- Predefine acceptance criteria and validate the final procedure under the laboratory's applicable quality framework.`,
    relevance: `For chromatography teams, the key decision is not simply whether a urea peak can be detected. The procedure must demonstrate suitable separation from the impurity species that matter to the intended use. A mixed-mode separation has been reported in the cited research context, but column chemistry and operating conditions must be selected and qualified locally against the actual sample matrix.`,
    keywords: 'urea, biuret, cyanuric acid, triuret, HPLC-UV, mixed-mode chromatography, method validation, biopharmaceutical analytics',
    originalPaperUrl: 'https://pubmed.ncbi.nlm.nih.gov/31209168/',
    expandedAnalysis: `## Why this analysis is challenging\n\nUrea and small polar impurity species can create a selectivity problem rather than a simple detection problem. A useful development program therefore starts by defining which components must be separated, which matrices will be tested, and what reporting limits are appropriate for the intended material-use decision.\n\n## A risk-based development sequence\n\nFirst, establish sample solubility, stability, filtration compatibility, and a representative impurity mixture. Next, screen column modes and mobile-phase conditions for selectivity, peak shape, and repeatable response. After a candidate method is selected, challenge it with expected matrix components and deliberate small changes to the chosen conditions. The final validation protocol should be based on the analytical purpose and the governing quality requirements.\n\n## Interpreting published work responsibly\n\nThe cited paper is a useful scientific reference because its abstract identifies the impurity classes and performance characteristics considered. It does not replace local feasibility work, method transfer, or approval. This guide intentionally omits its proprietary or copyrighted procedural detail and directs readers to the source record for bibliographic attribution.`,
    methodologyDetails: {
      hplc_system: 'Use an HPLC system with UV detection that has been qualified for the intended analytical range and data-integrity requirements.',
      column: {
        type: 'Select a stationary phase through local selectivity screening; mixed-mode approaches are one literature context for this analyte and impurity class.',
        dimensions: 'Define during development according to resolution, pressure, and throughput requirements.',
        particle_size: 'Define during development according to column efficiency and system-pressure constraints.',
        temperature: 'Assess and control during robustness studies where relevant.',
      },
      mobile_phase: {
        composition: 'Develop locally from selectivity and detector-compatibility evidence; do not adopt literature conditions without verification.',
        flow_rate: 'Set after column and system selection, then include in robustness assessment.',
        gradient: 'Use an isocratic or gradient strategy only after demonstrating required separation and repeatability.',
        ph: 'Control where relevant to retention, selectivity, and analyte stability.',
      },
      detection: {
        type: 'UV detection',
        wavelength: 'Select and verify locally for adequate response and interference control.',
      },
    },
    practicalGuide: `## Development checklist\n\n1. Define the reportable result: assay, identification support, impurity quantitation, or a combination.\n2. Build a standards and sample plan that covers urea plus the impurity species relevant to the material specification.\n3. Screen separation conditions against peak resolution, UV response, carryover, and system suitability.\n4. Document the final validation protocol before executing accuracy, precision, linearity or range, specificity, and robustness work.\n5. Confirm that the final procedure remains suitable after transfer to the laboratory, instrument, and sample matrix that will use it.\n\nFor neutral catalog orientation while preparing a local screening plan, [browse HPLC column options](/products?search=HPLC%20Column). Product selection must remain subject to local feasibility, method-development, and validation evidence.\n\n> This is technical planning information, not an approved compendial method or a substitute for laboratory validation.`,
  },
  {
    slug: 'empagliflozin-hplc-based-analytical-method-development-and-application-to-pharma',
    title: 'Empagliflozin HPLC Method Development: A Practical Analytical Planning Guide',
    authors: 'ROWELL Technical Editorial Team',
    journal: 'ROWELL Technical Guide',
    year: 2026,
    doi: null,
    url: 'https://www.rowellhplc.com/learning/literature/empagliflozin-hplc-based-analytical-method-development-and-application-to-pharma',
    applicationArea: 'pharmaceutical',
    summary: `This original guide provides a practical planning framework for developing an HPLC procedure for empagliflozin in drug substance or dosage-form contexts. The work should begin with the intended use: routine assay, impurity control, stability indication, or a formulation-specific application. Each purpose creates a different selectivity, sensitivity, and validation requirement.\n\nA 2021 publication indexed in PubMed described HPLC method development for quantifying empagliflozin in raw material and pharmaceutical dosage forms and reported validation under ICH guidance. This guide uses that public research context only to frame independent development questions; it does not reproduce the published experimental method.`,
    keyFindings: `- Write the analytical target profile before choosing a column, mobile phase, detector setting, or reportable range.\n- Demonstrate that the method is selective for the intended sample matrix, including excipients, degradation products, or related substances as applicable.\n- Verify calibration behavior, sample-solution stability, and recovery in the actual matrix rather than relying on solvent-only performance.\n- Use a validation plan aligned with the current regulatory and internal quality expectations for the procedure's intended use.`,
    relevance: `Published studies show that reverse-phase HPLC has been used for empagliflozin assay and that stability-indicating applications require a distinct stress-testing and peak-purity strategy. The column and consumable decision should follow documented screening results and local system-suitability targets, rather than a generic product recommendation.`,
    keywords: 'empagliflozin, HPLC, RP-HPLC, pharmaceutical analysis, method development, method validation, stability indicating method, dosage form analysis',
    originalPaperUrl: 'https://pubmed.ncbi.nlm.nih.gov/34602436/',
    expandedAnalysis: `## Start with the analytical purpose\n\nAn assay method for a drug substance, a finished-product assay, a related-substances method, and a stability-indicating method should not be treated as interchangeable. The target profile should identify the matrix, expected concentration range, reporting objective, critical interferences, and required decision limits before experimental screening begins.\n\n## Use screening to make the separation defensible\n\nA disciplined screen considers stationary-phase selectivity, organic modifier, buffer or pH strategy, sample diluent, detection response, and runtime together. For tablet work, evaluate placebo interference and extraction recovery. For stability-indicating work, demonstrate separation from stress-related peaks using an appropriate, preapproved study design.\n\n## Validate the implemented method, not a citation\n\nThe laboratory should document accuracy, precision, specificity, linearity or range, robustness, and solution stability in the form required by its procedure. Published data may support scientific rationale, but it cannot replace local validation or method-transfer evidence.`,
    methodologyDetails: {
      hplc_system: 'Use a qualified liquid chromatography system with an appropriate UV or diode-array detector and documented data-integrity controls.',
      column: {
        type: 'Use local column screening to establish selectivity; reversed-phase HPLC is a common starting platform in published empagliflozin studies.',
        dimensions: 'Select after balancing resolution, pressure, and throughput for the intended method.',
        particle_size: 'Select after considering efficiency, pressure, and lifecycle reproducibility.',
        temperature: 'Evaluate control needs during robustness assessment.',
      },
      mobile_phase: {
        composition: 'Develop locally with attention to separation selectivity, detector compatibility, and sample stability.',
        flow_rate: 'Optimize for the selected column and system, then evaluate small deliberate changes for robustness.',
        gradient: 'Choose only after it is shown to meet the required separation objective.',
        ph: 'Control where it affects retention, peak shape, or analyte and impurity stability.',
      },
      detection: {
        type: 'UV or diode-array detection as supported by local feasibility work.',
        wavelength: 'Select and confirm locally for response, baseline behavior, and interference control.',
      },
    },
    practicalGuide: `## Development checklist\n\n1. State whether the procedure is for assay, impurities, stability indication, or a formulation-specific question.\n2. Assemble representative API, formulation, placebo, and relevant impurity or stress samples before finalizing conditions.\n3. Screen selectivity and extraction recovery, then lock a system-suitability approach that tests the critical separation.\n4. Execute validation according to the approved protocol and the method's intended use.\n5. Establish lifecycle controls for column changes, mobile-phase preparation, system maintenance, and method transfer.\n\nFor neutral catalog orientation while preparing a local screening plan, [browse HPLC column options](/products?search=HPLC%20Column). Product selection must remain subject to local feasibility, method-development, and validation evidence.\n\n> This guide is educational content. It is not a regulatory filing method, a pharmacopoeial monograph, or a substitute for validated laboratory work.`,
  },
] as const;
